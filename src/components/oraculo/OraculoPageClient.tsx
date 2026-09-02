"use client";

import { useRef, useState } from "react";
import { ORACULO_MEDIA, ORACULO_PAYMENT } from "@/lib/oraculo-content";

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
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-lg space-y-4 rounded-xl border border-neutral-300 bg-white/80 p-6 shadow-sm">
      <h3 className="font-serif text-xl text-neutral-900">Oráculo Raíz—</h3>

      <div>
        <label className="block text-sm font-medium text-neutral-800">Nombre y Apellido</label>
        <input
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-800">
          Email <span className="font-normal text-neutral-500">(recibirás el material de descarga)</span>
        </label>
        <input
          type="email"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-800">País de pago</label>
        <select
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          value={country}
          onChange={(e) => setCountry(e.target.value as "ar" | "es")}
        >
          <option value="ar">{ORACULO_PAYMENT.ar.label}</option>
          <option value="es">{ORACULO_PAYMENT.es.label}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-800">Comprobante de pago</label>
        <p className="mt-0.5 text-xs text-neutral-500">JPG, PNG o PDF · máx. 10 MB</p>
        <input
          ref={fileRef}
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="mt-2 block w-full text-sm"
          onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "Enviando…" : "Enviar comprobante"}
      </button>

      {msg && (
        <p className={`text-sm ${msg.type === "ok" ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>
      )}
    </form>
  );
}

export function OraculoPresentation() {
  const videoUrl = ORACULO_MEDIA.presentationVideo;

  return (
    <div className="space-y-6">
      <audio controls className="mx-auto w-full max-w-md" src={ORACULO_MEDIA.bienvenidaAudio} preload="metadata">
        <track kind="captions" />
      </audio>

      {videoUrl ? (
        <video
          controls
          playsInline
          className="mx-auto w-full max-w-3xl rounded-lg shadow-md"
          poster={ORACULO_MEDIA.salpicadoCartas}
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/quicktime" />
        </video>
      ) : (
        <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ORACULO_MEDIA.salpicadoCartas} alt="Oráculo Raíz — cartas" className="w-full" />
          <p className="p-4 text-center text-sm text-neutral-600">
            Video de presentación en preparación. Mientras tanto podés escuchar la bienvenida arriba.
          </p>
        </div>
      )}
    </div>
  );
}
