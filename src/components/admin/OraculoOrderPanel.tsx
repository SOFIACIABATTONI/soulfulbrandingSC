"use client";

import { useMemo, useState } from "react";
import { ORACULO_ACCESS_EMAIL_SUBJECT } from "@/lib/oraculo-delivery-email";
import {
  parseOraculoDeliveryInfo,
  parseOraculoReceiptUrl,
} from "@/lib/oraculo-order-parse";

type Props = {
  messageId: string;
  messageBody: string;
  clientEmail: string;
  onMessageUpdate?: (nextMessage: string) => void;
};

const DEFAULT_DOWNLOAD_LINK =
  process.env.NEXT_PUBLIC_ORACULO_DOWNLOAD_URL?.trim() || "";
const DEFAULT_YOUTUBE_LINK =
  process.env.NEXT_PUBLIC_ORACULO_DELIVERY_YOUTUBE_URL?.trim() || "";

export function OraculoOrderPanel({
  messageId,
  messageBody,
  clientEmail,
  onMessageUpdate,
}: Props) {
  const receiptUrl = useMemo(() => parseOraculoReceiptUrl(messageBody), [messageBody]);
  const delivery = useMemo(() => parseOraculoDeliveryInfo(messageBody), [messageBody]);

  const [open, setOpen] = useState(false);
  const [downloadLink, setDownloadLink] = useState(
    delivery.downloadLink || DEFAULT_DOWNLOAD_LINK,
  );
  const [youtubeLink, setYoutubeLink] = useState(
    delivery.youtubeLink || DEFAULT_YOUTUBE_LINK,
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendAccess(isResend: boolean) {
    const link = downloadLink.trim();
    if (!link) {
      setError("Pegá el link de descarga (Drive, Dropbox, etc.).");
      return;
    }
    setSending(true);
    setError(null);
    const res = await fetch(`/api/admin/oraculo-orders/${messageId}/send-access`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        downloadLink: link,
        youtubeLink: youtubeLink.trim() || undefined,
        resend: isResend,
      }),
    });
    setSending(false);
    if (res.ok) {
      const j = (await res.json()) as { message?: string };
      setOpen(false);
      if (j.message) onMessageUpdate?.(j.message);
      return;
    }
    let msg = "No se pudo enviar.";
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    setError(msg);
  }

  function openModal() {
    setError(null);
    setDownloadLink(delivery.downloadLink || DEFAULT_DOWNLOAD_LINK);
    setYoutubeLink(delivery.youtubeLink || DEFAULT_YOUTUBE_LINK);
    setOpen(true);
  }

  return (
    <div
      className="mt-3 rounded border p-3 space-y-2"
      style={{ borderColor: "rgba(50,63,246,0.2)", background: "rgba(50,63,246,0.04)" }}
    >
      <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#323FF6" }}>
        Oráculo Raíz — pedido con comprobante
      </p>

      {receiptUrl ? (
        <a
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-medium underline"
          style={{ color: "#131945" }}
        >
          Ver comprobante de pago →
        </a>
      ) : (
        <p className="text-xs text-amber-800">No se encontró URL del comprobante en el mensaje.</p>
      )}

      {delivery.sentAt && (
        <p className="text-[11px]" style={{ color: "rgba(19,25,69,0.55)" }}>
          Acceso enviado:{" "}
          {new Date(delivery.sentAt).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
          {delivery.downloadLink ? (
            <>
              {" "}
              ·{" "}
              <a href={delivery.downloadLink} className="underline" target="_blank" rel="noreferrer">
                link usado
              </a>
            </>
          ) : null}
        </p>
      )}

      <button
        type="button"
        onClick={openModal}
        className="rounded px-3 py-1.5 text-[11px] font-medium text-white"
        style={{ background: "#323FF6" }}
      >
        {delivery.sentAt ? "Reenviar mail de acceso" : "Enviar mail de acceso al cliente"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(19,25,69,0.25)" }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-lg rounded bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-5 py-4 sticky top-0 bg-white">
              <h3 className="font-serif text-lg italic">Enviar Oráculo Raíz</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-xl text-neutral-400">
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <p style={{ color: "rgba(19,25,69,0.65)" }}>
                Se enviará a <strong>{clientEmail}</strong> con asunto:{" "}
                <em>{ORACULO_ACCESS_EMAIL_SUBJECT}</em>. Incluye los PDFs configurados en{" "}
                <code className="text-[10px]">ORACULO_DELIVERY_ATTACHMENT_URLS</code> como adjuntos.
              </p>
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="oraculo-dl-link">
                  Link de descarga (pack / carpeta)
                </label>
                <input
                  id="oraculo-dl-link"
                  type="url"
                  required
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="https://…"
                  value={downloadLink}
                  onChange={(e) => setDownloadLink(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="oraculo-yt-link">
                  Link de YouTube (sesión grabada)
                </label>
                <input
                  id="oraculo-yt-link"
                  type="url"
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  className="rounded border px-4 py-2 text-xs"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void sendAccess(!!delivery.sentAt)}
                  className="rounded px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                  style={{ background: "#323FF6" }}
                >
                  {sending ? "Enviando…" : delivery.sentAt ? "Reenviar ahora" : "Enviar ahora"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
