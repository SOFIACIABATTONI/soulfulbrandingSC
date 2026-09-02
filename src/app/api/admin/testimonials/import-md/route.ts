import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import { seedTestimonialsFromMdIfEmpty } from "@/lib/testimonials-seed";

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const count = await seedTestimonialsFromMdIfEmpty();
  if (count === 0) {
    return NextResponse.json(
      { error: "No hay testimonios para importar o la base ya tiene registros." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, count });
}
