"use client";

import { useEffect, useRef } from "react";
import { brandUi } from "@/lib/brand-ui";
import { Button } from "@/components/admin/ui/Button";

export type RichTextEditorLinkDialogProps = {
  open: boolean;
  selectedText: string;
  initialUrl: string;
  hasExistingLink: boolean;
  onUrlChange: (url: string) => void;
  onApply: () => void;
  onRemove: () => void;
  onCancel: () => void;
};

function normalizeHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function RichTextEditorLinkDialog({
  open,
  selectedText,
  initialUrl,
  hasExistingLink,
  onUrlChange,
  onApply,
  onRemove,
  onCancel,
}: RichTextEditorLinkDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, initialUrl]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const preview = selectedText.trim();
  const urlTrimmed = initialUrl.trim();
  const canApply = Boolean(urlTrimmed);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(19,25,69,0.22)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-white shadow-2xl p-5 space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rte-link-dialog-title"
        style={{ borderColor: brandUi.borderStrong }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3
            id="rte-link-dialog-title"
            className="font-serif text-lg italic"
            style={{ color: brandUi.text }}
          >
            Enlace en el texto
          </h3>
          <p className="text-[11px] mt-1 leading-relaxed" style={{ color: brandUi.textMuted }}>
            El cliente verá el link en el mail y en el portal (se abre en una pestaña nueva).
          </p>
        </div>

        <div
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: brandUi.border,
            background: "rgba(19,25,69,0.03)",
            color: brandUi.text,
          }}
        >
          {preview ? (
            <>
              <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: brandUi.textMuted }}>
                Texto enlazado
              </span>
              <span className="font-medium break-words">{preview}</span>
            </>
          ) : (
            <span style={{ color: brandUi.textMuted }}>
              No hay texto seleccionado. El enlace se aplicará donde esté el cursor o en la palabra
              actual si ya tenía link.
            </span>
          )}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium" style={{ color: brandUi.text }}>
            URL
          </span>
          <input
            ref={inputRef}
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://"
            value={initialUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (canApply) onApply();
              }
            }}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#F03172]"
            style={{
              borderColor: brandUi.borderStrong,
              color: brandUi.text,
            }}
          />
          {urlTrimmed && normalizeHref(urlTrimmed) !== urlTrimmed && canApply ? (
            <span className="text-[11px]" style={{ color: brandUi.textMuted }}>
              Se guardará como {normalizeHref(urlTrimmed)}
            </span>
          ) : null}
        </label>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {hasExistingLink ? (
            <Button variant="ghost" className="!mr-auto" onClick={onRemove}>
              Quitar enlace
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={!canApply} onClick={onApply}>
            Aplicar enlace
          </Button>
        </div>
      </div>
    </div>
  );
}

export { normalizeHref as normalizeEditorLinkHref };
