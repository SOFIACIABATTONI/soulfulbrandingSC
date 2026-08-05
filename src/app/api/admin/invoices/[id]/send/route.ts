import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { sendInvoiceEmailToClient } from "@/lib/send-invoice-email";
import { generateQuoteToken, hashQuoteToken } from "@/lib/quote-token";
import { invoicePublicPdfUrl } from "@/lib/invoice-public-url";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  personalNote: z.string().optional(),
});

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, company: true, email: true } },
      project: { select: { title: true, value: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (invoice.type !== "sena" && invoice.type !== "final") {
    return NextResponse.json({ error: "Tipo de documento no soportado" }, { status: 400 });
  }

  let plain = invoice.publicToken;

  try {
    if (!plain) {
      const candidate = generateQuoteToken();
      await prisma.invoice.updateMany({
        where: { id, publicToken: null },
        data: {
          publicToken: candidate,
          tokenHash: hashQuoteToken(candidate),
        },
      });
      const persisted = await prisma.invoice.findUnique({
        where: { id },
        select: { publicToken: true },
      });
      plain = persisted?.publicToken ?? candidate;
    }

    await prisma.invoice.update({
      where: { id },
      data: {
        publicToken: plain,
        tokenHash: hashQuoteToken(plain),
      },
    });
  } catch (err) {
    console.error("[invoice] public token update:", err);
    return NextResponse.json(
      {
        ok: false,
        emailed: false,
        error:
          "Falta aplicar la migración de base de datos. Reiniciá el servidor (npm run dev) después de npx prisma migrate deploy.",
      },
      { status: 500 },
    );
  }

  const emailed = await sendInvoiceEmailToClient({
    toEmail: invoice.client.email,
    toName: invoice.client.name,
    personalNote: parsed.data.personalNote,
    publicToken: plain,
    invoice: {
      number: invoice.number,
      type: invoice.type,
      total: invoice.total,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      paidAt: invoice.paidAt,
      notes: invoice.notes,
      client: invoice.client,
      project: invoice.project,
    },
  });

  let emailSentAt: Date | null = invoice.emailSentAt;
  if (emailed) {
    emailSentAt = new Date();
    await prisma.invoice.update({
      where: { id },
      data: { emailSentAt },
    });
  }

  return NextResponse.json({
    ok: true,
    emailed,
    emailSentAt: emailSentAt?.toISOString() ?? null,
    publicUrl: invoicePublicPdfUrl(plain),
    publicToken: process.env.NODE_ENV === "development" ? plain : undefined,
    message: emailed
      ? "Correo enviado con el PDF adjunto y botón «Ver recibo»."
      : "Link generado. Configurá Resend (RESEND_API_KEY y RESEND_FROM) para enviar el mail automáticamente.",
  });
}
