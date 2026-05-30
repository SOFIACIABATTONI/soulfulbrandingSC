import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { generateQuoteToken, hashQuoteToken } from "@/lib/quote-token";
import { buildDefaultQuoteContent } from "@/lib/quote-default-content";
import { quoteContentSchema } from "@/lib/quote-types";
import { quoteExpiryFromNow } from "@/lib/quote-service";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const createSchema = z.object({
  content: quoteContentSchema.optional(),
});

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id: leadId } = await ctx.params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }
  const items = await prisma.quote.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      leadId: true,
      status: true,
      content: true,
      clientResponse: true,
      clientComment: true,
      expiresAt: true,
      sentAt: true,
      viewedAt: true,
      respondedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id: leadId } = await ctx.params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const content = parsed.data.content ?? buildDefaultQuoteContent(lead);
  const plain = generateQuoteToken();

  const item = await prisma.quote.create({
    data: {
      leadId,
      status: "borrador",
      tokenHash: hashQuoteToken(plain),
      content,
      expiresAt: quoteExpiryFromNow(),
    },
  });

  return NextResponse.json({
    ok: true,
    item,
    /** Solo al crear: copiar para pruebas locales si no hay Resend */
    publicToken: process.env.NODE_ENV === "development" ? plain : undefined,
  });
}
