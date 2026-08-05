import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const project = await prisma.clientProject.findUnique({
    where: { id },
    select: { id: true, deepDiveDoneAt: true },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const doneAt = project.deepDiveDoneAt ?? new Date();
  await prisma.clientProject.update({
    where: { id },
    data: {
      deepDiveStatus: "realizado",
      deepDiveDoneAt: doneAt,
    },
  });

  return NextResponse.json({
    ok: true,
    deepDiveStatus: "realizado",
    deepDiveDoneAt: doneAt.toISOString(),
  });
}
