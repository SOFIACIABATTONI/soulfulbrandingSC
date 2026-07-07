import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAccessTokenByPlain,
  isAccessTokenExpired,
} from "@/lib/access-service";
import { HTML_PHASE_SEND, purposeToHtmlPhaseKey } from "@/lib/phase-client-flow";
import { storageKeyForHtmlPhase } from "@/lib/phase-client-store";
import { parseProjectPhases } from "@/lib/prebrief-service";
import {
  buildPhaseDocDownloadHtml,
  phaseDocDownloadFilename,
} from "@/lib/phase-doc-download";
import { brandKitFromPhaseData, brandKitHasContent } from "@/lib/brand-kit";
import { resolveClientPortalHtmlBody } from "@/lib/phase-client-portal";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token);
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  const phaseKey = purposeToHtmlPhaseKey(record.purpose);
  if (!phaseKey) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const storageKey = storageKeyForHtmlPhase(phaseKey);

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    select: { title: true, phases: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const phaseData = phases[storageKey] ?? {};
  const html = (phaseData.body ?? "").trim();
  const brandKit = brandKitFromPhaseData(phaseData);
  const hasBrandKit = phaseKey === "identidad" && brandKitHasContent(brandKit);
  const clientHtml = resolveClientPortalHtmlBody(phaseKey, html, { hasBrandKit });
  if ((!clientHtml || clientHtml === "<p></p>") && !hasBrandKit) {
    return NextResponse.json({ error: "Documento no disponible." }, { status: 404 });
  }

  const config = HTML_PHASE_SEND[phaseKey];
  const downloadHtml = buildPhaseDocDownloadHtml({
    portalTitle: config.portalTitle,
    projectTitle: project.title,
    clientName: record.client.name,
    htmlBody: clientHtml,
    brandKit: hasBrandKit ? brandKit : undefined,
  });
  const filename = phaseDocDownloadFilename(config.portalTitle, project.title);

  return new Response(downloadHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
