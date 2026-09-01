"use client";

import type { PrebriefField } from "@/lib/prebrief-content";
import {
  createPrebriefQuestionField,
  isCustomPrebriefFieldId,
  visiblePrebriefFields,
  type PrebriefTemplate,
} from "@/lib/prebrief-template";
import { brandUi } from "@/lib/brand-ui";

type PrebriefQuestionListProps = {
  draft: PrebriefTemplate;
  disabled?: boolean;
  editingId: string | null;
  onEditingIdChange: (id: string | null) => void;
  onDraftChange: (next: PrebriefTemplate) => void;
};

function fieldTitle(field: PrebriefField): string {
  if (field.sectionTitle?.trim()) return field.sectionTitle.trim();
  if (field.label.trim()) return field.label.trim();
  return "Pregunta sin título";
}

export function PrebriefQuestionList({
  draft,
  disabled = false,
  editingId,
  onEditingIdChange,
  onDraftChange,
}: PrebriefQuestionListProps) {
  const visibleCount = visiblePrebriefFields(draft.fields).length;

  function updateField(index: number, patch: Partial<PrebriefField>) {
    const fields = draft.fields.map((f, i) => (i === index ? { ...f, ...patch, id: f.id } : f));
    onDraftChange({ ...draft, fields });
  }

  function setAllIncluded(included: boolean) {
    onDraftChange({
      ...draft,
      fields: draft.fields.map((f) => ({ ...f, hidden: !included })),
    });
  }

  function addQuestion() {
    const field = createPrebriefQuestionField(draft.fields);
    onDraftChange({ ...draft, fields: [...draft.fields, { ...field, hidden: false }] });
    onEditingIdChange(field.id);
  }

  function removeField(index: number) {
    const field = draft.fields[index];
    if (!isCustomPrebriefFieldId(field.id)) return;
    const label = fieldTitle(field);
    if (!window.confirm(`¿Eliminar "${label}"?`)) return;
    if (editingId === field.id) onEditingIdChange(null);
    onDraftChange({ ...draft, fields: draft.fields.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium" style={{ color: brandUi.text }}>
          Preguntas para el cliente
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: brandUi.textMuted }}>
          Todas las preguntas oficiales están acá. Tildá las que querés incluir en el envío. Podés
          agregar propias y quitar solo las que agregues.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: brandUi.textMuted }}>
          <strong style={{ color: brandUi.text }}>{visibleCount}</strong> incluidas en el envío
        </p>
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAllIncluded(true)}
              className="rounded-full px-3 py-1 text-[10px] font-medium border hover:bg-neutral-50"
              style={{ borderColor: brandUi.border, color: brandUi.blue }}
            >
              Marcar todas
            </button>
            <button
              type="button"
              onClick={() => setAllIncluded(false)}
              className="rounded-full px-3 py-1 text-[10px] font-medium border hover:bg-neutral-50"
              style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
            >
              Ninguna
            </button>
            <button
              type="button"
              onClick={() => addQuestion()}
              className="rounded-full px-3 py-1 text-[11px] font-medium border hover:bg-neutral-50"
              style={{ borderColor: brandUi.border, color: brandUi.accent }}
            >
              + Agregar pregunta
            </button>
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {draft.fields.map((field, index) => {
          const isEditing = editingId === field.id;
          const isCustom = isCustomPrebriefFieldId(field.id);
          const included = !field.hidden;
          return (
            <li key={field.id}>
              <div
                className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                style={{
                  borderColor: isEditing ? brandUi.blue : included ? brandUi.border : "rgba(19,25,69,0.08)",
                  background: included ? brandUi.surface : "#F5F5F5",
                }}
              >
                <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={included}
                    disabled={disabled}
                    onChange={(e) => updateField(index, { hidden: !e.target.checked })}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: brandUi.textMuted }}>
                    Enviar
                  </span>
                </label>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onEditingIdChange(isEditing ? null : field.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`block text-sm leading-snug ${included ? "" : "line-through opacity-60"}`}
                      style={{ color: brandUi.text }}
                    >
                      {fieldTitle(field)}
                    </span>
                    {isCustom && (
                      <span
                        className="shrink-0 rounded px-1.5 py-px text-[9px] font-medium uppercase"
                        style={{ background: brandUi.navySoft, color: brandUi.textMuted }}
                      >
                        Propia
                      </span>
                    )}
                  </span>
                </button>
                {!disabled && isCustom && (
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="shrink-0 text-[10px] px-2 py-1 rounded border hover:bg-red-50"
                    style={{ borderColor: "rgba(240,49,114,0.35)", color: brandUi.accent }}
                  >
                    Eliminar
                  </button>
                )}
              </div>

              {isEditing && (
                <div
                  className="mt-2 space-y-3 rounded-xl border p-3"
                  style={{ borderColor: brandUi.border, background: "#FAFAFA" }}
                >
                  <label className="block">
                    <span
                      className="text-[9px] font-medium uppercase tracking-widest"
                      style={{ color: brandUi.textFaint }}
                    >
                      Texto de la pregunta
                    </span>
                    <input
                      className="mt-1 w-full rounded border px-3 py-2 text-sm"
                      style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span
                      className="text-[9px] font-medium uppercase tracking-widest"
                      style={{ color: brandUi.textFaint }}
                    >
                      Ayuda para el cliente (opcional)
                    </span>
                    <textarea
                      className="mt-1 w-full rounded border p-2 text-sm min-h-[56px] resize-y"
                      style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
                      value={field.hint ?? ""}
                      onChange={(e) => updateField(index, { hint: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onEditingIdChange(null)}
                    className="text-xs font-medium"
                    style={{ color: brandUi.blue }}
                  >
                    Listo
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
