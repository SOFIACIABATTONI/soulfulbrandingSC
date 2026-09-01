import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth-api";
import { MergeClientsError, mergeClients } from "@/lib/merge-clients";

const bodySchema = z.object({
  sourceClientId: z.string().min(1),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: targetClientId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const result = await mergeClients(targetClientId, parsed.data.sourceClientId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof MergeClientsError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[admin/clients merge]", e);
    return NextResponse.json({ error: "No se pudo fusionar los clientes." }, { status: 500 });
  }
}
