import { NextResponse } from "next/server";
import { findQuoteByPlainToken } from "@/lib/quote-service";
import {
  checkPublicQuoteRateLimit,
  clientRateLimitKey,
} from "@/lib/public-quote-rate-limit";
import { normalizeQuoteContent } from "@/lib/quote-types";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (!checkPublicQuoteRateLimit(clientRateLimitKey(req, token))) {
    return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 });
  }

  let quote = await findQuoteByPlainToken(token);
  if (!quote) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (quote.status === "enviado") {
    quote = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "visto", viewedAt: new Date() },
      include: { lead: { select: { id: true, name: true, email: true } } },
    });
  }

  const content = normalizeQuoteContent(quote.content);
  const terminal = ["aprobado", "rechazado", "consultar", "expirado"].includes(quote.status);

  return NextResponse.json({
    quote: {
      status: quote.status,
      content: {
        body: content.body,
        format: content.format,
        videoUrl: content.videoUrl,
        total: content.total,
        currency: content.currency,
      },
      clientName: quote.lead.name.split(/\s+/)[0] || quote.lead.name,
      expiresAt: quote.expiresAt,
      respondedAt: quote.respondedAt,
      clientResponse: quote.clientResponse,
      canRespond: !terminal && quote.status !== "borrador",
    },
  });
}
