"use client";

import { useRef, useState } from "react";
import styles from "./oraculo-notion.module.css";

const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

export function OraculoOrderForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
      setMsg({ type: "err", text: "El comprobante no puede superar 5 MB." });
      return;
    }

    setSubmitting(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("email", email.trim());
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
    <form onSubmit={(e) => void onSubmit(e)} className={styles.orderForm}>
      <div className={styles.orderField}>
        <label className={styles.orderLabel} htmlFor="oraculo-name">
          Nombre y Apellido<span className={styles.orderRequired}>*</span>
        </label>
        <input
          id="oraculo-name"
          required
          placeholder="Tu respuesta"
          className={styles.orderInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.orderField}>
        <label className={styles.orderLabel} htmlFor="oraculo-email">
          Mail<span className={styles.orderRequired}>*</span>
        </label>
        <p className={styles.orderMailNote}>
          Importante (!!!) En este correo{" "}
          <span className={styles.orderMailHighlight}>recibirás el material de descarga</span>
        </p>
        <input
          id="oraculo-email"
          type="email"
          required
          placeholder="Tu respuesta"
          className={styles.orderInput}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className={styles.orderField}>
        <label className={styles.orderLabel} htmlFor="oraculo-receipt">
          Comprobante de pago<span className={styles.orderRequired}>*</span>
        </label>
        <div className={styles.orderUploadBox}>
          <label className={styles.orderUploadButton} htmlFor="oraculo-receipt">
            <span className={styles.orderUploadIcon} aria-hidden="true">📄</span>
            Subir
          </label>
          <p className={styles.orderUploadHint}>
            Límite de tamaño: 5 MB. Límite de archivos: 1.
            {receipt ? ` ${receipt.name}` : ""}
          </p>
          <input
            ref={fileRef}
            id="oraculo-receipt"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className={styles.orderFileInput}
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <button type="submit" disabled={submitting} className={styles.orderSubmit}>
        {submitting ? "Enviando…" : "Enviar"}
      </button>

      {msg && (
        <p className={msg.type === "ok" ? styles.orderMsgOk : styles.orderMsgErr}>{msg.text}</p>
      )}
    </form>
  );
}
