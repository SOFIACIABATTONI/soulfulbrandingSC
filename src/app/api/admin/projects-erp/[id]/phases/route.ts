import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { z } from "zod";

// PATCH /api/admin/projects-erp/[id]/phases
// Body: { phase, state?, content?: { overview, objective, deliverables, assets, notes, owner } }
const patchSchema = z.object({
  phase: z.enum(["onboarding", "prebrief", "narrativa", "identidad", "manual"]),
  state: z.enum(["done", "active", "pending"]).optional(),
  content: z
    .object({
      overview: z.string().optional(),
      objective: z.string().optional(),
      deliverables: z.string().optional(),
      assets: z.string().optional(),
      notes: z.string().optional(),
      owner: z.string().optional(),
    })
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { phase, state, content } = parsed.data;
  try {
    const project = await prisma.clientProject.findUnique({
      where: { id },
      select: { phases: true },
    });
    if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const phases = (project.phases as Record<string, Record<string, string> | string>) ?? {};
    // migrar formato viejo (string) al nuevo (objeto)
    const current = typeof phases[phase] === "object" ? (phases[phase] as Record<string, string>) : {};
    phases[phase] = {
      ...current,
      ...(state !== undefined ? { state } : {}),
      ...(content ?? {}),
    };

    const updated = await prisma.clientProject.update({
      where: { id },
      data: { phases },
    });
    return NextResponse.json({ ok: true, phases: updated.phases });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
