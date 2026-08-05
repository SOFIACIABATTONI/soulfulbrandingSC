import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { buildInvoicePdf, invoicePdfFilename } from "@/lib/invoice-pdf";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, company: true } },
      project: { select: { title: true, value: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (invoice.type !== "sena" && invoice.type !== "final") {
    return NextResponse.json({ error: "Tipo de documento no soportado" }, { status: 400 });
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
      "Cache-Control": "private, no-cache",
    },
  });
}
