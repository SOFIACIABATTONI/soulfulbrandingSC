"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@prisma/client";
import { SERVICE_LABELS, SOURCE_LABELS, STATUS_LABELS } from "./LeadsManager";
import { FormMessageViewer, isFormMessage } from "./FormMessageViewer";

// ── Barra de progreso del flujo ────────────────────────────
const FLOW_STEPS = [
  { key: "form", label: "Form recibido" },
  { key: "negociacion", label: "Negociación" },
  { key: "presupuesto", label: "Presupuesto" },
  { key: "contrato", label: "Contrato" },
  { key: "sena", label: "Seña" },
  { key: "onboarding", label: "Onboarding" },
];

const STEP_INDEX: Record<string, number> = {
  form: 0, negociacion: 1, presupuesto: 2, contrato: 3, sena: 4, onboarding: 5,
};

/** Frase que hay que escribir para confirmar borrado (segunda aceptación). */
const DELETE_CONFIRM_PHRASE = "ELIMINAR";

function FlowBar({
  pipelineStep,
  status,
  onStepClick,
  saving,
}: {
  pipelineStep: string;
  status: string;
  onStepClick: (key: string) => void;
  saving: boolean;
}) {
  const activeIndex = STEP_INDEX[pipelineStep] ?? 1;

  return (
    <div
      className="flex overflow-hidden rounded border mb-6"
      style={{ borderColor: "rgba(13,13,13,0.18)" }}
    >
      {FLOW_STEPS.map((step, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        const isClickable = status !== "perdido" && !saving;
        return (
          <button
            key={step.key}
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onStepClick(step.key)}
            className="flex-1 py-2 px-1 text-center border-r last:border-r-0 transition-opacity"
            style={{
              borderColor: "rgba(13,13,13,0.1)",
              background: isDone ? "#0D0D0D" : isActive ? "#F03172" : "#F9F3DB",
              color: isDone
                ? "rgba(255,255,255,0.45)"
                : isActive
                  ? "#fff"
                  : "rgba(13,13,13,0.42)",
              cursor: isClickable ? "pointer" : "default",
            }}
            title={isClickable ? `Avanzar a: ${step.label}` : undefined}
          >
            <div className="text-xs mb-0.5">
              {isDone ? "✓" : isActive ? "●" : "○"}
            </div>
            <div className="text-[8px] uppercase tracking-wider leading-tight">
              {step.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────
export function LeadDetail({ lead: initial }: { lead: Lead }) {
  const router = useRouter();
  const [lead, setLead] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(initial.notes);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAck, setDeleteAck] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function patchLead(data: Partial<Lead>) {
    setSaving(true);
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) {
      const j = (await res.json()) as { item: Lead };
      setLead(j.item);
    }
  }

  async function saveNotes() {
    await patchLead({ notes: notesValue });
    setEditNotes(false);
  }

  function resetDeleteModal() {
    setDeleteOpen(false);
    setDeleteAck(false);
    setDeletePhrase("");
    setDeleteError(null);
  }

  async function deleteLeadPermanently() {
    setDeleteError(null);
    setDeleting(true);
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleting(false);
    if (res.ok) {
      resetDeleteModal();
      router.push("/admin/leads");
      router.refresh();
      return;
    }
    let msg = "No se pudo eliminar.";
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    setDeleteError(msg);
  }

  async function convertToClient() {
    if (!confirm("¿Convertir este lead en cliente? Se creará su ficha automáticamente."))
      return;
    setConverting(true);
    const res = await fetch(`/api/admin/leads/${lead.id}/convert`, {
      method: "POST",
      credentials: "include",
    });
    setConverting(false);
    if (res.ok) {
      setConverted(true);
      setLead({ ...lead, status: "ganado", pipelineStep: "onboarding" });
      setTimeout(() => router.push("/admin/clientes"), 1200);
    }
  }

  const initials = lead.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      {/* Barra de flujo */}
      <FlowBar
        pipelineStep={lead.pipelineStep ?? "negociacion"}
        status={lead.status}
        saving={saving}
        onStepClick={(key) => void patchLead({ pipelineStep: key as Lead["pipelineStep"] })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* ── Panel principal ── */}
        <div
          className="rounded border bg-white p-6"
          style={{ borderColor: "rgba(13,13,13,0.1)" }}
        >
          {/* Cabecera del lead */}
          <div
            className="flex gap-4 items-start pb-5 mb-5 border-b"
            style={{ borderColor: "rgba(13,13,13,0.1)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-serif text-xl text-white"
              style={{ background: "#F03172" }}
            >
              {initials}
            </div>
            <div>
              <h2 className="font-serif text-2xl" style={{ color: "#0D0D0D" }}>
                {lead.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: "rgba(13,13,13,0.42)" }}>
                {[lead.company, lead.email].filter(Boolean).join(" · ")}
              </p>
              <div className="flex gap-2 mt-2 items-center flex-wrap">
                <StatusBadge status={lead.status} />
                <span className="text-xs" style={{ color: "rgba(13,13,13,0.42)" }}>
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                  {lead.referredBy && ` — ${lead.referredBy}`}
                  {" · "}
                  {new Date(lead.createdAt).toLocaleDateString("es-AR", {
                    dateStyle: "long",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Campos */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoField label="Empresa" value={lead.company || "—"} />
            <InfoField label="Email" value={lead.email} />
            <InfoField
              label="Servicio interesado"
              value={SERVICE_LABELS[lead.service] ?? lead.service}
            />
            <InfoField
              label="Valor estimado"
              value={
                lead.estimatedValue
                  ? `$${lead.estimatedValue.toLocaleString("es-AR")} USD`
                  : "—"
              }
            />
            <InfoField
              label="Fuente"
              value={`${SOURCE_LABELS[lead.source] ?? lead.source}${lead.referredBy ? ` — ${lead.referredBy}` : ""}`}
            />
            <div className="flex flex-col gap-1">
              <label
                className="text-[9px] font-medium uppercase tracking-widest"
                style={{ color: "rgba(13,13,13,0.42)" }}
              >
                Estado
              </label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                style={{
                  borderColor: "rgba(50,63,246,0.4)",
                  background: "#fff",
                  color: "#0D0D0D",
                }}
                value={lead.status}
                disabled={saving}
                onChange={(e) => void patchLead({ status: e.target.value as Lead["status"] })}
              >
                <option value="negociacion">Negociación</option>
                <option value="ganado">Ganado</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>

            {/* Notas — col span 2 */}
            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label
                  className="text-[9px] font-medium uppercase tracking-widest"
                  style={{ color: "rgba(13,13,13,0.42)" }}
                >
                  Notas
                </label>
                {!editNotes && (
                  <button
                    onClick={() => setEditNotes(true)}
                    className="text-xs hover:underline"
                    style={{ color: "#323FF6" }}
                  >
                    Editar
                  </button>
                )}
              </div>
              {editNotes ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full rounded border px-3 py-2 text-sm resize-y"
                    style={{
                      borderColor: "rgba(50,63,246,0.4)",
                      background: "#fff",
                      color: "#0D0D0D",
                      minHeight: 80,
                    }}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => void saveNotes()}
                      disabled={saving}
                      className="rounded px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                      style={{ background: "#0D0D0D" }}
                    >
                      {saving ? "Guardando…" : "Guardar"}
                    </button>
                    <button
                      onClick={() => {
                        setNotesValue(lead.notes);
                        setEditNotes(false);
                      }}
                      className="text-xs hover:underline"
                      style={{ color: "rgba(13,13,13,0.42)" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded px-3 py-2 text-sm leading-relaxed min-h-[60px]"
                  style={{ background: "#F9F3DB", color: "#0D0D0D" }}
                >
                  {lead.notes ? (
                    isFormMessage(lead.notes) ? (
                      <FormMessageViewer
                        message={lead.notes}
                        expanded={notesExpanded}
                        onToggle={() => setNotesExpanded((v) => !v)}
                      />
                    ) : (
                      lead.notes
                    )
                  ) : (
                    <span style={{ color: "rgba(13,13,13,0.35)" }}>Sin notas.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Convertir a cliente */}
          {lead.status !== "perdido" && (
            <div
              className="flex gap-4 items-center pt-5 mt-2 border-t"
              style={{ borderColor: "rgba(13,13,13,0.1)" }}
            >
              {lead.status === "ganado" || converted ? (
                <p className="text-sm font-medium flex-1" style={{ color: "#1a6b1a" }}>
                  {converted ? "✓ Convertida — redirigiendo…" : "✓ Ya es cliente"}
                </p>
              ) : (lead.pipelineStep ?? "negociacion") === "sena" ? (
                <>
                  <p className="text-sm flex-1 leading-relaxed" style={{ color: "rgba(13,13,13,0.5)" }}>
                    Seña recibida. Podés convertir este lead en cliente ahora.
                  </p>
                  <button
                    onClick={() => void convertToClient()}
                    disabled={converting}
                    className="rounded px-4 py-2 text-sm font-medium text-white whitespace-nowrap disabled:opacity-50"
                    style={{ background: "#F03172" }}
                  >
                    {converting ? "Convirtiendo…" : "Convertir a cliente →"}
                  </button>
                </>
              ) : (
                <div className="flex-1">
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(13,13,13,0.4)" }}>
                    El botón se habilita cuando el pipeline llega a{" "}
                    <strong style={{ color: "#0D0D0D" }}>Seña</strong>.
                    Avanzá los pasos en la barra de arriba a medida que progresa el proceso.
                  </p>
                  <button
                    disabled
                    className="mt-3 rounded px-4 py-2 text-sm font-medium text-white opacity-30 cursor-not-allowed"
                    style={{ background: "#0D0D0D" }}
                  >
                    Convertir a cliente →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Panel lateral ── */}
        <div className="flex flex-col gap-3">
          {/* Historial */}
          <div
            className="rounded border bg-white p-4"
            style={{ borderColor: "rgba(13,13,13,0.1)" }}
          >
            <p
              className="text-[9px] font-medium uppercase tracking-widest mb-3"
              style={{ color: "rgba(13,13,13,0.42)" }}
            >
              Historial
            </p>
            <TimelineRow color="#323FF6" text="Lead creado" date={lead.createdAt} />
            {lead.status === "ganado" && (
              <TimelineRow color="#F03172" text="Convertido a cliente" date={lead.updatedAt} />
            )}
            {lead.status === "perdido" && (
              <TimelineRow color="#b45000" text="Marcado como perdido" date={lead.updatedAt} />
            )}
          </div>

          {/* Acciones rápidas */}
          <div
            className="rounded border bg-white p-4"
            style={{ borderColor: "rgba(13,13,13,0.1)" }}
          >
            <p
              className="text-[9px] font-medium uppercase tracking-widest mb-3"
              style={{ color: "rgba(13,13,13,0.42)" }}
            >
              Acciones
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={`mailto:${lead.email}`}
                className="rounded border px-3 py-2 text-xs text-center hover:bg-neutral-50 transition-colors"
                style={{ borderColor: "rgba(13,13,13,0.15)", color: "#0D0D0D" }}
                title="Abre tu cliente de correo con el email cargado"
              >
                Escribirle por email →
              </a>
              {lead.status !== "perdido" && (
                <button
                  onClick={() =>
                    void patchLead({ status: "perdido" })
                  }
                  className="rounded border px-3 py-2 text-xs text-center hover:bg-neutral-50 transition-colors"
                  style={{ borderColor: "rgba(13,13,13,0.15)", color: "rgba(13,13,13,0.5)" }}
                >
                  Marcar como perdido
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setDeleteAck(false);
                  setDeletePhrase("");
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
                className="rounded border px-3 py-2 text-xs text-center transition-colors hover:bg-red-50"
                style={{ borderColor: "rgba(185,28,28,0.35)", color: "#b91c1c" }}
              >
                Eliminar lead…
              </button>
            </div>
          </div>

          {/* Datos del lead (resumen) */}
          <div
            className="rounded border p-4 text-xs space-y-2"
            style={{ borderColor: "rgba(13,13,13,0.1)", background: "#F9F3DB" }}
          >
            <p className="text-[9px] font-medium uppercase tracking-widest mb-1" style={{ color: "rgba(13,13,13,0.42)" }}>
              Resumen
            </p>
            <div className="flex justify-between">
              <span style={{ color: "rgba(13,13,13,0.42)" }}>Servicio</span>
              <span className="font-medium">{SERVICE_LABELS[lead.service] ?? lead.service}</span>
            </div>
            {lead.estimatedValue && (
              <div className="flex justify-between">
                <span style={{ color: "rgba(13,13,13,0.42)" }}>Valor est.</span>
                <span className="font-medium">${lead.estimatedValue.toLocaleString("es-AR")} USD</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: "rgba(13,13,13,0.42)" }}>Fuente</span>
              <span className="font-medium">{SOURCE_LABELS[lead.source] ?? lead.source}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "rgba(13,13,13,0.42)" }}>Estado</span>
              <StatusBadge status={lead.status} />
            </div>
          </div>
        </div>
      </div>

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(13,13,13,0.55)" }}
          onClick={(e) => e.target === e.currentTarget && !deleting && resetDeleteModal()}
        >
          <div
            className="w-full max-w-md rounded bg-white shadow-2xl p-5 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-lead-title"
          >
            <h3
              id="delete-lead-title"
              className="font-serif text-lg italic"
              style={{ color: "#b91c1c" }}
            >
              Eliminar lead
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(13,13,13,0.65)" }}>
              Se borrará de forma permanente el lead de{" "}
              <strong style={{ color: "#0D0D0D" }}>{lead.name}</strong>. Si existía un cliente
              vinculado por conversión, solo se quitará el enlace a este lead; el cliente y sus
              proyectos no se eliminan.
            </p>
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={deleteAck}
                disabled={deleting}
                onChange={(e) => setDeleteAck(e.target.checked)}
              />
              <span style={{ color: "#0D0D0D" }}>
                Confirmo que quiero eliminar este lead y entiendo que no se puede deshacer.
              </span>
            </label>
            <div>
              <label
                className="block text-[9px] font-medium uppercase tracking-widest mb-1"
                style={{ color: "rgba(13,13,13,0.42)" }}
              >
                Escribí <strong className="text-[#0D0D0D]">{DELETE_CONFIRM_PHRASE}</strong> para
                confirmar
              </label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2 text-sm"
                style={{
                  borderColor: "rgba(185,28,28,0.45)",
                  background: "#fff",
                  color: "#0D0D0D",
                }}
                autoComplete="off"
                disabled={deleting}
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
                placeholder={DELETE_CONFIRM_PHRASE}
              />
            </div>
            {deleteError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1.5">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={deleting}
                onClick={() => resetDeleteModal()}
                className="rounded border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  deleting ||
                  !deleteAck ||
                  deletePhrase.trim() !== DELETE_CONFIRM_PHRASE
                }
                onClick={() => void deleteLeadPermanently()}
                className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#b91c1c" }}
              >
                {deleting ? "Eliminando…" : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── helpers de UI ──────────────────────────────────────────
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-[9px] font-medium uppercase tracking-widest"
        style={{ color: "rgba(13,13,13,0.42)" }}
      >
        {label}
      </label>
      <div
        className="rounded px-3 py-2 text-sm"
        style={{ background: "#F9F3DB", color: "#0D0D0D" }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    ganado: { bg: "#e3f2e3", color: "#1a6b1a" },
    perdido: { bg: "#fee2e2", color: "#b91c1c" },
    negociacion: { bg: "rgba(50,63,246,0.08)", color: "#323FF6" },
  };
  const s = map[status] ?? map.negociacion;
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function TimelineRow({
  color,
  text,
  date,
}: {
  color: string;
  text: string;
  date: Date | string;
}) {
  return (
    <div className="flex gap-2 items-start py-2 border-b last:border-b-0" style={{ borderColor: "rgba(13,13,13,0.07)" }}>
      <div
        className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
        style={{ background: color }}
      />
      <div>
        <p className="text-xs" style={{ color: "#0D0D0D" }}>{text}</p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(13,13,13,0.42)" }}>
          {new Date(date).toLocaleDateString("es-AR", { dateStyle: "medium" })}
        </p>
      </div>
    </div>
  );
}
