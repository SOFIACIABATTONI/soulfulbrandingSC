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
  archivado: { bg: "rgba(13,13,13,0.06)", color: "rgba(13,13,13,0.35)", label: "Archivado" },
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
              style={{ borderColor: "rgba(13,13,13,0.1)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Cabecera */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm text-[#0D0D0D]">
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
                        background: "rgba(13,13,13,0.06)",
                        color: "rgba(13,13,13,0.42)",
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
                  <p className="text-[10px] mt-1.5" style={{ color: "rgba(13,13,13,0.35)" }}>
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
                      style={{ background: "#0D0D0D" }}
                    >
                      Crear lead →
                    </button>
                  )}
                  {msg.status === "nuevo" && (
                    <button
                      onClick={() => void patchStatus(msg.id, "contactado")}
                      className="rounded border px-3 py-1.5 text-[11px] text-center"
                      style={{
                        borderColor: "rgba(13,13,13,0.15)",
                        color: "rgba(13,13,13,0.5)",
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
                        borderColor: "rgba(13,13,13,0.1)",
                        color: "rgba(13,13,13,0.3)",
                      }}
                    >
                      Archivar
                    </button>
                  )}
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
          style={{ background: "rgba(13,13,13,0.55)" }}
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
                style={{ background: "#F9F3DB" }}
              >
                <p className="text-[9px] font-medium uppercase tracking-widest mb-2" style={{ color: "rgba(13,13,13,0.42)" }}>
                  Desde mensaje de contacto
                </p>
                <div className="flex gap-2">
                  <span style={{ color: "rgba(13,13,13,0.42)" }}>Nombre:</span>
                  <span className="font-medium">{modalMsg.name}</span>
                </div>
                <div className="flex gap-2">
                  <span style={{ color: "rgba(13,13,13,0.42)" }}>Email:</span>
                  <span className="font-medium">{modalMsg.email}</span>
                </div>
                {modalMsg.stageTitle && (
                  <div className="flex gap-2">
                    <span style={{ color: "rgba(13,13,13,0.42)" }}>Etapa:</span>
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
                    placeholder="3200"
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
                  style={{ background: "#0D0D0D" }}
                >
                  {saving ? "Creando…" : "Crear lead →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .fld-label {
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(13,13,13,0.42);
        }
        .fv {
          width: 100%;
          padding: 7px 10px;
          font-size: 13px;
          border: 1px solid rgba(13,13,13,0.15);
          border-radius: 2px;
          background: #F9F3DB;
          color: #0D0D0D;
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
