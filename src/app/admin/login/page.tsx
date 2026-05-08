"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setErr("Contraseña incorrecta");
      return;
    }
    router.push(next.startsWith("/") ? next : "/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 pb-12 pt-8">
      <div className="text-center">
        <p className="font-serif text-sm italic text-neutral-500">Soulful Branding®</p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-brand-navy">
          Administración
        </h1>
        <p className="mt-2 text-sm text-neutral-600">Ingresá la contraseña para continuar.</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-10 space-y-5 rounded-xl border border-neutral-200/80 bg-white p-6 shadow-md"
      >
        {/* Evita el aviso del navegador sobre formularios solo-contraseña y mejora autofill */}
        <label htmlFor="admin-username" className="sr-only">
          Usuario
        </label>
        <input
          id="admin-username"
          name="username"
          type="text"
          autoComplete="username"
          defaultValue="admin"
          readOnly
          tabIndex={-1}
          className="sr-only"
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700" htmlFor="password">
            Contraseña
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              autoCapitalize="off"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2.5 pr-11 outline-none ring-brand-blue/30 transition-shadow focus:border-brand-blue focus:ring-2"
              required
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? "login-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div aria-live="polite" id="login-error">
          {err && <p className="text-sm font-medium text-red-600">{err}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-navy py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navyDark disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <Link href="/" className="mt-10 text-center text-sm text-brand-blue hover:underline">
        Volver al sitio
      </Link>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="pointer-events-none"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="pointer-events-none"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-600">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
