import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { acceptancePdfFilename, buildContractAcceptancePdf } from "@/lib/contract-acceptance-pdf";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const acceptance = await prisma.contractAcceptance.findUnique({
    where: { projectId: id },
    include: {
      project: { select: { title: true, service: true, value: true } },
      client: { select: { name: true, email: true, company: true } },
    },
  });

  if (!acceptance) {
    return NextResponse.json({ error: "Sin registro de aceptación" }, { status: 404 });
  }

  const pdfBytes = await buildContractAcceptancePdf({
    id: acceptance.id,
    projectId: acceptance.projectId,
    clientEmail: acceptance.clientEmail,
    typedName: acceptance.typedName,
    termsAccepted: acceptance.termsAccepted,
    ipAddress: acceptance.ipAddress,
    userAgent: acceptance.userAgent,
    contentHash: acceptance.contentHash,
    contractHtml: acceptance.contractHtml,
    acceptedAt: acceptance.acceptedAt,
    project: acceptance.project,
    client: acceptance.client,
  });

  const filename = acceptancePdfFilename(acceptance.project.title);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
