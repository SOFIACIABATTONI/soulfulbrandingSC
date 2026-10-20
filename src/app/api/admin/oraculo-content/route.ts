import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import {
  buildDefaultOraculoPageContent,
  parseOraculoPageContent,
  type OraculoPageContentData,
} from "@/lib/oraculo-page-content";
import { getOraculoPageContentRow, saveOraculoPageContent } from "@/lib/oraculo-content-store";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const paymentLink = process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() || "";
  let stored: Awaited<ReturnType<typeof getOraculoPageContentRow>> = null;
  try {
    stored = await getOraculoPageContentRow();
  } catch (error) {
    console.error("[oraculo-content][GET] read failed", error);
  }
  const data = stored ?? buildDefaultOraculoPageContent(paymentLink);

  return NextResponse.json({
    data,
    fromDatabase: Boolean(stored),
  });
}

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as { data?: OraculoPageContentData };
  if (!body?.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const paymentLink = process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() || "";
  const parsed = parseOraculoPageContent(body.data, paymentLink);

  try {
    await saveOraculoPageContent(parsed);
    return NextResponse.json({ ok: true, data: parsed });
  } catch (error) {
    console.error("[oraculo-content][PUT]", error);
    return NextResponse.json(
      { error: "No se pudo guardar. Revisá la conexión a la base de datos." },
      { status: 503 },
    );
  }
}
