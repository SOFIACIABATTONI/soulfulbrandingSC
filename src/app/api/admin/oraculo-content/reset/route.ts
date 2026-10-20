import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import { buildDefaultOraculoPageContent } from "@/lib/oraculo-page-content";
import { saveOraculoPageContent } from "@/lib/oraculo-content-store";

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const paymentLink = process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() || "";
  const data = buildDefaultOraculoPageContent(paymentLink);

  try {
    await saveOraculoPageContent(data);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[oraculo-content][reset]", error);
    return NextResponse.json({ error: "No se pudo restaurar." }, { status: 503 });
  }
}
