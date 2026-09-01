"use client";

import { useEffect, useRef, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/admin/ui/Button";
import { PrebriefQuestionList } from "@/components/admin/prebrief/PrebriefQuestionList";
import {
  getDefaultPrebriefTemplate,
  visiblePrebriefFields,
  type PrebriefTemplate,
} from "@/lib/prebrief-template";
import { brandUi, clientFrame } from "@/lib/brand-ui";
import "@/components/admin/rich-text-editor.css";

type PrebriefSetupModalProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  template: PrebriefTemplate;
  disabled?: boolean;
  onSaved: (template: PrebriefTemplate) => void;
};

function RichBlock({
  label,
  value,
  onChange,
  hint,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  ariaLabel: string;
}) {
  return (
    <div className="block">
      <span
        className="text-[9px] font-medium uppercase tracking-widest"
        style={{ color: brandUi.textFaint }}
      >
        {label}
      </span>
      {hint && (
        <p className="text-[10px] mt-0.5 mb-2" style={{ color: brandUi.textMuted }}>
          {hint}
        </p>
      )}
      <div
        className="mt-1 rounded-xl border-2 overflow-hidden"
        style={{ borderColor: clientFrame.border, background: clientFrame.background }}
      >
        <RichTextEditor
          value={value}
          onChange={onChange}
          ariaLabel={ariaLabel}
          placeholder="Escribí acá…"
          frameVariant="client"
        />
      </div>
    </div>
  );
}

export function PrebriefSetupModal({
  open,
  onClose,
  projectId,
  template,
  disabled = false,
  onSaved,
}: PrebriefSetupModalProps) {
  const [draft, setDraft] = useState(template);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [textsOpen, setTextsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) setDraft(template);
  }, [open, template]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function updateDraft(next: PrebriefTemplate) {
    const withFormat: PrebriefTemplate = { ...next, contentFormat: "html" };
    setDraft(withFormat);
    setMessage(null);
    if (disabled) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persist(withFormat, true), 1200);
  }

  async function persist(next = draft, silent = false) {
    if (disabled) return false;
    setSaving(true);
    const payload: PrebriefTemplate = { ...next, contentFormat: "html" };
    const res = await fetch(`/api/admin/projects-erp/${projectId}/prebrief`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: payload }),
    });
    setSaving(false);
    if (res.ok) {
      const j = (await res.json()) as { template: PrebriefTemplate };
      onSaved(j.template);
      if (!silent) setMessage("Guardado.");
      return true;
    }
    if (!silent) setMessage("No se pudo guardar.");
    return false;
  }

  async function restoreDefault() {
    if (
      !window.confirm(
        "¿Restaurar la plantilla original de Brand Soul?\n\nSe perderán las ediciones de este proyecto.",
      )
    ) {
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/prebrief`, {
      method: "DELETE",
      credentials: "include",
    });
    setSaving(false);
    if (res.ok) {
      const j = (await res.json()) as { template: PrebriefTemplate };
      setDraft(j.template);
      onSaved(j.template);
      setMessage("Plantilla original restaurada.");
      setEditingId(null);
    }
  }

  async function saveAndClose() {
    const ok = await persist(draft, false);
    if (ok) onClose();
  }

  if (!open) return null;

  const visibleCount = visiblePrebriefFields(draft.fields).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(19,25,69,0.25)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex w-full max-w-2xl max-h-[92vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prebrief-setup-title"
      >
        <div
          className="flex items-start justify-between gap-3 border-b px-5 py-4 shrink-0"
          style={{ borderColor: brandUi.border }}
        >
          <div>
            <h2 id="prebrief-setup-title" className="font-serif text-xl italic" style={{ color: brandUi.text }}>
              Configurar Brand Soul
            </h2>
            <p className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
              Elegí el paquete, activá o quitá preguntas y editá los textos. El cliente recibe un mail
              con el enlace al formulario.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-neutral-400 hover:text-neutral-700 px-1"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <PrebriefQuestionList
            draft={draft}
            disabled={disabled}
            editingId={editingId}
            onEditingIdChange={setEditingId}
            onDraftChange={updateDraft}
          />

          <div className="rounded-xl border" style={{ borderColor: brandUi.border }}>
            <button
              type="button"
              onClick={() => setTextsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: brandUi.blue }}>
                Textos del mail y del formulario
              </span>
              <span className="text-xs" style={{ color: brandUi.textMuted }}>
                {textsOpen ? "Ocultar" : "Opcional · abrir"}
              </span>
            </button>
            {textsOpen && (
              <div className="space-y-4 border-t px-4 py-4" style={{ borderColor: brandUi.border }}>
                <RichBlock
                  label="Bienvenida (solo en el mail)"
                  hint="No aparece en el formulario online."
                  ariaLabel="Bienvenida del mail"
                  value={draft.emailWelcome}
                  onChange={(emailWelcome) => updateDraft({ ...draft, emailWelcome })}
                />
                <RichBlock
                  label="Introducción al cuestionario"
                  hint="Texto antes de las preguntas en el enlace."
                  ariaLabel="Introducción al cuestionario"
                  value={draft.questionnaireIntro}
                  onChange={(questionnaireIntro) => updateDraft({ ...draft, questionnaireIntro })}
                />
                <RichBlock
                  label="Cierre del formulario"
                  hint="Después de las preguntas, antes de enviar."
                  ariaLabel="Cierre del formulario"
                  value={draft.outro}
                  onChange={(outro) => updateDraft({ ...draft, outro })}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 border-t px-5 py-4 shrink-0"
          style={{ borderColor: brandUi.border, background: "#FAFAFA" }}
        >
          <button
            type="button"
            onClick={() => void restoreDefault()}
            disabled={disabled || saving}
            className="rounded-full px-3 py-1.5 text-xs font-medium border hover:bg-white disabled:opacity-50"
            style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
          >
            Restaurar original
          </button>
          <span className="text-[11px] flex-1 min-w-[120px]" style={{ color: brandUi.textMuted }}>
            {saving ? "Guardando…" : message ?? `${visibleCount} preguntas listas`}
          </span>
          <Button variant="secondary" disabled={disabled || saving} onClick={() => void persist()}>
            Guardar
          </Button>
          <Button variant="primary" disabled={disabled || saving} onClick={() => void saveAndClose()}>
            Listo
          </Button>
        </div>
      </div>
    </div>
  );
}

export { getDefaultPrebriefTemplate };
