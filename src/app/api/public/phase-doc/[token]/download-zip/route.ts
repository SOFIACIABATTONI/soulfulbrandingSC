import { NextResponse } from "next/server";
import {
  findAccessTokenByPlain,
  isAccessTokenExpired,
} from "@/lib/access-service";
import { HTML_PHASE_SEND, purposeToHtmlPhaseKey } from "@/lib/phase-client-flow";
import { storageKeyForHtmlPhase } from "@/lib/phase-client-store";
import { parseProjectPhases } from "@/lib/prebrief-service";
import { prisma } from "@/lib/prisma";
import { brandKitFromPhaseData, brandKitHasContent } from "@/lib/brand-kit";
import {
  brandKitZipFilename,
  buildBrandKitZipBuffer,
} from "@/lib/brand-kit-zip";
import { resolveClientPortalHtmlBody } from "@/lib/phase-client-portal";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(req: Request, ctx: RouteParams) {
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

  if (!hasBrandKit && (!clientHtml || clientHtml === "<p></p>")) {
    return NextResponse.json({ error: "No hay recursos para descargar." }, { status: 404 });
  }

  const config = HTML_PHASE_SEND[phaseKey];
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    new URL(req.url).origin;

  const built = await buildBrandKitZipBuffer({
    baseUrl,
    portalTitle: config.portalTitle,
    projectTitle: project.title,
    clientName: record.client.name,
    brandKit,
    htmlBody: clientHtml && clientHtml !== "<p></p>" ? clientHtml : undefined,
  });

  if (!built) {
    return NextResponse.json({ error: "No se pudo generar el paquete ZIP." }, { status: 500 });
  }

  const filename = brandKitZipFilename(config.portalTitle, project.title);

  return new Response(new Uint8Array(built.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
