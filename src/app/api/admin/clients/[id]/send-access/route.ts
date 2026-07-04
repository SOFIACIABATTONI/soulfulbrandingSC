import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { generateAccessToken, accessExpiryFromNow } from "@/lib/access-token";
import { ACCESS_EXPIRY_DAYS, ACCESS_PURPOSES } from "@/lib/contract-types";
import { accessPublicUrl } from "@/lib/access-url";
import { sendContractEmailToClient } from "@/lib/send-contract-email";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  purpose: z.enum(ACCESS_PURPOSES),
  projectId: z.string().min(1),
  personalNote: z.string().optional(),
});

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: clientId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { purpose, projectId, personalNote } = parsed.data;

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const project = await prisma.clientProject.findFirst({
    where: { id: projectId, clientId },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const plain = generateAccessToken();
  const expiresAt = accessExpiryFromNow(ACCESS_EXPIRY_DAYS);

  const token = await prisma.clientAccessToken.create({
    data: {
      token: plain,
      purpose,
      expiresAt,
      clientId,
      projectId,
    },
  });

  let emailed = false;
  if (purpose === "contrato") {
    emailed = await sendContractEmailToClient({
      toEmail: client.email,
      toName: client.name,
      projectTitle: project.title,
      token: plain,
      personalNote,
    });
  }

  return NextResponse.json({
    ok: true,
    token: {
      id: token.id,
      purpose: token.purpose,
      expiresAt: token.expiresAt,
    },
    publicUrl: accessPublicUrl(purpose, plain),
    emailed,
    publicToken: process.env.NODE_ENV === "development" ? plain : undefined,
  });
}
