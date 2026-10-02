import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  OraculoReceiptStorageError,
  uploadOraculoReceipt,
} from "@/lib/oraculo-receipt-upload";
import { checkRateLimit, requestClientIp } from "@/lib/rate-limit";
import { sendOraculoOrderAdminNotification } from "@/lib/send-oraculo-order-admin-email";
import { ORACULO_PAYMENT } from "@/lib/oraculo-content";

export const runtime = "nodejs";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(req: Request) {
  const ip = requestClientIp(req);
  if (!checkRateLimit("oraculo-order", ip, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos. Probá más tarde." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const countryRaw = String(form.get("country") ?? "").trim();
  const receipt = form.get("receipt");

  if (!name || name.length > 200) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  const country = countryRaw === "ar" || countryRaw === "es" ? countryRaw : null;
  if (!(receipt instanceof File) || receipt.size === 0) {
    return NextResponse.json({ error: "Falta el comprobante de pago" }, { status: 400 });
  }
  if (receipt.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json({ error: "El comprobante supera 5 MB" }, { status: 400 });
  }
  const mime = receipt.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mime)) {
    return NextResponse.json({ error: "Formato de comprobante no permitido" }, { status: 400 });
  }

  const safeName = receipt.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  const buf = Buffer.from(await receipt.arrayBuffer());

  let receiptUrl: string;
  try {
    receiptUrl = await uploadOraculoReceipt(buf, safeName, mime);
  } catch (error) {
    console.error("[api/oraculo/order] upload failed", error);
    const msg =
      error instanceof OraculoReceiptStorageError
        ? error.message
        : "No se pudo subir el comprobante.";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const countryLabel =
    country === "ar"
      ? ORACULO_PAYMENT.ar.label
      : country === "es"
        ? ORACULO_PAYMENT.es.label
        : "No indicado en el formulario";
  const price =
    country === "ar" ? ORACULO_PAYMENT.ar.price : country === "es" ? ORACULO_PAYMENT.es.price : "—";

  const message = [
    "Pedido Oráculo Raíz",
    "",
    `País / pago: ${countryLabel}${price !== "—" ? ` (${price})` : ""}`,
    `Comprobante: ${receiptUrl}`,
    "",
    "Enviar acceso al material en las próximas 24 h.",
  ].join("\n");

  const created = await prisma.contactMessage.create({
    data: {
      name,
      email,
      message,
      formKey: "oraculo-raiz",
      stageTitle: "Oráculo Raíz — compra",
    },
  });

  await sendOraculoOrderAdminNotification({
    name,
    email,
    message,
    contactMessageId: created.id,
  });

  return NextResponse.json({ ok: true });
}
