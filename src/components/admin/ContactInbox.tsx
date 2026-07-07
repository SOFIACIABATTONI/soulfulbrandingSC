"use client";

import { useEffect, useState } from "react";
import { FormMessageViewer } from "./FormMessageViewer";

// ── tipos ──────────────────────────────────────────────────
type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  formKey: string;
  stageTitle: string;
  status: string;
  createdAt: string;
};

// ── helpers ────────────────────────────────────────────────
const FORM_KEY_LABELS: Record<string, string> = {
  "contacto-corto": "Contacto corto",
  "aplicacion-inicio": "Aplicación Inicio",
  "contacto-evolucion": "Contacto Evolución",
  "aplicacion-expansion": "Aplicación Expansión",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  nuevo: { bg: "rgba(240,49,114,0.1)", color: "#F03172", label: "Nuevo" },
  contactado: { bg: "rgba(50,63,246,0.08)", color: "#323FF6", label: "Contactado" },
  archivado: { bg: "rgba(19,25,69,0.06)", color: "rgba(19,25,69,0.35)", label: "Archivado" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { dateStyle: "medium" });
}

const EMPTY_LEAD_FORM = {
  service: "identidad-de-marca",
  estimatedValue: "",
  source: "web",
  notes: "",
};

const DELETE_CONFIRM_PHRASE = "ELIMINAR";

// ── componente principal ───────────────────────────────────
export function ContactInbox({ onNewCountChange }: { onNewCountChange?: (n: number) => void }) {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [modalMsg, setModalMsg] = useState<ContactMessage | null>(null);
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD_FORM);
  const [saving, setSaving] = useState(false);
  // msgId → leadId creado
  const [convertedLeads, setConvertedLeads] = useState<Record<string, string>>({});
  // conteo local de "nuevos" para actualizar el badge sin recargar
  const [localNewCount, setLocalNewCount] = useState<number | null>(null);
  // msgId → expandido
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteMsg, setDeleteMsg] = useState<ContactMessage | null>(null);
  const [deleteAck, setDeleteAck] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function load() {
    const res = await fetch("/api/admin/contact-messages", {
      credentials: "include",
    });
    if (res.ok) {
      const j = (await res.json()) as { items: ContactMessage[] };
      setItems(j.items);
      const n = j.items.filter((m) => m.status === "nuevo").length;
      setLocalNewCount(n);
      onNewCountChange?.(n);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function patchStatus(id: string, status: string) {
    const prev = items.find((m) => m.id === id);
    await fetch(`/api/admin/contact-messages/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setItems((all) => all.map((m) => (m.id === id ? { ...m, status } : m)));
    // actualizar badge en tiempo real
    if (prev?.status === "nuevo" && status !== "nuevo") {
      const baseline =
        localNewCount ?? items.filter((m) => m.status === "nuevo").length;
      const next = Math.max(0, baseline - 1);
      setLocalNewCount(next);
      onNewCountChange?.(next);
    }
  }

  function resetDeleteModal() {
    setDeleteMsg(null);
    setDeleteAck(false);
    setDeletePhrase("");
    setDeleteError(null);
  }

  async function deleteMessagePermanently() {
    if (!deleteMsg) return;
    setDeleteError(null);
    setDeleting(true);
    const res = await fetch(`/api/admin/contact-messages/${deleteMsg.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleting(false);
    if (res.ok) {
      const wasNew = deleteMsg.status === "nuevo";
      setItems((all) => all.filter((m) => m.id !== deleteMsg.id));
      if (wasNew) {
        const baseline =
          localNewCount ?? items.filter((m) => m.status === "nuevo").length;
        const next = Math.max(0, baseline - 1);
        setLocalNewCount(next);
        onNewCountChange?.(next);
      }
      resetDeleteModal();
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

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    if (!modalMsg) return;
    setSaving(true);
    const res = await fetch("/api/admin/leads", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: modalMsg.name,
        email: modalMsg.email,
        service: leadForm.service,
        estimatedValue: leadForm.estimatedValue
          ? Number(leadForm.estimatedValue)
          : undefined,
        source: leadForm.source,
        notes: leadForm.notes || modalMsg.message,
        fromContactMessage: modalMsg.id,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const j = (await res.json()) as { item: { id: string } };
      await patchStatus(modalMsg.id, "contactado");
      setConvertedLeads((prev) => ({ ...prev, [modalMsg.id]: j.item.id }));
      setModalMsg(null);
      setLeadForm(EMPTY_LEAD_FORM);
    }
  }

  const filtered = items.filter((m) => {
    if (filterStatus === "todos") return true;
    return m.status === filterStatus;
  });

  const newCount = localNewCount ?? items.filter((m) => m.status === "nuevo").length;

  if (loading)
    return (
      <p className="py-12 text-center text-sm text-neutral-500">
        Cargando mensajes…
      </p>
    );

  return (
    <div className="space-y-5">
      {/* ── Barra herramientas ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="nuevo">Nuevos</option>
          <option value="contactado">Contactados</option>
          <option value="archivado">Archivados</option>
        </select>
        <span className="text-sm text-neutral-400">
          {filtered.length} de {items.length}
          {newCount > 0 && (
            <span
              className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ background: "#F03172" }}
            >
              {newCount} nuevos
            </span>
          )}
        </span>
      </div>

      {/* ── Lista ── */}
      <div className="space-y-2">
        {filtered.map((msg) => {
          const st = STATUS_STYLES[msg.status] ?? STATUS_STYLES.nuevo;
          const isConverted = !!convertedLeads[msg.id];
          return (
            <div
              key={msg.id}
              className="rounded border bg-white p-4"
              style={{ borderColor: "rgba(19,25,69,0.1)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Cabecera */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm text-[#131945]">
                      {msg.name}
                    </span>
                    <span className="text-xs text-neutral-400">{msg.email}</span>
                    <span
                      className="inline-block rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                    <span
                      className="inline-block rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                      style={{
                        background: "rgba(19,25,69,0.06)",
                        color: "rgba(19,25,69,0.42)",
                      }}
                    >
                      {FORM_KEY_LABELS[msg.formKey] ?? msg.formKey}
                    </span>
                    {msg.stageTitle && (
                      <span className="text-[10px] text-neutral-400 italic">
                        {msg.stageTitle}
                      </span>
                    )}
                  </div>

                  {/* Mensaje */}
                  <FormMessageViewer
                    message={msg.message}
                    expanded={!!expanded[msg.id]}
                    onToggle={() => toggleExpanded(msg.id)}
                  />
                  <p className="text-[10px] mt-1.5" style={{ color: "rgba(19,25,69,0.35)" }}>
                    {formatDate(msg.createdAt)}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {convertedLeads[msg.id] ? (
                    <a
                      href={`/admin/leads/${convertedLeads[msg.id]}`}
                      className="rounded px-3 py-1.5 text-[11px] font-medium text-center whitespace-nowrap block"
                      style={{ background: "#e3f2e3", color: "#1a6b1a" }}
                    >
                      ✓ Ver lead →
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        setLeadForm(EMPTY_LEAD_FORM);
                        setModalMsg(msg);
                      }}
                      className="rounded px-3 py-1.5 text-[11px] font-medium text-white whitespace-nowrap"
                      style={{ background: "#F03172" }}
                    >
                      Crear lead →
                    </button>
                  )}
                  {msg.status === "nuevo" && (
                    <button
                      onClick={() => void patchStatus(msg.id, "contactado")}
                      className="rounded border px-3 py-1.5 text-[11px] text-center"
                      style={{
                        borderColor: "rgba(19,25,69,0.15)",
                        color: "rgba(19,25,69,0.5)",
                      }}
                    >
                      Marcar contactado
                    </button>
                  )}
                  {msg.status !== "archivado" && (
                    <button
                      onClick={() => void patchStatus(msg.id, "archivado")}
                      className="rounded border px-3 py-1.5 text-[11px] text-center"
                      style={{
                        borderColor: "rgba(19,25,69,0.1)",
                        color: "rgba(19,25,69,0.3)",
                      }}
                    >
                      Archivar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteAck(false);
                      setDeletePhrase("");
                      setDeleteError(null);
                      setDeleteMsg(msg);
                    }}
                    className="rounded border px-3 py-1.5 text-[11px] text-center transition-colors hover:bg-red-50"
                    style={{
                      borderColor: "rgba(185,28,28,0.35)",
                      color: "#b91c1c",
                    }}
                  >
                    Eliminar…
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            {items.length === 0
              ? "Todavía no hay mensajes de contacto."
              : "No hay mensajes con este filtro."}
          </p>
        )}
      </div>

      {/* ── Modal crear lead ── */}
      {modalMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(19,25,69,0.2)" }}
          onClick={(e) => e.target === e.currentTarget && setModalMsg(null)}
        >
          <div className="w-full max-w-lg rounded bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sticky top-0 bg-white z-10">
              <h2 className="font-serif text-lg italic">Crear lead</h2>
              <button
                onClick={() => setModalMsg(null)}
                className="text-xl text-neutral-400 hover:text-neutral-700 leading-none px-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={createLead} className="p-5 space-y-4">
              {/* Datos del mensaje (solo lectura) */}
              <div
                className="rounded p-3 text-xs space-y-1"
                style={{ background: "#FFFFFF" }}
              >
                <p className="text-[9px] font-medium uppercase tracking-widest mb-2" style={{ color: "rgba(19,25,69,0.42)" }}>
                  Desde mensaje de contacto
                </p>
                <div className="flex gap-2">
                  <span style={{ color: "rgba(19,25,69,0.42)" }}>Nombre:</span>
                  <span className="font-medium">{modalMsg.name}</span>
                </div>
                <div className="flex gap-2">
                  <span style={{ color: "rgba(19,25,69,0.42)" }}>Email:</span>
                  <span className="font-medium">{modalMsg.email}</span>
                </div>
                {modalMsg.stageTitle && (
                  <div className="flex gap-2">
                    <span style={{ color: "rgba(19,25,69,0.42)" }}>Etapa:</span>
                    <span className="font-medium">{modalMsg.stageTitle}</span>
                  </div>
                )}
              </div>

              {/* Campos del lead */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="fld-label">Servicio interesado</label>
                  <select
                    className="fv"
                    value={leadForm.service}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, service: e.target.value })
                    }
                  >
                    <option value="identidad-de-marca">Identidad de marca</option>
                    <option value="estrategia-visual">Estrategia visual</option>
                    <option value="diseno-editorial">Diseño editorial</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="fld-label">Valor estimado (USD)</label>
                  <input
                    type="number"
                    className="fv"
                    placeholder="Valor en USD"
                    value={leadForm.estimatedValue}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, estimatedValue: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="fld-label">Fuente</label>
                  <select
                    className="fv"
                    value={leadForm.source}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, source: e.target.value })
                    }
                  >
                    <option value="web">Web</option>
                    <option value="referido">Referido</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="fld-label">Notas internas</label>
                  <textarea
                    className="fv w-full resize-y"
                    rows={3}
                    placeholder="Se copiará el mensaje si se deja vacío…"
                    value={leadForm.notes}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-neutral-100 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setModalMsg(null)}
                  className="rounded border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "#F03172" }}
                >
                  {saving ? "Creando…" : "Crear lead →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(19,25,69,0.2)" }}
          onClick={(e) => e.target === e.currentTarget && !deleting && resetDeleteModal()}
        >
          <div
            className="w-full max-w-md rounded bg-white shadow-2xl p-5 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-msg-title"
          >
            <h3
              id="delete-msg-title"
              className="font-serif text-lg italic"
              style={{ color: "#b91c1c" }}
            >
              Eliminar mensaje
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(19,25,69,0.65)" }}>
              Se borrará de forma permanente el mensaje de{" "}
              <strong style={{ color: "#131945" }}>{deleteMsg.name}</strong> ({deleteMsg.email}).
              Si ya creaste un lead desde este mensaje, el lead no se elimina.
            </p>
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={deleteAck}
                disabled={deleting}
                onChange={(e) => setDeleteAck(e.target.checked)}
              />
              <span style={{ color: "#131945" }}>
                Confirmo que quiero eliminar este mensaje y entiendo que no se puede deshacer.
              </span>
            </label>
            <div>
              <label
                className="block text-[9px] font-medium uppercase tracking-widest mb-1"
                style={{ color: "rgba(19,25,69,0.42)" }}
              >
                Escribí <strong className="text-[#131945]">{DELETE_CONFIRM_PHRASE}</strong> para
                confirmar
              </label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2 text-sm"
                style={{
                  borderColor: "rgba(185,28,28,0.45)",
                  background: "#fff",
                  color: "#131945",
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
                onClick={() => void deleteMessagePermanently()}
                className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#b91c1c" }}
              >
                {deleting ? "Eliminando…" : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fld-label {
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(19,25,69,0.42);
        }
        .fv {
          width: 100%;
          padding: 7px 10px;
          font-size: 13px;
          border: 1px solid rgba(19,25,69,0.15);
          border-radius: 2px;
          background: #FFFFFF;
          color: #131945;
          outline: none;
        }
        .fv:focus {
          border-color: rgba(50,63,246,0.5);
          background: #fff;
        }
        select.fv { appearance: auto; }
      `}</style>
    </div>
  );
}
