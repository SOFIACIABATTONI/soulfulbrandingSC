import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import {
  buildDefaultOraculoPageContent,
  parseOraculoPageContent,
  type OraculoPageContentData,
} from "@/lib/oraculo-page-content";
import {
  getOraculoPageContentRow,
  isOraculoContentPersistenceReady,
  saveOraculoPageContent,
} from "@/lib/oraculo-content-store";
import { ADMIN_SAVE_FAILED } from "@/lib/admin-user-messages";

function saveErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  ) {
    console.error("[oraculo-content][PUT] OraculoPageContent table missing (P2021)");
    return ADMIN_SAVE_FAILED;
  }
  return ADMIN_SAVE_FAILED;
}

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
  const canPersist = await isOraculoContentPersistenceReady();

  return NextResponse.json({
    data,
    fromDatabase: Boolean(stored),
    canPersist,
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
    revalidatePath("/oraculo");
    return NextResponse.json({ ok: true, data: parsed });
  } catch (error) {
    console.error("[oraculo-content][PUT]", error);
    return NextResponse.json({ error: saveErrorMessage(error) }, { status: 503 });
  }
}
