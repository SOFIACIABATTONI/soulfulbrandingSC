import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import {
  contractContentSchema,
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
} from "@/lib/contract-types";
import { resolveContractContent } from "@/lib/contract-default-content";

type RouteParams = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  content: contractContentSchema,
});

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const project = await prisma.clientProject.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true, email: true } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const content = resolveContractContent({
    title: project.title,
    service: project.service,
    value: project.value,
    contractContent: project.contractContent,
    client: project.client,
  });
  const status = project.contractStatus as ContractStatus;

  return NextResponse.json({
    content,
    status,
    statusLabel: CONTRACT_STATUS_LABELS[status] ?? status,
    contractSentAt: project.contractSentAt,
    contractAcceptedAt: project.contractAcceptedAt,
    client: project.client,
    project: {
      id: project.id,
      title: project.title,
      service: project.service,
      value: project.value,
    },
  });
}

export async function PATCH(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const project = await prisma.clientProject.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (project.contractStatus === "aceptado") {
    return NextResponse.json(
      { error: "El contrato ya fue aceptado y no se puede editar" },
      { status: 409 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const item = await prisma.clientProject.update({
    where: { id },
    data: {
      contractContent: parsed.data.content as object,
      contractStatus: project.contractStatus === "enviado" ? "enviado" : "borrador",
    },
  });

  return NextResponse.json({ ok: true, item });
}
