"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { brandUi } from "@/lib/brand-ui";
import {
  getPhaseDocumentHtmlTemplate,
  resolvePhaseDocumentHtml,
} from "@/lib/phase-html-templates";
import type { PhaseDocumentKey } from "@/lib/phase-document-templates";

type PhaseDocumentEditorProps = {
  phaseKey: PhaseDocumentKey;
  title: string;
  hint: string;
  saved: Record<string, string>;
  saving?: boolean;
  onSave: (payload: { body: string; bodyFormat: "html" }) => void;
};

export function PhaseDocumentEditor({
  phaseKey,
  title,
  hint,
  saved,
  saving = false,
  onSave,
}: PhaseDocumentEditorProps) {
  const defaultHtml = useMemo(() => getPhaseDocumentHtmlTemplate(phaseKey), [phaseKey]);
  const resolved = useMemo(
    () => resolvePhaseDocumentHtml(phaseKey, saved),
    [phaseKey, saved],
  );
  const hasSavedContent = Boolean(saved.body?.trim());

  const [html, setHtml] = useState(resolved || defaultHtml);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHtml(resolved || defaultHtml);
  }, [resolved, defaultHtml]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function persist(nextHtml = html) {
    const trimmed = nextHtml.trim();
    if (!trimmed) return;
    if (!hasSavedContent && trimmed === defaultHtml.trim()) return;
    onSave({ body: trimmed, bodyFormat: "html" });
  }

  function handleChange(newHtml: string) {
    setHtml(newHtml);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(newHtml), 900);
  }

  function restoreTemplate() {
    if (
      !window.confirm(
        "¿Volver al modelo original?\n\nSe borrará lo que escribiste y volverá la estructura inicial con los campos [Completar] y los checkboxes vacíos.",
      )
    ) {
      return;
    }
    setHtml(defaultHtml);
    onSave({ body: defaultHtml, bodyFormat: "html" });
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border px-4 py-3"
        style={{ borderColor: brandUi.border, background: "rgba(240,49,114,0.04)" }}
      >
        <p className="text-sm font-medium" style={{ color: brandUi.text }}>
          {title}
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: brandUi.textMuted }}>
          {hint} Editá directamente en el cuadro: negritas, subrayado, colores y{" "}
          <strong>checkboxes</strong> para tildar entregables. El formato se guarda y podés
          reutilizarlo para enviar por mail.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={restoreTemplate}
          title="Borra tus notas y vuelve al modelo inicial de esta fase"
          className="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors hover:bg-neutral-50"
          style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
        >
          Volver al modelo original
        </button>
        {saving && (
          <span className="text-[11px] ml-auto" style={{ color: brandUi.blue }}>
            Guardando…
          </span>
        )}
      </div>

      <RichTextEditor
        value={html}
        ariaLabel={title}
        placeholder="Completá las notas de esta fase…"
        onChange={handleChange}
        onBlur={() => persist()}
      />
    </div>
  );
}
