import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import { syncTestimonialsFromMd } from "@/lib/testimonials-seed";

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const count = await syncTestimonialsFromMd();
  return NextResponse.json({ ok: true, count });
}
