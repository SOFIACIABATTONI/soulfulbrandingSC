import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import {
  appendOraculoDeliveryRecord,
  isOraculoOrderMessage,
  parseOraculoDeliveryInfo,
} from "@/lib/oraculo-order-parse";
import { getOraculoDeliveryYoutubeUrl } from "@/lib/oraculo-delivery-assets";
import { sendOraculoAccessEmailToClient } from "@/lib/send-oraculo-access-email";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  downloadLink: z.string().url().max(2000),
  youtubeLink: z.string().max(500).optional(),
  resend: z.boolean().optional(),
});

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Link de descarga inválido" }, { status: 400 });
  }

  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg || !isOraculoOrderMessage(msg.formKey, msg.message)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const prior = parseOraculoDeliveryInfo(msg.message);
  if (prior.sentAt && !parsed.data.resend) {
    return NextResponse.json(
      {
        error: "Ya se envió el acceso a este cliente. Marcá reenviar si querés mandarlo otra vez.",
        delivery: prior,
      },
      { status: 409 },
    );
  }

  const downloadLink = parsed.data.downloadLink.trim();
  const youtubeRaw = parsed.data.youtubeLink?.trim() || "";
  if (youtubeRaw && !/^https?:\/\//i.test(youtubeRaw)) {
    return NextResponse.json({ error: "Link de YouTube inválido" }, { status: 400 });
  }
  const youtubeLink = youtubeRaw || getOraculoDeliveryYoutubeUrl() || null;
  const sent = await sendOraculoAccessEmailToClient({
    toEmail: msg.email,
    toName: msg.name,
    downloadLink,
    youtubeLink,
  });

  if (!sent) {
    return NextResponse.json(
      { error: "No se pudo enviar el correo. Revisá RESEND_API_KEY y RESEND_FROM." },
      { status: 503 },
    );
  }

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: {
      status: "contactado",
      message: appendOraculoDeliveryRecord(msg.message, downloadLink, youtubeLink),
    },
  });

  const delivery = parseOraculoDeliveryInfo(updated.message);
  return NextResponse.json({ ok: true, delivery, message: updated.message });
}
