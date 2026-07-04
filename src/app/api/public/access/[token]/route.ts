import { NextResponse } from "next/server";
import {
  findAccessTokenByPlain,
  validateAccessToken,
} from "@/lib/access-service";
import { resolveContractContent } from "@/lib/contract-default-content";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token);
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  const validationError = validateAccessToken(record);
  const content = resolveContractContent({
    ...record.project,
    client: record.client,
  });

  return NextResponse.json({
    purpose: record.purpose,
    clientName: record.client.name,
    projectTitle: record.project.title,
    service: record.project.service,
    value: record.project.value,
    content,
    contractStatus: record.project.contractStatus,
    expiresAt: record.expiresAt,
    usedAt: record.usedAt,
    canAccept: !validationError && record.purpose === "contrato",
    error: validationError,
  });
}
