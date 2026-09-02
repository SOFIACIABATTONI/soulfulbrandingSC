import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, requestClientIp } from "@/lib/rate-limit";
import { sendContactEmailNotification } from "@/lib/send-contact-email";
import { ORACULO_PAYMENT } from "@/lib/oraculo-content";

export const runtime = "nodejs";

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
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
  const country = String(form.get("country") ?? "").trim();
  const receipt = form.get("receipt");

  if (!name || name.length > 200) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (country !== "ar" && country !== "es") {
    return NextResponse.json({ error: "País inválido" }, { status: 400 });
  }
  if (!(receipt instanceof File) || receipt.size === 0) {
    return NextResponse.json({ error: "Falta el comprobante de pago" }, { status: 400 });
  }
  if (receipt.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json({ error: "El comprobante supera 10 MB" }, { status: 400 });
  }
  const mime = receipt.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mime)) {
    return NextResponse.json({ error: "Formato de comprobante no permitido" }, { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "Subida temporalmente no disponible." }, { status: 503 });
  }

  const safeName = receipt.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  const blobPath = `oraculo/receipts/${Date.now()}-${safeName}`;

  let receiptUrl: string;
  try {
    const blob = await put(blobPath, receipt, {
      access: "public",
      token,
      contentType: mime,
    });
    receiptUrl = blob.url;
  } catch (error) {
    console.error("[api/oraculo/order] blob upload failed", error);
    return NextResponse.json({ error: "No se pudo subir el comprobante." }, { status: 503 });
  }

  const price = country === "ar" ? ORACULO_PAYMENT.ar.price : ORACULO_PAYMENT.es.price;
  const countryLabel = country === "ar" ? ORACULO_PAYMENT.ar.label : ORACULO_PAYMENT.es.label;

  const message = [
    "Pedido Oráculo Raíz",
    "",
    `País / pago: ${countryLabel} (${price})`,
    `Comprobante: ${receiptUrl}`,
    "",
    "Enviar acceso al material en las próximas 24 h.",
  ].join("\n");

  await prisma.contactMessage.create({
    data: {
      name,
      email,
      message,
      formKey: "oraculo-raiz",
      stageTitle: "Oráculo Raíz — compra",
    },
  });

  await sendContactEmailNotification({
    name,
    email,
    message,
    formKey: "oraculo-raiz",
    stageTitle: "Oráculo Raíz — compra",
  });

  return NextResponse.json({ ok: true });
}
