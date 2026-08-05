import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashQuoteToken } from "@/lib/quote-token";
import { buildInvoicePdf, invoicePdfFilename } from "@/lib/invoice-pdf";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { tokenHash: hashQuoteToken(token) },
    include: {
      client: { select: { name: true, company: true } },
      project: { select: { title: true, value: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Enlace no válido o expirado" }, { status: 404 });
  }

  if (invoice.type !== "sena" && invoice.type !== "final") {
    return NextResponse.json({ error: "Documento no disponible" }, { status: 400 });
  }

  const pdfBytes = await buildInvoicePdf({
    number: invoice.number,
    type: invoice.type,
    total: invoice.total,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    paidAt: invoice.paidAt,
    notes: invoice.notes,
    client: invoice.client,
    project: invoice.project,
  });

  const filename = invoicePdfFilename({ type: invoice.type, number: invoice.number });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
