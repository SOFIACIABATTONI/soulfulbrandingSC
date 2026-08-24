"use client";

import { useEffect, useRef, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/admin/ui/Button";
import type { PrebriefField } from "@/lib/prebrief-content";
import {
  createPrebriefQuestionField,
  createPrebriefSectionField,
  getDefaultPrebriefTemplate,
  type PrebriefTemplate,
} from "@/lib/prebrief-template";
import { brandUi, clientFrame } from "@/lib/brand-ui";
import "@/components/admin/rich-text-editor.css";

type PrebriefTemplateEditorProps = {
  projectId: string;
  template: PrebriefTemplate;
  disabled?: boolean;
  onSaved: (template: PrebriefTemplate) => void;
};

function PlainInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span
        className="text-[9px] font-medium uppercase tracking-widest"
        style={{ color: brandUi.textFaint }}
      >
        {label}
      </span>
      {hint && (
        <p className="text-[10px] mt-0.5 mb-1" style={{ color: brandUi.textMuted }}>
          {hint}
        </p>
      )}
      <input
        className="mt-1 w-full rounded border px-3 py-2 text-sm"
        style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

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

export function PrebriefTemplateEditor({
  projectId,
  template,
  disabled = false,
  onSaved,
}: PrebriefTemplateEditorProps) {
  const [draft, setDraft] = useState(template);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(template);
  }, [template]);

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

  function updateField(index: number, patch: Partial<PrebriefField>) {
    const fields = draft.fields.map((f, i) => (i === index ? { ...f, ...patch, id: f.id } : f));
    updateDraft({ ...draft, fields });
  }

  function addQuestion(afterIndex?: number) {
    const field = createPrebriefQuestionField(draft.fields);
    const fields = [...draft.fields];
    const insertAt = afterIndex == null ? fields.length : afterIndex + 1;
    fields.splice(insertAt, 0, field);
    updateDraft({ ...draft, fields });
  }

  function addSection(afterIndex?: number) {
    const field = createPrebriefSectionField(draft.fields);
    const fields = [...draft.fields];
    const insertAt = afterIndex == null ? fields.length : afterIndex + 1;
    fields.splice(insertAt, 0, field);
    updateDraft({ ...draft, fields });
  }

  function removeField(index: number) {
    if (draft.fields.length <= 1) {
      setMessage("Debe quedar al menos una pregunta.");
      return;
    }
    const field = draft.fields[index];
    const label = field.label.trim() || field.sectionTitle?.trim() || "esta pregunta";
    if (!window.confirm(`¿Eliminar "${label}" del cuestionario?`)) return;
    const fields = draft.fields.filter((_, i) => i !== index);
    updateDraft({ ...draft, fields });
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
      if (!silent) setMessage("Cuestionario guardado.");
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
    }
  }

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl border-2 px-4 py-3"
        style={{ borderColor: clientFrame.border, background: clientFrame.headerBackground }}
      >
        <p className="text-sm font-medium" style={{ color: clientFrame.border }}>
          Documento para el cliente — cuestionario Brand Soul
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: brandUi.textMuted }}>
          Usá el editor visual (negritas, títulos, listas). La <strong>bienvenida</strong> va solo en
          el mail. El <strong>cuestionario</strong> lo ve el cliente en el enlace.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border p-4" style={{ borderColor: brandUi.border }}>
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: brandUi.blue }}>
          Solo mail al cliente
        </p>
        <RichBlock
          label="Bienvenida (cuerpo del mail)"
          hint="Este texto no aparece en el formulario online."
          ariaLabel="Bienvenida del mail"
          value={draft.emailWelcome}
          onChange={(emailWelcome) => updateDraft({ ...draft, emailWelcome })}
        />
      </div>

      <div className="space-y-4 rounded-xl border p-4" style={{ borderColor: brandUi.border }}>
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: brandUi.accent }}>
          Cuestionario online
        </p>
        <RichBlock
          label="Introducción al cuestionario"
          hint="Un solo bloque antes de las preguntas: cómo funciona el proceso y el diagnóstico."
          ariaLabel="Introducción al cuestionario"
          value={draft.questionnaireIntro}
          onChange={(questionnaireIntro) => updateDraft({ ...draft, questionnaireIntro })}
        />
        <RichBlock
          label="Cierre del formulario"
          hint="Texto después de las preguntas, antes del botón enviar."
          ariaLabel="Cierre del formulario"
          value={draft.outro}
          onChange={(outro) => updateDraft({ ...draft, outro })}
        />
      </div>

      <div className="space-y-4 rounded-xl border p-4" style={{ borderColor: brandUi.border }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: brandUi.text }}>
            Preguntas ({draft.fields.length})
          </p>
          {!disabled && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addQuestion()}
                className="rounded-full px-3 py-1 text-[11px] font-medium border transition-colors hover:bg-neutral-50"
                style={{ borderColor: brandUi.border, color: brandUi.accent }}
              >
                + Pregunta
              </button>
              <button
                type="button"
                onClick={() => addSection()}
                className="rounded-full px-3 py-1 text-[11px] font-medium border transition-colors hover:bg-neutral-50"
                style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
              >
                + Sección
              </button>
            </div>
          )}
        </div>
        {draft.fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 rounded-lg border p-3"
            style={{ borderColor: brandUi.border, background: "#FAFAFA" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: brandUi.textFaint }}>
                {field.sectionTitle
                  ? `Sección · ${field.sectionTitle}`
                  : field.id.startsWith("q")
                    ? `Pregunta ${field.id.replace("q", "")}`
                    : "Pregunta personalizada"}
              </p>
              {!disabled && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => addQuestion(index)}
                    className="rounded px-2 py-0.5 text-[10px] border hover:bg-white"
                    style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
                  >
                    + Debajo
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    disabled={draft.fields.length <= 1}
                    className="rounded px-2 py-0.5 text-[10px] border hover:bg-red-50 disabled:opacity-40"
                    style={{ borderColor: "rgba(240,49,114,0.35)", color: brandUi.accent }}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
            {(field.sectionTitle !== undefined || field.sectionIntro !== undefined) && (
              <PlainInput
                label="Título de sección"
                value={field.sectionTitle ?? ""}
                onChange={(sectionTitle) => updateField(index, { sectionTitle })}
              />
            )}
            {field.sectionIntro !== undefined && (
              <RichBlock
                label="Intro de sección"
                ariaLabel={`Intro de sección ${field.sectionTitle ?? field.id}`}
                value={field.sectionIntro ?? ""}
                onChange={(sectionIntro) => updateField(index, { sectionIntro })}
              />
            )}
            <PlainInput
              label="Pregunta"
              value={field.label}
              onChange={(label) => updateField(index, { label })}
            />
            <label className="block">
              <span
                className="text-[9px] font-medium uppercase tracking-widest"
                style={{ color: brandUi.textFaint }}
              >
                Ayuda / subtítulo
              </span>
              <textarea
                className="mt-1 w-full rounded border p-2 text-sm leading-relaxed resize-y min-h-[56px]"
                style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
                rows={2}
                value={field.hint ?? ""}
                onChange={(e) => updateField(index, { hint: e.target.value })}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void restoreDefault()}
          disabled={disabled || saving}
          className="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors hover:bg-neutral-50 disabled:opacity-50"
          style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
        >
          Restaurar plantilla original
        </button>
        <Button variant="secondary" disabled={disabled || saving} onClick={() => void persist()}>
          {saving ? "Guardando…" : "Guardar cuestionario"}
        </Button>
        {message && (
          <span className="text-[11px] ml-auto" style={{ color: brandUi.textMuted }}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

export { getDefaultPrebriefTemplate };
