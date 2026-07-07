"use client";

import type { ReactNode } from "react";
import { brandUi } from "@/lib/brand-ui";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmBg = confirmVariant === "danger" ? "#b91c1c" : brandUi.accent;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(19,25,69,0.2)" }}
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
    >
      <div
        className="w-full max-w-md rounded bg-white shadow-2xl p-5 space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h3
          id="confirm-dialog-title"
          className="font-serif text-lg italic"
          style={{ color: brandUi.text }}
        >
          {title}
        </h3>
        <div className="text-sm leading-relaxed" style={{ color: "rgba(19,25,69,0.65)" }}>
          {description}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: confirmBg }}
          >
            {loading ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
