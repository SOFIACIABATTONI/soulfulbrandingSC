import { NextResponse } from "next/server";
import {
  findAccessTokenByPlain,
  isAccessTokenExpired,
} from "@/lib/access-service";
import { storageKeyForHtmlPhase } from "@/lib/phase-client-store";
import { parseProjectPhases } from "@/lib/prebrief-service";
import { prisma } from "@/lib/prisma";
import { getManualPdfFromPhase } from "@/lib/manual-pdf";
import { resolveBrandAssetUrl } from "@/lib/brand-kit-zip";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token);
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (record.purpose !== "manual") {
    return NextResponse.json({ error: "No disponible." }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    select: { phases: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const phaseData = phases[storageKeyForHtmlPhase("manual")] ?? {};
  const pdf = getManualPdfFromPhase(phaseData);
  if (!pdf) {
    return NextResponse.json({ error: "PDF no disponible." }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    new URL(req.url).origin;
  const assetUrl = resolveBrandAssetUrl(pdf.url, baseUrl);

  const res = await fetch(assetUrl, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: "No se pudo obtener el PDF." }, { status: 502 });
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const safeName = pdf.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-") || "manual-de-marca.pdf";

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": pdf.mime || "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
