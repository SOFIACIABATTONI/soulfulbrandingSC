import { NextResponse } from "next/server";
import { z } from "zod";
import {
  applyClientQuoteResponse,
  assertClientResponse,
  findQuoteByPlainToken,
} from "@/lib/quote-service";
import {
  checkPublicQuoteRateLimit,
  clientRateLimitKey,
} from "@/lib/public-quote-rate-limit";

type RouteParams = { params: Promise<{ token: string }> };

const bodySchema = z.object({
  response: z.enum(["aprobado", "rechazado", "consultar"]),
  comment: z.string().max(2000).optional().default(""),
});

export async function POST(req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (!checkPublicQuoteRateLimit(`respond:${clientRateLimitKey(req, token)}`)) {
    return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const response = assertClientResponse(parsed.data.response);
  if (!response) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  let quote = await findQuoteByPlainToken(token);
  if (!quote) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  const terminal = ["aprobado", "rechazado", "consultar", "expirado"];
  if (terminal.includes(quote.status)) {
    return NextResponse.json({
      ok: true,
      alreadyResponded: true,
      status: quote.status,
      clientResponse: quote.clientResponse,
    });
  }

  if (quote.status === "borrador") {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (quote.status === "expirado") {
    return NextResponse.json({ error: "Este presupuesto expiró" }, { status: 410 });
  }

  const updated = await applyClientQuoteResponse(
    quote,
    response,
    (parsed.data.comment ?? "").trim(),
  );

  return NextResponse.json({
    ok: true,
    status: updated.status,
    clientResponse: updated.clientResponse,
  });
}
