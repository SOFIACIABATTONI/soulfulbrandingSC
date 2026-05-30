import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { quoteExpiryFromNow } from "@/lib/quote-service";
import { freshTokenForSend } from "@/lib/quote-token";
import { sendQuoteEmailToClient } from "@/lib/send-quote-email";
import { quotePublicUrl } from "@/lib/quote-url";
import type { QuoteContent } from "@/lib/quote-types";

type RouteParams = { params: Promise<{ id: string; quoteId: string }> };

export async function POST(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id: leadId, quoteId } = await ctx.params;

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, leadId },
    include: { lead: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (quote.status !== "borrador") {
    return NextResponse.json(
      { error: "Este presupuesto ya fue enviado o cerrado" },
      { status: 409 },
    );
  }

  const content = quote.content as QuoteContent;
  const { plain, hash } = freshTokenForSend();
  const now = new Date();

  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "enviado",
        tokenHash: hash,
        sentAt: now,
        expiresAt: quoteExpiryFromNow(),
      },
    });
    await tx.lead.update({
      where: { id: leadId },
      data: { pipelineStep: "presupuesto" },
    });
    return updated;
  });

  const emailed = await sendQuoteEmailToClient({
    toEmail: quote.lead.email,
    toName: quote.lead.name,
    content,
    token: plain,
  });

  return NextResponse.json({
    ok: true,
    item,
    emailed,
    publicUrl: quotePublicUrl(plain),
    /** En dev, por si Resend no está configurado */
    publicToken: process.env.NODE_ENV === "development" ? plain : undefined,
  });
}
