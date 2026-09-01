import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminToken, ADMIN_COOKIE_NAME } from "@/lib/session";
import { checkRateLimit, requestClientIp } from "@/lib/rate-limit";

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60_000;

export async function POST(req: Request) {
  const ip = requestClientIp(req);
  if (!checkRateLimit("admin-login", ip, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password ?? "";
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ ok: false, error: "Credenciales incorrectas" }, { status: 401 });
  }
  const token = await createAdminToken();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ ok: true });
}
