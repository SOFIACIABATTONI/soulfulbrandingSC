"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  INVOICE_TYPE_SHORT,
  projectHasFinalInvoice,
  projectHasSenaInvoice,
  projectSenaIsPaid,
  suggestedFinalTotal,
  validateInvoiceCreate,
} from "@/lib/invoice-utils";

// ── tipos ──────────────────────────────────────────────────
type InvoiceItem = {
  id: string;
  number: string;
  type: string;
  total: number;
  status: string;
  issuedAt: string;
  paidAt: string | null;
  emailSentAt: string | null;
  notes: string;
  client: { id: string; name: string; company: string };
  project: { id: string; title: string } | null;
};

type ClientOption = { id: string; name: string; company: string };

type ProjectOption = {
  id: string;
  title: string;
  service: string;
  value: number;
  status: string;
  clientId: string;
};

// ── helpers ────────────────────────────────────────────────
const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

function defaultInvoiceType(
  projectId: string,
  invoices: InvoiceItem[],
): "sena" | "final" {
  if (!projectId) return "sena";
  if (projectHasSenaInvoice(invoices, projectId) && projectSenaIsPaid(invoices, projectId)) {
    if (!projectHasFinalInvoice(invoices, projectId)) return "final";
  }
  return "sena";
}

function defaultInvoiceTotal(
  project: ProjectOption | undefined,
  type: string,
  projectId: string,
  invoices: InvoiceItem[],
): string {
  if (!project) return "";
  if (type === "final") {
    const remaining = suggestedFinalTotal(project.value, invoices, projectId);
    return remaining > 0 ? String(remaining) : "";
  }
  return "";
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { dateStyle: "short" });
}

function StatusPill({ status }: { status: string }) {
  const isPaid = status === "pagado";
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
      style={
        isPaid
          ? { background: "#e3f2e3", color: "#1a6b1a" }
          : { background: "rgba(255,160,0,0.12)", color: "#b45000" }
      }
    >
      {isPaid ? "Pagada" : "Pendiente"}
    </span>
  );
}

const EMPTY_FORM = {
  clientId: "",
  projectId: "",
  type: "sena",
  total: "",
  status: "pendiente",
  notes: "",
  issuedAt: new Date().toISOString().slice(0, 10),
};

// ── componente principal ───────────────────────────────────
export function InvoicesManager({
  initialClientId,
  initialProjectId,
}: {
  initialClientId?: string;
  initialProjectId?: string;
}) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterType, setFilterType] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [emailStatusById, setEmailStatusById] = useState<
    Record<string, "sending" | "sent" | "failed">
  >({});
  const [linkingProject, setLinkingProject] = useState<string | null>(null);
  const autoOpenedRef = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    clientId: initialClientId ?? "",
    projectId: initialProjectId ?? "",
  });

  const clientProjects = useMemo(
    () => projects.filter((p) => p.clientId === form.clientId),
    [projects, form.clientId],
  );

  function projectsForClient(clientId: string) {
    return projects.filter((p) => p.clientId === clientId);
  }

  function openNewInvoiceModal(preferredType?: "sena" | "final") {
    const clientId = initialClientId ?? "";
    const clientProjs = projectsForClient(clientId);
    const projectId =
      initialProjectId ??
      (clientProjs.length === 1 ? clientProjs[0].id : "");
    const project = clientProjs.find((p) => p.id === projectId);
    const type = preferredType ?? defaultInvoiceType(projectId, items);
    setFormError(null);
    setForm({
      ...EMPTY_FORM,
      clientId,
      projectId,
      type,
      total: defaultInvoiceTotal(project, type, projectId, items),
    });
    setModalOpen(true);
  }

  function setClientId(clientId: string) {
    const clientProjs = projectsForClient(clientId);
    const projectId = clientProjs.length === 1 ? clientProjs[0].id : "";
    const project = clientProjs.find((p) => p.id === projectId);
    const type = defaultInvoiceType(projectId, items);
    setFormError(null);
    setForm((f) => ({
      ...f,
      clientId,
      projectId,
      type,
      total: defaultInvoiceTotal(project, type, projectId, items),
    }));
  }

  function setProjectId(projectId: string) {
    const project = clientProjects.find((p) => p.id === projectId);
    const type = defaultInvoiceType(projectId, items);
    setFormError(null);
    setForm((f) => ({
      ...f,
      projectId,
      type,
      total: defaultInvoiceTotal(project, type, projectId, items),
    }));
  }

  function setInvoiceType(type: "sena" | "final") {
    const project = clientProjects.find((p) => p.id === form.projectId);
    setFormError(null);
    setForm((f) => ({
      ...f,
      type,
      total: defaultInvoiceTotal(project, type, f.projectId, items),
    }));
  }

  const formValidation = useMemo(() => {
    if (!form.projectId) return { ok: true as const };
    const project = clientProjects.find((p) => p.id === form.projectId);
    const projectInvoices = items.filter((i) => i.project?.id === form.projectId);
    return validateInvoiceCreate(
      form.type as "sena" | "final",
      form.projectId,
      project?.value,
      projectInvoices,
    );
  }, [form.projectId, form.type, clientProjects, items]);

  async function load() {
    const [invRes, cliRes, projRes] = await Promise.all([
      fetch("/api/admin/invoices", { credentials: "include" }),
      fetch("/api/admin/clients", { credentials: "include" }),
      fetch("/api/admin/projects-erp", { credentials: "include" }),
    ]);
    if (invRes.ok) {
      const j = (await invRes.json()) as { items: InvoiceItem[] };
      setItems(j.items);
    }
    if (cliRes.ok) {
      const j = (await cliRes.json()) as { items: ClientOption[] };
      setClients(j.items);
    }
    if (projRes.ok) {
      const j = (await projRes.json()) as { items: ProjectOption[] };
      setProjects(j.items);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!loading && initialProjectId && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      openNewInvoiceModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialProjectId]);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (filterStatus !== "todos" && r.status !== filterStatus) return false;
      if (filterType !== "todos" && r.type !== filterType) return false;
      if (initialClientId && r.client.id !== initialClientId) return false;
      return true;
    });
  }, [items, filterStatus, filterType, initialClientId]);

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!formValidation.ok) {
      setFormError(formValidation.error);
      return;
    }
    setSaving(true);
    setFormError(null);
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || undefined,
        total: Number(form.total),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setModalOpen(false);
      setForm({
        ...EMPTY_FORM,
        clientId: initialClientId ?? "",
        projectId: initialProjectId ?? "",
      });
      await load();
    } else {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      setFormError(j?.error ?? "No se pudo crear el documento.");
    }
  }

  async function linkProject(invoiceId: string, projectId: string | null) {
    setLinkingProject(invoiceId);
    await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    setLinkingProject(null);
    await load();
  }

  async function markPaid(id: string) {
    setMarkingPaid(id);
    await fetch(`/api/admin/invoices/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pagado" }),
    });
    setMarkingPaid(null);
    await load();
  }

  async function sendByEmail(id: string) {
    setEmailStatusById((prev) => ({ ...prev, [id]: "sending" }));
    const res = await fetch(`/api/admin/invoices/${id}/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const j = (await res.json()) as {
        emailed?: boolean;
        emailSentAt?: string | null;
        error?: string;
      };
      if (j.emailed) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, emailSentAt: j.emailSentAt ?? new Date().toISOString() }
              : item,
          ),
        );
        setEmailStatusById((prev) => ({ ...prev, [id]: "sent" }));
      } else {
        setEmailStatusById((prev) => ({ ...prev, [id]: "failed" }));
      }
    } else {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      setEmailStatusById((prev) => ({ ...prev, [id]: "failed" }));
      if (j?.error) console.warn("[invoice send]", j.error);
    }
  }

  function renderEmailAction(row: InvoiceItem) {
    const status = emailStatusById[row.id];
    if (status === "sending") {
      return (
        <span className="text-xs font-medium" style={{ color: "rgba(19,25,69,0.45)" }}>
          Enviando…
        </span>
      );
    }
    if (status === "sent" || row.emailSentAt) {
      return (
        <span
          className="text-xs font-medium"
          style={{ color: "#1a6b1a" }}
          title={row.emailSentAt ? `Enviado ${formatDate(row.emailSentAt)}` : undefined}
        >
          Enviado ✓
        </span>
      );
    }
    if (status === "failed") {
      return (
        <button
          type="button"
          onClick={() => void sendByEmail(row.id)}
          className="text-xs font-medium hover:underline text-left"
          style={{ color: "#b45000" }}
          title="Tocá para reintentar"
        >
          No se pudo enviar
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => void sendByEmail(row.id)}
        className="text-xs font-medium hover:underline"
        style={{ color: "#F03172" }}
      >
        Enviar mail
      </button>
    );
  }

  const totalPendiente = filtered
    .filter((i) => i.status === "pendiente")
    .reduce((acc, i) => acc + i.total, 0);

  if (loading)
    return <p className="py-12 text-center text-sm text-neutral-500">Cargando documentos…</p>;

  const selectedProject = clientProjects.find((p) => p.id === form.projectId);
  const modalTitle =
    form.type === "sena" ? "Nuevo recibo de seña" : "Nueva factura final";

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      {/* ── Resumen ── */}
      {filtered.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div
            className="rounded border px-4 py-2.5 text-sm"
            style={{ borderColor: "rgba(19,25,69,0.1)", background: "#fff" }}
          >
            <span style={{ color: "rgba(19,25,69,0.42)" }}>Documentos: </span>
            <span className="font-medium">{filtered.length}</span>
          </div>
          {totalPendiente > 0 && (
            <div
              className="rounded border px-4 py-2.5 text-sm"
              style={{ borderColor: "rgba(255,160,0,0.3)", background: "#fff4e0" }}
            >
              <span style={{ color: "#b45000" }}>Por cobrar: </span>
              <span className="font-medium" style={{ color: "#b45000" }}>
                €{totalPendiente.toLocaleString("es-AR")} EUR
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Filtros + botón ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagado">Pagadas</option>
        </select>
        <select
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="todos">Todos los tipos</option>
          <option value="sena">Recibo de seña</option>
          <option value="final">Factura final</option>
        </select>
        <span className="text-sm text-neutral-400">{filtered.length} de {items.length}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() => openNewInvoiceModal("sena")}
            className="rounded px-4 py-2 text-sm font-medium text-white"
            style={{ background: "#131945" }}
          >
            + Recibo de seña
          </button>
          <button
            onClick={() => openNewInvoiceModal("final")}
            className="rounded px-4 py-2 text-sm font-medium text-white"
            style={{ background: "#F03172" }}
          >
            + Factura final
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="max-w-full min-w-0 overflow-x-auto rounded border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead
            className="border-b border-neutral-200 text-left text-[11px] font-medium uppercase tracking-widest"
            style={{ background: "#FFFFFF", color: "rgba(19,25,69,0.42)" }}
          >
            <tr>
              <th className="px-4 py-3">Número</th>
              {!initialClientId && <th className="px-4 py-3">Cliente</th>}
              <th className="px-4 py-3 min-w-0">Proyecto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Emisión</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-b border-neutral-100 hover:bg-brand-sky/30 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs font-medium">{row.number}</td>
                {!initialClientId && (
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clientes/${row.client.id}`}
                      className="font-medium hover:underline"
                      style={{ color: "#131945" }}
                    >
                      {row.client.name}
                    </Link>
                    {row.client.company && (
                      <div className="text-xs text-neutral-400 mt-0.5">{row.client.company}</div>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-xs min-w-0 max-w-[220px]">
                  <div className="space-y-1.5 min-w-0">
                    {row.project ? (
                      <Link
                        href={`/admin/proyectos/${row.project.id}`}
                        className="block font-medium leading-snug hover:underline truncate"
                        style={{ color: "#131945" }}
                        title={row.project.title}
                      >
                        {row.project.title}
                      </Link>
                    ) : (
                      <span className="block text-neutral-400 italic">Sin proyecto</span>
                    )}
                    <div className="flex items-center gap-2 min-w-0">
                      <select
                        className="rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] w-full min-w-0 max-w-full"
                        value={row.project?.id ?? ""}
                        disabled={linkingProject === row.id}
                        aria-label={`Proyecto de factura ${row.number}`}
                        onChange={(e) => {
                          void linkProject(row.id, e.target.value || null);
                        }}
                      >
                        <option value="">Sin proyecto</option>
                        {projectsForClient(row.client.id).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      {linkingProject === row.id && (
                        <span className="text-[10px] text-neutral-400 shrink-0">…</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{ background: "rgba(19,25,69,0.08)", color: "#131945" }}
                  >
                    {INVOICE_TYPE_SHORT[row.type] ?? row.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  €{row.total.toLocaleString("es-AR")} EUR
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
                  {formatDate(row.issuedAt)}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
                  {formatDate(row.paidAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 items-start">
                    <a
                      href={`/api/admin/invoices/${row.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium hover:underline"
                      style={{ color: "#323FF6" }}
                    >
                      PDF
                    </a>
                    {renderEmailAction(row)}
                    {row.status === "pendiente" && (
                      <button
                        onClick={() => void markPaid(row.id)}
                        disabled={markingPaid === row.id}
                        className="text-xs font-medium hover:underline disabled:opacity-50"
                        style={{ color: "#1a6b1a" }}
                      >
                        {markingPaid === row.id ? "…" : "Marcar pagada"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            {items.length === 0
              ? "Todavía no hay recibos ni facturas."
              : "No hay documentos con estos filtros."}
          </p>
        )}
      </div>

      {/* ── Modal nueva factura ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(19,25,69,0.2)" }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="w-full max-w-lg rounded bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sticky top-0 bg-white z-10">
              <h2 className="font-serif text-lg italic">{modalTitle}</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xl text-neutral-400 hover:text-neutral-700 leading-none px-1"
              >
                ×
              </button>
            </div>
            <form onSubmit={createInvoice} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {!initialClientId && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <Field label="Cliente" required>
                      <select
                        required
                        className="fv"
                        value={form.clientId}
                        onChange={(e) => setClientId(e.target.value)}
                      >
                        <option value="">Seleccionar cliente…</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.company ? ` — ${c.company}` : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
                <div className="col-span-2 flex flex-col gap-1">
                  <Field
                    label="Proyecto"
                    required={clientProjects.length > 0}
                  >
                    <select
                      className="fv"
                      required={clientProjects.length > 0}
                      value={form.projectId}
                      disabled={!form.clientId}
                      onChange={(e) => setProjectId(e.target.value)}
                    >
                      <option value="">
                        {!form.clientId
                          ? "Elegí un cliente primero…"
                          : clientProjects.length === 0
                            ? "Este cliente no tiene proyectos"
                            : "Seleccionar proyecto…"}
                      </option>
                      {clientProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                          {SERVICE_LABELS[p.service]
                            ? ` — ${SERVICE_LABELS[p.service]}`
                            : ""}
                          {" "}(€{p.value.toLocaleString("es-AR")} EUR)
                        </option>
                      ))}
                    </select>
                  </Field>
                  {form.projectId && (
                    <p className="text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                      Referencia al proyecto en curso. Si el cliente tiene varios contratos, elegí el que corresponde.
                    </p>
                  )}
                </div>
                <Field label="Tipo" required>
                  <select
                    className="fv"
                    value={form.type}
                    onChange={(e) => setInvoiceType(e.target.value as "sena" | "final")}
                  >
                    <option value="sena">Recibo de seña</option>
                    <option value="final">Factura final (saldo)</option>
                  </select>
                </Field>
                <Field label="Total (EUR)" required>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="fv"
                    placeholder={
                      form.type === "sena"
                        ? "Monto acordado con el cliente"
                        : "Saldo pendiente del proyecto"
                    }
                    value={form.total}
                    onChange={(e) => setForm({ ...form, total: e.target.value })}
                  />
                </Field>
                {selectedProject && (
                  <p className="col-span-2 text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                    {form.type === "sena" ? (
                      <>
                        Valor del proyecto: €{selectedProject.value.toLocaleString("es-AR")} EUR —
                        ingresá la seña acordada (no tiene que ser un porcentaje fijo).
                      </>
                    ) : (
                      <>
                        Saldo sugerido: €{" "}
                        {suggestedFinalTotal(
                          selectedProject.value,
                          items.filter((i) => i.project?.id === form.projectId),
                          form.projectId,
                        ).toLocaleString("es-AR")}{" "}
                        EUR (valor del proyecto menos lo ya cobrado).
                      </>
                    )}
                  </p>
                )}
                {!formValidation.ok && (
                  <p className="col-span-2 text-xs text-red-600">{formValidation.error}</p>
                )}
                {formError && (
                  <p className="col-span-2 text-xs text-red-600">{formError}</p>
                )}
                <Field label="Estado">
                  <select
                    className="fv"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagada</option>
                  </select>
                </Field>
                <Field label="Fecha de emisión">
                  <input
                    type="date"
                    className="fv"
                    value={form.issuedAt}
                    onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                  />
                </Field>
                <div className="col-span-2">
                  <Field label="Notas">
                    <textarea
                      className="fv w-full resize-y"
                      rows={2}
                      placeholder="Notas internas sobre este documento…"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t border-neutral-100 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !formValidation.ok}
                  className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "#F03172" }}
                >
                  {saving
                    ? "Generando…"
                    : form.type === "sena"
                      ? "Generar recibo"
                      : "Generar factura final"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
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
        .fv:focus { border-color: rgba(50,63,246,0.5); background: #fff; }
        select.fv { appearance: auto; }
      `}</style>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "rgba(19,25,69,0.42)" }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
