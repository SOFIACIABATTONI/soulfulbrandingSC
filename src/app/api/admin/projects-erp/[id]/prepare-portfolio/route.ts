import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { preparePortfolioDraftFromErp } from "@/lib/portfolio-prepare-from-erp";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const project = await prisma.clientProject.findUnique({
    where: { id },
    include: { client: { select: { name: true, company: true } } },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto ERP no encontrado" }, { status: 404 });
  }

  try {
    const result = await preparePortfolioDraftFromErp(project);
    return NextResponse.json({
      ...result,
      editPath: `/admin/projects/${encodeURIComponent(result.slug)}/publicar`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo preparar el caso";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
