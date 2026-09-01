"use client";

import type { PrebriefField } from "@/lib/prebrief-content";
import {
  applyPrebriefPackagePreset,
  createPrebriefQuestionField,
  createPrebriefSectionField,
  visiblePrebriefFields,
  type PrebriefPackagePreset,
  type PrebriefTemplate,
} from "@/lib/prebrief-template";
import { brandUi } from "@/lib/brand-ui";

const PACKAGE_OPTIONS: { id: PrebriefPackagePreset; label: string; hint: string }[] = [
  { id: "inicial", label: "Inicial", hint: "Menos preguntas" },
  { id: "intermedio", label: "Intermedio", hint: "Equilibrado" },
  { id: "completo", label: "Completo", hint: "Todas las preguntas" },
];

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

function fieldKind(field: PrebriefField): string {
  if (field.sectionTitle !== undefined || field.sectionIntro !== undefined) return "Sección";
  return "Pregunta";
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

  function addQuestion(afterIndex?: number) {
    const field = createPrebriefQuestionField(draft.fields);
    const fields = [...draft.fields];
    const insertAt = afterIndex == null ? fields.length : afterIndex + 1;
    fields.splice(insertAt, 0, field);
    onDraftChange({ ...draft, fields });
    onEditingIdChange(field.id);
  }

  function addSection() {
    const field = createPrebriefSectionField(draft.fields);
    onDraftChange({ ...draft, fields: [...draft.fields, field] });
    onEditingIdChange(field.id);
  }

  function removeField(index: number) {
    if (draft.fields.length <= 1) return;
    const field = draft.fields[index];
    const label = fieldTitle(field);
    if (!window.confirm(`¿Quitar "${label}" del cuestionario?`)) return;
    if (editingId === field.id) onEditingIdChange(null);
    onDraftChange({ ...draft, fields: draft.fields.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: brandUi.text }}>
          Paquete sugerido
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PACKAGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onDraftChange(applyPrebriefPackagePreset(draft, opt.id))}
              className="rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 disabled:opacity-50"
              style={{ borderColor: brandUi.border, background: brandUi.surface }}
            >
              <span className="block text-sm font-medium" style={{ color: brandUi.text }}>
                {opt.label}
              </span>
              <span className="block text-[10px] mt-0.5" style={{ color: brandUi.textMuted }}>
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: brandUi.textMuted }}>
          <strong style={{ color: brandUi.text }}>{visibleCount}</strong> preguntas activas ·{" "}
          {draft.fields.length} en total
        </p>
        {!disabled && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addQuestion()}
              className="rounded-full px-3 py-1 text-[11px] font-medium border hover:bg-neutral-50"
              style={{ borderColor: brandUi.border, color: brandUi.accent }}
            >
              + Pregunta
            </button>
            <button
              type="button"
              onClick={() => addSection()}
              className="rounded-full px-3 py-1 text-[11px] font-medium border hover:bg-neutral-50"
              style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
            >
              + Sección
            </button>
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {draft.fields.map((field, index) => {
          const isEditing = editingId === field.id;
          return (
            <li key={field.id}>
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2"
                style={{
                  borderColor: isEditing ? brandUi.blue : brandUi.border,
                  background: field.hidden ? "#FAFAFA" : brandUi.surface,
                  opacity: field.hidden ? 0.72 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={!field.hidden}
                  disabled={disabled}
                  onChange={(e) => updateField(index, { hidden: !e.target.checked })}
                  title="Incluir en el formulario del cliente"
                  className="shrink-0"
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onEditingIdChange(isEditing ? null : field.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span
                    className="block text-[10px] uppercase tracking-wide"
                    style={{ color: brandUi.textFaint }}
                  >
                    {fieldKind(field)}
                  </span>
                  <span className="block text-sm truncate" style={{ color: brandUi.text }}>
                    {fieldTitle(field)}
                  </span>
                </button>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    disabled={draft.fields.length <= 1}
                    className="shrink-0 text-[10px] px-2 py-1 rounded border hover:bg-red-50 disabled:opacity-40"
                    style={{ borderColor: "rgba(240,49,114,0.35)", color: brandUi.accent }}
                  >
                    Quitar
                  </button>
                )}
              </div>

              {isEditing && (
                <div
                  className="mt-2 ml-6 space-y-3 rounded-xl border p-3"
                  style={{ borderColor: brandUi.border, background: "#FAFAFA" }}
                >
                  {(field.sectionTitle !== undefined || field.sectionIntro !== undefined) && (
                    <label className="block">
                      <span
                        className="text-[9px] font-medium uppercase tracking-widest"
                        style={{ color: brandUi.textFaint }}
                      >
                        Título de sección
                      </span>
                      <input
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
                        value={field.sectionTitle ?? ""}
                        onChange={(e) => updateField(index, { sectionTitle: e.target.value })}
                      />
                    </label>
                  )}
                  <label className="block">
                    <span
                      className="text-[9px] font-medium uppercase tracking-widest"
                      style={{ color: brandUi.textFaint }}
                    >
                      Pregunta
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
                    Listo con esta pregunta
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
