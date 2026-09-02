"use client";

import { useRef, useState } from "react";
import { ORACULO_PAYMENT } from "@/lib/oraculo-content";

const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

export function OraculoOrderForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<"ar" | "es">("ar");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receipt) {
      setMsg({ type: "err", text: "Adjuntá el comprobante de pago." });
      return;
    }
    if (receipt.size > RECEIPT_MAX_BYTES) {
      setMsg({ type: "err", text: "El comprobante no puede superar 10 MB." });
      return;
    }

    setSubmitting(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("email", email.trim());
    fd.set("country", country);
    fd.set("receipt", receipt);

    try {
      const res = await fetch("/api/oraculo/order", { method: "POST", body: fd });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ type: "err", text: j.error ?? "No se pudo enviar. Probá de nuevo." });
        return;
      }
      setMsg({
        type: "ok",
        text: "¡Listo! Recibirás el acceso en las próximas 24 horas en tu correo.",
      });
      setName("");
      setEmail("");
      setReceipt(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setMsg({ type: "err", text: "Error de conexión. Probá de nuevo." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[rgb(55,53,47)]">Nombre y Apellido</h2>
        <input
          required
          className="mt-1 w-full border-b border-black/20 bg-transparent py-2 text-base text-[rgb(55,53,47)] outline-none focus:border-black/50"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[rgb(55,53,47)]">Mail</h2>
        <input
          type="email"
          required
          className="mt-1 w-full border-b border-black/20 bg-transparent py-2 text-base text-[rgb(55,53,47)] outline-none focus:border-black/50"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-base text-[rgb(55,53,47)]">País de pago</label>
        <select
          className="mt-1 w-full border-b border-black/20 bg-transparent py-2 text-base text-[rgb(55,53,47)] outline-none"
          value={country}
          onChange={(e) => setCountry(e.target.value as "ar" | "es")}
        >
          <option value="ar">{ORACULO_PAYMENT.ar.label}</option>
          <option value="es">{ORACULO_PAYMENT.es.label}</option>
        </select>
      </div>

      <div>
        <label className="block text-base text-[rgb(55,53,47)]">Comprobante de pago</label>
        <p className="text-sm text-[rgb(55,53,47)]/65">JPG, PNG o PDF · máx. 10 MB</p>
        <input
          ref={fileRef}
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="mt-2 block w-full text-sm text-[rgb(55,53,47)]"
          onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-[rgb(55,53,47)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Enviando…" : "Enviar comprobante"}
      </button>

      {msg && (
        <p className={`text-sm ${msg.type === "ok" ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>
      )}
    </form>
  );
}
