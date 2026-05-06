"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Client } from "@prisma/client";
import { InvoicesManager } from "./InvoicesManager";
import { NewProjectModal } from "./NewProjectModal";

// ── tipos extendidos ───────────────────────────────────────
type ProjectSummary = {
  id: string;
  title: string;
  service: string;
  status: string;
  value: number;
  startDate: string | null;
  deliveryDate: string | null;
};

type InvoiceSummary = {
  id: string;
  number: string;
  type: string;
  total: number;
  status: string;
  issuedAt: string;
};

type ClientFull = Client & {
  lead?: { id: string; service: string; estimatedValue: number | null } | null;
  projects: ProjectSummary[];
  invoices: InvoiceSummary[];
  _count: { projects: number; invoices: number };
};

// ── helpers de UI ──────────────────────────────────────────
const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  diseno: "Diseño",
  implementacion: "Implementación",
  entregado: "Entregado",
};

const PROJECT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  onboarding: { bg: "rgba(50,63,246,0.08)", color: "#323FF6" },
  diseno: { bg: "rgba(240,49,114,0.1)", color: "#F03172" },
  implementacion: { bg: "rgba(255,160,0,0.12)", color: "#b45000" },
  entregado: { bg: "#e3f2e3", color: "#1a6b1a" },
};


function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { dateStyle: "medium" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const DELETE_CONFIRM_PHRASE = "ELIMINAR";

// ── componente principal ───────────────────────────────────
export function ClientDetail({ client: initial }: { client: ClientFull }) {
  const router = useRouter();
  const [client, setClient] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(initial.notes);
  const [editingField, setEditingField] = useState<"name" | "email" | "phone" | "company" | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAck, setDeleteAck] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function patchClient(data: Partial<Client>) {
    setSaving(true);
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) {
      const j = (await res.json()) as { item: Client };
      setClient((prev) => ({ ...prev, ...j.item }));
    }
  }

  async function saveNotes() {
    await patchClient({ notes: notesValue });
    setEditNotes(false);
  }

  function startEdit(field: "name" | "email" | "phone" | "company") {
    setEditingField(field);
    setFieldValue(String(client[field] ?? ""));
  }

  async function saveField() {
    if (!editingField) return;
    await patchClient({ [editingField]: fieldValue });
    setEditingField(null);
  }

  function resetDeleteModal() {
    setDeleteOpen(false);
    setDeleteAck(false);
    setDeletePhrase("");
    setDeleteError(null);
  }

  async function deleteClientPermanently() {
    setDeleteError(null);
    setDeleting(true);
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleting(false);
    if (res.ok) {
      resetDeleteModal();
      router.push("/admin/clientes");
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

  const ini = initials(client.name);

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      {/* ── Panel principal ── */}
      <div className="space-y-4">
        {/* Cabecera */}
        <div
          className="rounded border bg-white p-6"
          style={{ borderColor: "rgba(13,13,13,0.1)" }}
        >
          <div
            className="flex gap-4 items-start pb-5 mb-5 border-b"
            style={{ borderColor: "rgba(13,13,13,0.1)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-serif text-2xl text-white"
              style={{ background: "#F03172" }}
            >
              {ini}
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-2xl" style={{ color: "#0D0D0D" }}>
                {client.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: "rgba(13,13,13,0.42)" }}>
                {[client.company, client.email].filter(Boolean).join(" · ")}
              </p>
              {client.lead && (
                <p className="text-xs mt-1.5" style={{ color: "rgba(13,13,13,0.35)" }}>
                  Convertida desde lead ·{" "}
                  {SERVICE_LABELS[client.lead.service] ?? client.lead.service}
                  {client.lead.estimatedValue
                    ? ` · $${client.lead.estimatedValue.toLocaleString("es-AR")} USD`
                    : ""}
                </p>
              )}
            </div>
          </div>

          {/* Campos editables */}
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Nombre completo"
              value={client.name}
              editing={editingField === "name"}
              fieldValue={fieldValue}
              saving={saving}
              onEdit={() => startEdit("name")}
              onChange={setFieldValue}
              onSave={() => void saveField()}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="Empresa / Marca"
              value={client.company || "—"}
              editing={editingField === "company"}
              fieldValue={fieldValue}
              saving={saving}
              onEdit={() => startEdit("company")}
              onChange={setFieldValue}
              onSave={() => void saveField()}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="Email"
              value={client.email}
              editing={editingField === "email"}
              fieldValue={fieldValue}
              saving={saving}
              onEdit={() => startEdit("email")}
              onChange={setFieldValue}
              onSave={() => void saveField()}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="Teléfono"
              value={client.phone || "—"}
              editing={editingField === "phone"}
              fieldValue={fieldValue}
              saving={saving}
              onEdit={() => startEdit("phone")}
              onChange={setFieldValue}
              onSave={() => void saveField()}
              onCancel={() => setEditingField(null)}
            />

            {/* Notas — col span 2 */}
            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label
                  className="text-[9px] font-medium uppercase tracking-widest"
                  style={{ color: "rgba(13,13,13,0.42)" }}
                >
                  Notas internas
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
                        setNotesValue(client.notes);
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
                  {client.notes || (
                    <span style={{ color: "rgba(13,13,13,0.35)" }}>
                      Sin notas.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proyectos */}
        <ProjectsSection client={client} />

        {/* Facturas */}
        <div
          className="rounded border bg-white p-5"
          style={{ borderColor: "rgba(13,13,13,0.1)" }}
        >
          <h3
            className="text-[9px] font-medium uppercase tracking-widest mb-4"
            style={{ color: "rgba(13,13,13,0.42)" }}
          >
            Facturas
          </h3>
          <InvoicesManager initialClientId={client.id} />
        </div>
      </div>

      {/* ── Panel lateral ── */}
      <div className="flex flex-col gap-3">
        {/* Acciones */}
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
              href={`mailto:${client.email}`}
              className="rounded border px-3 py-2 text-xs text-center hover:bg-neutral-50 transition-colors"
              style={{ borderColor: "rgba(13,13,13,0.15)", color: "#0D0D0D" }}
            >
              Enviar email
            </a>
            {client.lead && (
              <Link
                href={`/admin/leads/${client.lead.id}`}
                className="rounded border px-3 py-2 text-xs text-center hover:bg-neutral-50 transition-colors"
                style={{ borderColor: "rgba(13,13,13,0.15)", color: "#323FF6" }}
              >
                Ver lead original →
              </Link>
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
              Eliminar cliente…
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div
          className="rounded border p-4 text-xs space-y-2"
          style={{ borderColor: "rgba(13,13,13,0.1)", background: "#F9F3DB" }}
        >
          <p
            className="text-[9px] font-medium uppercase tracking-widest mb-1"
            style={{ color: "rgba(13,13,13,0.42)" }}
          >
            Resumen
          </p>
          <div className="flex justify-between">
            <span style={{ color: "rgba(13,13,13,0.42)" }}>Alta</span>
            <span className="font-medium">{formatDate(client.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "rgba(13,13,13,0.42)" }}>Proyectos</span>
            <span className="font-medium">{client._count.projects}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "rgba(13,13,13,0.42)" }}>Facturas</span>
            <span className="font-medium">{client._count.invoices}</span>
          </div>
          {client.invoices.length > 0 && (
            <div className="flex justify-between pt-1 border-t" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
              <span style={{ color: "rgba(13,13,13,0.42)" }}>Total facturado</span>
              <span className="font-medium">
                ${client.invoices
                  .reduce((acc, inv) => acc + inv.total, 0)
                  .toLocaleString("es-AR")}{" "}
                USD
              </span>
            </div>
          )}
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
          aria-labelledby="delete-client-title"
        >
          <h3
            id="delete-client-title"
            className="font-serif text-lg italic"
            style={{ color: "#b91c1c" }}
          >
            Eliminar cliente
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(13,13,13,0.65)" }}>
            Se borrará de forma permanente la ficha de{" "}
            <strong style={{ color: "#0D0D0D" }}>{client.name}</strong> y todo lo asociado en el
            ERP: proyectos, facturas y enlaces de acceso de este cliente. El lead en el embudo, si
            existía, no se elimina.
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
              Confirmo que quiero eliminar este cliente y entiendo que no se puede deshacer.
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
              onClick={() => void deleteClientPermanently()}
              className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#b91c1c" }}
            >
              {deleting ? "Eliminando…" : "Eliminar definitivamente"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── sección proyectos con modal ────────────────────────────
function ProjectsSection({ client }: { client: ClientFull }) {
  const [projects, setProjects] = useState(client.projects);
  const [modalOpen, setModalOpen] = useState(false);

  function onCreated(p: ProjectSummary) {
    setProjects((prev) => [p, ...prev]);
    setModalOpen(false);
  }

  return (
    <div className="rounded border bg-white p-5" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[9px] font-medium uppercase tracking-widest"
          style={{ color: "rgba(13,13,13,0.42)" }}>
          Proyectos ({projects.length})
        </h3>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded px-3 py-1.5 text-[11px] font-medium text-white"
          style={{ background: "#0D0D0D" }}
        >
          + Nuevo proyecto
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-neutral-400 py-4 text-center">
          Todavía no hay proyectos. Creá el primero.
        </p>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => {
            const sc = PROJECT_STATUS_COLORS[p.status] ?? PROJECT_STATUS_COLORS.onboarding;
            return (
              <div key={p.id} className="flex items-center justify-between rounded px-4 py-3 border"
                style={{ borderColor: "rgba(13,13,13,0.08)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>{p.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(13,13,13,0.42)" }}>
                    {SERVICE_LABELS[p.service] ?? p.service}
                    {" · "}${p.value.toLocaleString("es-AR")} USD
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-wide rounded px-2 py-0.5"
                    style={{ background: sc.bg, color: sc.color }}>
                    {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                  </span>
                  <Link href={`/admin/proyectos/${p.id}`}
                    className="text-xs font-medium hover:underline" style={{ color: "#F03172" }}>
                    Ver →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <NewProjectModal
          clientId={client.id}
          clientName={client.name}
          onClose={() => setModalOpen(false)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}

// ── campo editable inline ──────────────────────────────────
function EditableField({
  label,
  value,
  editing,
  fieldValue,
  saving,
  onEdit,
  onChange,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  editing: boolean;
  fieldValue: string;
  saving: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label
          className="text-[9px] font-medium uppercase tracking-widest"
          style={{ color: "rgba(13,13,13,0.42)" }}
        >
          {label}
        </label>
        {!editing && (
          <button
            onClick={onEdit}
            className="text-[10px] hover:underline"
            style={{ color: "#323FF6" }}
          >
            Editar
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex gap-1">
          <input
            autoFocus
            className="flex-1 rounded border px-2 py-1.5 text-sm"
            style={{
              borderColor: "rgba(50,63,246,0.4)",
              background: "#fff",
              color: "#0D0D0D",
            }}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancel();
            }}
          />
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
            style={{ background: "#0D0D0D" }}
          >
            ✓
          </button>
          <button
            onClick={onCancel}
            className="rounded px-2 py-1 text-xs"
            style={{ color: "rgba(13,13,13,0.42)" }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          className="rounded px-3 py-2 text-sm"
          style={{ background: "#F9F3DB", color: "#0D0D0D" }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
