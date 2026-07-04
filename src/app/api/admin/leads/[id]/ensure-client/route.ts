import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import { ensureClientForLead } from "@/lib/client-provision";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const clientId = await ensureClientForLead(id);
  if (!clientId) {
    return NextResponse.json(
      { error: "No hay presupuesto aprobado ni lead ganado para vincular cliente" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, clientId });
}
