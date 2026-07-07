"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/admin/ui/Button";
import { brandUi } from "@/lib/brand-ui";
import {
  getPhaseDocumentHtmlTemplate,
  resolvePhaseDocumentHtml,
} from "@/lib/phase-html-templates";
import type { PhaseDocumentKey } from "@/lib/phase-document-templates";
import "@/components/admin/rich-text-editor.css";

type PhaseDocumentEditorProps = {
  phaseKey: PhaseDocumentKey;
  title: string;
  hint: string;
  saved: Record<string, string>;
  saving?: boolean;
  onSave: (payload: { body: string; bodyFormat: "html" }) => Promise<boolean> | boolean;
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

  const [html, setHtml] = useState(resolved || defaultHtml);
  const [message, setMessage] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedRef = useRef((resolved || defaultHtml).trim());

  useEffect(() => {
    const next = resolved || defaultHtml;
    setHtml(next);
    lastPersistedRef.current = next.trim();
  }, [resolved, defaultHtml]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function persist(nextHtml = html, opts?: { silent?: boolean }) {
    const trimmed = nextHtml.trim();
    if (!trimmed) return false;
    if (trimmed === lastPersistedRef.current) return true;

    const ok = await onSave({ body: trimmed, bodyFormat: "html" });
    if (ok) {
      lastPersistedRef.current = trimmed;
      if (!opts?.silent) setMessage("Notas guardadas.");
    } else if (!opts?.silent) {
      setMessage("No se pudieron guardar las notas.");
    }
    return ok;
  }

  function handleChange(newHtml: string) {
    setHtml(newHtml);
    setMessage(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(newHtml, { silent: true });
    }, 900);
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
    void persist(defaultHtml);
  }

  return (
    <div className="space-y-3">
      <div
        className="rounded-xl border px-3 py-2"
        style={{ borderColor: brandUi.border, background: "rgba(240,49,114,0.04)" }}
      >
        <p className="text-xs font-medium" style={{ color: brandUi.text }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: brandUi.textMuted }}>
          {hint} Notas internas — se guardan solas. Podés enviar una copia por mail abajo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={restoreTemplate}
          title="Borra tus notas y vuelve al modelo inicial de esta fase"
          className="rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors hover:bg-neutral-50"
          style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
        >
          Modelo original
        </button>
        <Button
          variant="secondary"
          disabled={saving}
          className="!px-3 !py-1.5 !text-xs"
          onClick={() => void persist()}
        >
          {saving ? "Guardando…" : "Guardar"}
        </Button>
        {saving && (
          <span className="text-[11px] ml-auto" style={{ color: brandUi.blue }}>
            Guardando…
          </span>
        )}
        {!saving && message && (
          <span className="text-[11px] ml-auto" style={{ color: brandUi.textMuted }}>
            {message}
          </span>
        )}
      </div>

      <RichTextEditor
        value={html}
        ariaLabel={title}
        placeholder="Notas internas de esta fase…"
        compact
        onChange={handleChange}
        onBlur={() => void persist(undefined, { silent: true })}
      />
    </div>
  );
}
