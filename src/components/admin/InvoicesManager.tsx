"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  INVOICE_TYPE_SHORT,
  projectHasFinalInvoice,
  suggestedFinalTotal,
  suggestedRemainingTotal,
  validateInvoiceCreate,
  type InvoiceLike,
} from "@/lib/invoice-utils";
import {
  buildInstallmentPlan,
  type InstallmentIntervalUnit,
} from "@/lib/invoice-installment-plan";
import type { InvoiceReminderKind } from "@/lib/invoice-due-dates";
import {
  buildInvoiceReminderSummary,
} from "@/lib/invoice-reminder-status";

// ── tipos ──────────────────────────────────────────────────
type InvoiceItem = {
  id: string;
  number: string;
  type: string;
  total: number;
  status: string;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  emailSentAt: string | null;
  reminder7dSentAt: string | null;
  reminder1dSentAt: string | null;
  reminderDueSentAt: string | null;
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

const REMINDER_KIND_LABELS: Record<InvoiceReminderKind, string> = {
  "7d": "7 días antes del vencimiento",
  "1d": "1 día antes del vencimiento",
  due: "día del vencimiento",
};

function invoiceSendActionLabel(type: string): string {
  return type === "final" ? "Enviar factura" : "Enviar recibo";
}

function invoiceSentLabel(type: string): string {
  return type === "final" ? "Factura enviada ✓" : "Recibo enviado ✓";
}

function cuotaLabelFromNotes(notes: string): string | null {
  const match = notes.match(/Cuota\s+(\d+)\s*\/\s*(\d+)/i);
  return match ? `Cuota ${match[1]}/${match[2]}` : null;
}

type InvoiceDisplayBlock =
  | {
      kind: "group";
      key: string;
      project: { id: string; title: string } | null;
      client: InvoiceItem["client"];
      rows: InvoiceItem[];
    }
  | { kind: "single"; row: InvoiceItem };

function buildInvoiceDisplayBlocks(items: InvoiceItem[]): InvoiceDisplayBlock[] {
  const byKey = new Map<string, InvoiceItem[]>();
  for (const row of items) {
    const key = row.project?.id ?? `__none__:${row.client.id}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(row);
  }

  const seen = new Set<string>();
  const blocks: InvoiceDisplayBlock[] = [];
  for (const row of items) {
    const key = row.project?.id ?? `__none__:${row.client.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const rows = [...(byKey.get(key) ?? [])].sort((a, b) => a.number.localeCompare(b.number));
    if (rows.length >= 2) {
      blocks.push({
        kind: "group",
        key,
        project: row.project,
        client: row.client,
        rows,
      });
    } else {
      blocks.push({ kind: "single", row: rows[0] });
    }
  }
  return blocks;
}

function renderReminderStatus(row: InvoiceItem) {
  const summary = buildInvoiceReminderSummary(row);
  const detail =
    summary.steps.length > 0
      ? summary.steps.map((step) => step.detail).join("\n")
      : summary.headline;
  const todayStep = summary.steps.find((step) => step.state === "today");
  return (
    <span className="text-[10px] leading-snug text-neutral-600 block max-w-[132px]" title={detail}>
      {todayStep && (
        <span
          className="mr-1 inline-block rounded px-1 py-px font-medium text-amber-900"
          style={{ background: "rgba(255,160,0,0.2)" }}
        >
          Hoy
        </span>
      )}
      <span className="line-clamp-2">{summary.headline}</span>
    </span>
  );
}

function projectInvoicesAsLike(items: InvoiceItem[], projectId: string): InvoiceLike[] {
  return items
    .filter((i) => i.project?.id === projectId)
    .map((i) => ({
      id: i.id,
      type: i.type,
      status: i.status,
      total: i.total,
      projectId,
    }));
}

function defaultInvoiceType(
  projectId: string,
  invoices: InvoiceItem[],
  project?: ProjectOption,
  preferredType?: "sena" | "final",
): "sena" | "final" {
  if (preferredType === "final") {
    if (!projectId || projectHasFinalInvoice(projectInvoicesAsLike(invoices, projectId), projectId)) {
      return "sena";
    }
    return "final";
  }
  if (preferredType === "sena") return "sena";
  return "sena";
}

function defaultInvoiceTotal(
  project: ProjectOption | undefined,
  type: string,
  projectId: string,
  invoices: InvoiceItem[],
): string {
  if (!project || !projectId) return "";
  const projectInvoices = projectInvoicesAsLike(invoices, projectId);
  if (type === "final") {
    const remaining = suggestedFinalTotal(project.value, projectInvoices, projectId);
    return remaining > 0 ? String(remaining) : "";
  }
  return "";
}

function formatDateInput(d: string | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function defaultDueAtFromIssued(issuedAt: string): string {
  const base = new Date(`${issuedAt}T12:00:00`);
  base.setDate(base.getDate() + 14);
  return base.toISOString().slice(0, 10);
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
  dueAt: defaultDueAtFromIssued(new Date().toISOString().slice(0, 10)),
};

const EMPTY_PLAN_FORM = {
  count: 3,
  intervalValue: 1,
  intervalUnit: "months" as InstallmentIntervalUnit,
  firstDueDate: defaultDueAtFromIssued(new Date().toISOString().slice(0, 10)),
  totalAmount: "",
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
  const [updatingDueAt, setUpdatingDueAt] = useState<string | null>(null);
  const [runningReminders, setRunningReminders] = useState(false);
  const autoOpenedRef = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    clientId: initialClientId ?? "",
    projectId: initialProjectId ?? "",
  });
  const [senaMode, setSenaMode] = useState<"single" | "plan">("single");
  const [planForm, setPlanForm] = useState({ ...EMPTY_PLAN_FORM });

  const clientProjects = useMemo(
    () => projects.filter((p) => p.clientId === form.clientId),
    [projects, form.clientId],
  );

  function projectsForClient(clientId: string) {
    return projects.filter((p) => p.clientId === clientId);
  }

  function planTotalForProject(projectId: string, project?: ProjectOption) {
    if (!projectId || !project) return "";
    const remaining = suggestedRemainingTotal(
      project.value,
      projectInvoicesAsLike(items, projectId),
      projectId,
    );
    return remaining > 0 ? String(remaining) : "";
  }

  function openNewInvoiceModal(preferredType?: "sena" | "final") {
    const clientId = initialClientId ?? "";
    const clientProjs = projectsForClient(clientId);
    const projectId =
      initialProjectId ??
      (clientProjs.length === 1 ? clientProjs[0].id : "");
    const project = clientProjs.find((p) => p.id === projectId);
    const type = defaultInvoiceType(projectId, items, project, preferredType);
    setFormError(null);
    if (
      preferredType === "final" &&
      projectId &&
      projectHasFinalInvoice(projectInvoicesAsLike(items, projectId), projectId)
    ) {
      setFormError("Este proyecto ya tiene una factura final.");
    }
    setForm({
      ...EMPTY_FORM,
      clientId,
      projectId,
      type,
      total: defaultInvoiceTotal(project, type, projectId, items),
    });
    setSenaMode("single");
    setPlanForm({
      ...EMPTY_PLAN_FORM,
      firstDueDate: defaultDueAtFromIssued(EMPTY_FORM.issuedAt),
      totalAmount: planTotalForProject(projectId, project),
    });
    setModalOpen(true);
  }

  function setClientId(clientId: string) {
    const clientProjs = projectsForClient(clientId);
    const projectId = clientProjs.length === 1 ? clientProjs[0].id : "";
    const project = clientProjs.find((p) => p.id === projectId);
    const type = defaultInvoiceType(projectId, items, project);
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
    let type = defaultInvoiceType(projectId, items, project);
    if (
      type === "final" &&
      projectId &&
      projectHasFinalInvoice(projectInvoicesAsLike(items, projectId), projectId)
    ) {
      type = "sena";
    }
    setFormError(null);
    setForm((f) => ({
      ...f,
      projectId,
      type,
      total: defaultInvoiceTotal(project, type, projectId, items),
    }));
    setPlanForm((p) => ({
      ...p,
      totalAmount: planTotalForProject(projectId, project),
      firstDueDate: defaultDueAtFromIssued(form.issuedAt),
    }));
  }

  function setInvoiceType(type: "sena" | "final") {
    if (
      type === "final" &&
      form.projectId &&
      projectHasFinalInvoice(projectInvoicesAsLike(items, form.projectId), form.projectId)
    ) {
      setFormError("Este proyecto ya tiene una factura final.");
      return;
    }
    const project = clientProjects.find((p) => p.id === form.projectId);
    setFormError(null);
    if (type === "final") setSenaMode("single");
    setForm((f) => ({
      ...f,
      type,
      total: defaultInvoiceTotal(project, type, f.projectId, items),
    }));
  }

  const formValidation = useMemo(() => {
    if (!form.projectId) return { ok: true as const };
    const project = clientProjects.find((p) => p.id === form.projectId);
    const projectInvoices = projectInvoicesAsLike(items, form.projectId);
    const newTotal = Number(form.total);
    return validateInvoiceCreate(
      form.type as "sena" | "final",
      form.projectId,
      project?.value,
      projectInvoices,
      {
        newTotal: Number.isFinite(newTotal) && newTotal > 0 ? newTotal : 0,
        newStatus: form.status as "pendiente" | "pagado",
      },
    );
  }, [form.projectId, form.type, form.total, form.status, clientProjects, items]);

  const planPreview = useMemo(() => {
    if (form.type !== "sena" || senaMode !== "plan") return [];
    const total = Number(planForm.totalAmount || form.total);
    if (!Number.isFinite(total) || total <= 0 || !planForm.firstDueDate) return [];
    return buildInstallmentPlan({
      count: planForm.count,
      totalAmount: total,
      firstDueDate: planForm.firstDueDate,
      intervalValue: planForm.intervalValue,
      intervalUnit: planForm.intervalUnit,
      issuedAt: form.issuedAt,
    });
  }, [form.type, form.total, form.issuedAt, senaMode, planForm]);

  const planValidation = useMemo(() => {
    if (form.type !== "sena" || senaMode !== "plan" || !form.projectId) {
      return { ok: true as const };
    }
    const project = clientProjects.find((p) => p.id === form.projectId);
    const total = Number(planForm.totalAmount || form.total);
    if (!Number.isFinite(total) || total <= 0) {
      return { ok: false as const, error: "Ingresá el monto total a repartir en cuotas." };
    }
    if (planForm.count < 1 || planForm.count > 24) {
      return { ok: false as const, error: "La cantidad de cuotas debe ser entre 1 y 24." };
    }
    if (planForm.intervalValue < 1) {
      return { ok: false as const, error: "El intervalo debe ser al menos 1." };
    }
    return validateInvoiceCreate(
      "sena",
      form.projectId,
      project?.value,
      projectInvoicesAsLike(items, form.projectId),
      {
        newTotal: total,
        newStatus: form.status as "pendiente" | "pagado",
      },
    );
  }, [form.type, form.projectId, form.total, form.status, senaMode, planForm, clientProjects, items]);

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

  const displayBlocks = useMemo(
    () => buildInvoiceDisplayBlocks(filtered),
    [filtered],
  );

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    const isPlan = form.type === "sena" && senaMode === "plan";

    if (isPlan) {
      if (!planValidation.ok) {
        setFormError(planValidation.error);
        return;
      }
      if (planPreview.length === 0) {
        setFormError("Revisá el monto total y las fechas del plan.");
        return;
      }
      setSaving(true);
      setFormError(null);
      let created = 0;
      const errors: string[] = [];
      for (const line of planPreview) {
        const res = await fetch("/api/admin/invoices", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: form.clientId,
            projectId: form.projectId || undefined,
            type: "sena",
            total: line.total,
            status: form.status,
            notes: form.notes
              ? `${form.notes} · Cuota ${line.index}/${planPreview.length}`
              : `Cuota ${line.index}/${planPreview.length}`,
            issuedAt: line.issuedAt,
            dueAt: line.dueAt,
          }),
        });
        if (res.ok) {
          created += 1;
        } else {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          errors.push(`Cuota ${line.index}: ${j?.error ?? "no se creó"}`);
        }
      }
      setSaving(false);
      if (created > 0) {
        setModalOpen(false);
        setSenaMode("single");
        setPlanForm({ ...EMPTY_PLAN_FORM });
        setForm({
          ...EMPTY_FORM,
          clientId: initialClientId ?? "",
          projectId: initialProjectId ?? "",
        });
        await load();
      }
      if (errors.length > 0) {
        setFormError(
          created > 0
            ? `${created} recibo(s) creado(s). Fallaron: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "…" : ""}`
            : errors.slice(0, 3).join("; "),
        );
      }
      return;
    }

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

  async function updateDueAt(id: string, dueAt: string) {
    setUpdatingDueAt(id);
    await fetch(`/api/admin/invoices/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueAt: dueAt || null }),
    });
    setUpdatingDueAt(null);
    await load();
  }

  async function runDueReminders(dryRun: boolean) {
    setRunningReminders(true);
    const res = await fetch("/api/admin/invoices/due-reminders/run", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun }),
    });
    setRunningReminders(false);
    const j = (await res.json().catch(() => null)) as {
      sent?: Array<{ number: string; kind: string }>;
      skipped?: Array<{ number: string; reason: string }>;
      scanned?: number;
      error?: string;
    } | null;
    if (!res.ok) {
      window.alert(j?.error ?? "No se pudieron procesar los recordatorios.");
      return;
    }
    const sent = j?.sent?.length ?? 0;
    const label = dryRun ? "Simulación" : "Envío real";
    const detail =
      j?.sent && j.sent.length > 0
        ? "\n\n" +
          j.sent
            .map(
              (item) =>
                `• ${item.number}: ${REMINDER_KIND_LABELS[item.kind as InvoiceReminderKind] ?? item.kind}`,
            )
            .join("\n")
        : "\n\nNingún recordatorio coincide con hoy. Para probar los 3 tipos, usá facturas pendientes con vencimiento en +7 días, mañana y hoy.";
    window.alert(
      `${label}: ${sent} recordatorio(s)${dryRun ? " listos para enviar" : " enviados al cliente"}.\n` +
        `Facturas pendientes revisadas: ${j?.scanned ?? 0}.` +
        detail,
    );
    if (!dryRun) await load();
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
        <span className="text-xs font-medium whitespace-nowrap" style={{ color: "rgba(19,25,69,0.45)" }}>
          Enviando…
        </span>
      );
    }
    if (status === "sent" || row.emailSentAt) {
      return (
        <span
          className="text-xs font-medium whitespace-nowrap"
          style={{ color: "#1a6b1a" }}
          title={
            row.emailSentAt
              ? `${invoiceSentLabel(row.type)} · ${formatDate(row.emailSentAt)}`
              : invoiceSentLabel(row.type)
          }
        >
          {invoiceSentLabel(row.type)}
        </span>
      );
    }
    if (status === "failed") {
      return (
        <button
          type="button"
          onClick={() => void sendByEmail(row.id)}
          className="text-xs font-medium hover:underline text-left whitespace-nowrap"
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
        className="text-xs font-medium hover:underline text-left whitespace-nowrap"
        style={{ color: "#F03172" }}
        title="Envía el PDF de este documento al cliente. Los recordatorios de vencimiento (7 días, 1 día y el día del vencimiento) son automáticos y van aparte."
      >
        {invoiceSendActionLabel(row.type)}
      </button>
    );
  }

  const totalPendiente = filtered
    .filter((i) => i.status === "pendiente")
    .reduce((acc, i) => acc + i.total, 0);

  if (loading)
    return <p className="py-12 text-center text-sm text-neutral-500">Cargando documentos…</p>;

  const selectedProject = clientProjects.find((p) => p.id === form.projectId);
  const selectedProjectInvoices = form.projectId
    ? projectInvoicesAsLike(items, form.projectId)
    : [];
  const selectedProjectHasFinal = form.projectId
    ? projectHasFinalInvoice(selectedProjectInvoices, form.projectId)
    : false;
  const initialProjectHasFinal = initialProjectId
    ? projectHasFinalInvoice(projectInvoicesAsLike(items, initialProjectId), initialProjectId)
    : false;
  const modalTitle =
    form.type === "sena"
      ? senaMode === "plan"
        ? "Plan de recibos de seña"
        : "Nuevo recibo de seña"
      : "Nueva factura final";
  const modalValidation =
    form.type === "sena" && senaMode === "plan" ? planValidation : formValidation;

  const tableColCount = initialClientId ? 9 : 10;

  function renderInvoiceRow(row: InvoiceItem, grouped = false) {
    const cuota = cuotaLabelFromNotes(row.notes);
    return (
      <tr
        key={row.id}
        className={`border-b border-neutral-100 hover:bg-brand-sky/30 transition-colors ${grouped ? "bg-white" : ""}`}
      >
        <td className="px-2 py-2 font-mono text-xs whitespace-nowrap align-top">
          {cuota && (
            <div className="text-[10px] font-medium mb-0.5" style={{ color: "rgba(19,25,69,0.45)" }}>
              {cuota}
            </div>
          )}
          <span className="font-medium">{row.number}</span>
        </td>
        {!initialClientId && (
          <td className="px-2 py-2 max-w-[140px] align-top">
            {grouped ? (
              <span className="text-neutral-300">·</span>
            ) : (
              <>
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
              </>
            )}
          </td>
        )}
        <td className="px-2 py-2 text-xs min-w-0 max-w-[160px] align-top">
          {grouped ? (
            <span className="text-neutral-300">·</span>
          ) : (
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
          )}
        </td>
        <td className="px-2 py-2 whitespace-nowrap align-top">
          {grouped ? (
            <span className="text-neutral-300">·</span>
          ) : (
            <span
              className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              style={{ background: "rgba(19,25,69,0.08)", color: "#131945" }}
            >
              {INVOICE_TYPE_SHORT[row.type] ?? row.type}
            </span>
          )}
        </td>
        <td className="px-2 py-2 font-medium whitespace-nowrap align-top">
          €{row.total.toLocaleString("es-AR")}
        </td>
        <td className="px-2 py-2 whitespace-nowrap align-top">
          <StatusPill status={row.status} />
          {row.status === "pagado" && row.paidAt && (
            <div className="mt-1 text-[10px] text-neutral-400">Pagada {formatDate(row.paidAt)}</div>
          )}
        </td>
        <td className="px-2 py-2 text-xs text-neutral-400 whitespace-nowrap align-top">
          {grouped ? <span className="text-neutral-300">·</span> : formatDate(row.issuedAt)}
        </td>
        <td className="px-2 py-2 text-xs whitespace-nowrap align-top">
          {row.status === "pendiente" ? (
            <input
              type="date"
              className="rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] min-w-[118px]"
              value={formatDateInput(row.dueAt)}
              disabled={updatingDueAt === row.id}
              aria-label={`Vencimiento de ${row.number}`}
              onChange={(e) => void updateDueAt(row.id, e.target.value)}
            />
          ) : (
            <span className="text-neutral-400">{formatDate(row.dueAt)}</span>
          )}
        </td>
        <td className="px-2 py-2 align-top">{renderReminderStatus(row)}</td>
        <td
          className="sticky right-0 z-10 px-2 py-2 align-top whitespace-nowrap shadow-[-8px_0_12px_-8px_rgba(19,25,69,0.12)]"
          style={{ background: grouped ? "#FFFFFF" : "#FFFFFF" }}
        >
          <div className="flex flex-col gap-1 items-start min-w-[6.75rem]">
            <a
              href={`/api/admin/invoices/${row.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium hover:underline whitespace-nowrap"
              style={{ color: "#323FF6" }}
            >
              PDF
            </a>
            {renderEmailAction(row)}
            {row.status === "pendiente" && (
              <button
                type="button"
                onClick={() => void markPaid(row.id)}
                disabled={markingPaid === row.id}
                className="text-xs font-medium hover:underline disabled:opacity-50 whitespace-nowrap text-left"
                style={{ color: "#1a6b1a" }}
              >
                {markingPaid === row.id ? "…" : "Marcar pagada"}
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  function renderGroupHeader(block: Extract<InvoiceDisplayBlock, { kind: "group" }>) {
    const pending = block.rows
      .filter((r) => r.status === "pendiente")
      .reduce((acc, r) => acc + r.total, 0);
    const issuedKey = formatDateInput(block.rows[0]?.issuedAt ?? null);
    const allSameIssue = block.rows.every(
      (r) => formatDateInput(r.issuedAt) === issuedKey,
    );
    return (
      <tr key={`group-${block.key}`} style={{ background: "rgba(19,25,69,0.04)" }}>
        <td colSpan={tableColCount} className="px-2 py-2 border-b border-neutral-200">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {block.project ? (
              <Link
                href={`/admin/proyectos/${block.project.id}`}
                className="font-semibold hover:underline"
                style={{ color: "#131945" }}
              >
                {block.project.title}
              </Link>
            ) : (
              <span className="italic text-neutral-400">Sin proyecto</span>
            )}
            {!initialClientId && (
              <span className="text-neutral-500">{block.client.name}</span>
            )}
            <span className="text-neutral-500">
              {block.rows.length} documentos · {INVOICE_TYPE_SHORT[block.rows[0]?.type] ?? ""}
            </span>
            {pending > 0 && (
              <span className="font-medium" style={{ color: "#b45000" }}>
                €{pending.toLocaleString("es-AR")} pendiente
              </span>
            )}
            {allSameIssue && issuedKey && (
              <span className="text-neutral-400">emitidos {formatDate(block.rows[0].issuedAt)}</span>
            )}
          </div>
        </td>
      </tr>
    );
  }

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
        <button
          type="button"
          disabled={runningReminders}
          onClick={() => void runDueReminders(true)}
          className="rounded border border-neutral-200 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          title="Lista qué recordatorios se enviarían hoy, sin mandar mails"
        >
          {runningReminders ? "…" : "Revisar envíos de hoy"}
        </button>
        <button
          type="button"
          disabled={runningReminders}
          onClick={() => {
            if (
              !window.confirm(
                "¿Enviar ahora los recordatorios de vencimiento que correspondan hoy? (7 días antes, 1 día antes o día del vencimiento). No reenvía el PDF del recibo.",
              )
            ) {
              return;
            }
            void runDueReminders(false);
          }}
          className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          title="Envía mails reales de recordatorio al cliente (pruebas en preview)"
        >
          {runningReminders ? "…" : "Enviar recordatorios ahora"}
        </button>
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
            disabled={initialProjectHasFinal}
            title={
              initialProjectHasFinal
                ? "Este proyecto ya tiene una factura final"
                : undefined
            }
            className="rounded px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
            style={{ background: "#F03172" }}
          >
            + Factura final
          </button>
        </div>
      </div>

      <p
        className="rounded border px-3 py-2 text-[11px] leading-relaxed"
        style={{ borderColor: "rgba(19,25,69,0.1)", color: "rgba(19,25,69,0.55)", background: "#fff" }}
      >
        <strong>Enviar recibo</strong> manda el PDF al cliente. Los documentos del mismo proyecto se{" "}
        <strong>agrupan</strong>. En <strong>Recordatorios</strong>, pasá el mouse para ver el detalle
        de los 3 avisos automáticos.
      </p>

      {/* ── Tabla ── */}
      <div className="max-w-full min-w-0 -mx-1 overflow-x-auto rounded border border-neutral-200 bg-white">
        <table className="w-full min-w-[920px] text-sm">
          <thead
            className="border-b border-neutral-200 text-left text-[11px] font-medium uppercase tracking-widest"
            style={{ background: "#FFFFFF", color: "rgba(19,25,69,0.42)" }}
          >
            <tr>
              <th className="px-2 py-3 whitespace-nowrap">Número</th>
              {!initialClientId && <th className="px-2 py-3 whitespace-nowrap">Cliente</th>}
              <th className="px-2 py-3 min-w-0">Proyecto</th>
              <th className="px-2 py-3 whitespace-nowrap">Tipo</th>
              <th className="px-2 py-3 whitespace-nowrap">Total</th>
              <th className="px-2 py-3 whitespace-nowrap">Estado</th>
              <th className="px-2 py-3 whitespace-nowrap">Emisión</th>
              <th className="px-2 py-3 whitespace-nowrap">Vencimiento</th>
              <th className="px-2 py-3 whitespace-nowrap">Recordatorios</th>
              <th
                className="sticky right-0 z-10 px-2 py-3 whitespace-nowrap text-left shadow-[-8px_0_12px_-8px_rgba(19,25,69,0.12)]"
                style={{ background: "#FFFFFF" }}
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {displayBlocks.map((block) => {
              if (block.kind === "single") {
                return renderInvoiceRow(block.row);
              }
              return (
                <Fragment key={block.key}>
                  {renderGroupHeader(block)}
                  {block.rows.map((row) => renderInvoiceRow(row, true))}
                </Fragment>
              );
            })}
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
                    <option
                      value="final"
                      disabled={selectedProjectHasFinal}
                    >
                      Factura final (saldo)
                      {selectedProjectHasFinal ? " — ya emitida" : ""}
                    </option>
                  </select>
                </Field>
                {form.type === "sena" && (
                  <div className="col-span-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSenaMode("single")}
                      className="flex-1 rounded border px-3 py-2 text-xs font-medium transition-colors"
                      style={{
                        borderColor: senaMode === "single" ? "#323FF6" : "rgba(19,25,69,0.15)",
                        background: senaMode === "single" ? "rgba(50,63,246,0.08)" : "#fff",
                        color: senaMode === "single" ? "#323FF6" : "rgba(19,25,69,0.55)",
                      }}
                    >
                      Un recibo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSenaMode("plan");
                        setPlanForm((p) => ({
                          ...p,
                          firstDueDate: form.dueAt || defaultDueAtFromIssued(form.issuedAt),
                          totalAmount:
                            p.totalAmount ||
                            planTotalForProject(form.projectId, selectedProject) ||
                            form.total,
                        }));
                      }}
                      className="flex-1 rounded border px-3 py-2 text-xs font-medium transition-colors"
                      style={{
                        borderColor: senaMode === "plan" ? "#323FF6" : "rgba(19,25,69,0.15)",
                        background: senaMode === "plan" ? "rgba(50,63,246,0.08)" : "#fff",
                        color: senaMode === "plan" ? "#323FF6" : "rgba(19,25,69,0.55)",
                      }}
                    >
                      Plan de cuotas
                    </button>
                  </div>
                )}
                {(form.type !== "sena" || senaMode === "single") && (
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
                )}
                {form.type === "sena" && senaMode === "plan" && (
                  <>
                    <Field label="Monto total a repartir (EUR)" required>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        className="fv"
                        placeholder="Ej. saldo del proyecto"
                        value={planForm.totalAmount}
                        onChange={(e) =>
                          setPlanForm((p) => ({ ...p, totalAmount: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Cantidad de cuotas" required>
                      <input
                        required
                        type="number"
                        min="1"
                        max="24"
                        step="1"
                        className="fv"
                        value={planForm.count}
                        onChange={(e) =>
                          setPlanForm((p) => ({
                            ...p,
                            count: Math.max(1, Math.min(24, Number(e.target.value) || 1)),
                          }))
                        }
                      />
                    </Field>
                    <Field label="Cada">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="fv flex-1"
                          value={planForm.intervalValue}
                          onChange={(e) =>
                            setPlanForm((p) => ({
                              ...p,
                              intervalValue: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                        />
                        <select
                          className="fv flex-1"
                          value={planForm.intervalUnit}
                          onChange={(e) =>
                            setPlanForm((p) => ({
                              ...p,
                              intervalUnit: e.target.value as InstallmentIntervalUnit,
                            }))
                          }
                        >
                          <option value="days">días</option>
                          <option value="months">meses</option>
                        </select>
                      </div>
                    </Field>
                    <Field label="Primer vencimiento" required>
                      <input
                        required
                        type="date"
                        className="fv"
                        value={planForm.firstDueDate}
                        onChange={(e) =>
                          setPlanForm((p) => ({ ...p, firstDueDate: e.target.value }))
                        }
                      />
                    </Field>
                    {planPreview.length > 0 && (
                      <div className="col-span-2 rounded border border-neutral-100 overflow-hidden">
                        <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest bg-neutral-50 text-neutral-500">
                          Vista previa — {planPreview.length} recibos
                        </p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-neutral-400 border-b border-neutral-100">
                              <th className="px-3 py-1.5 font-medium">#</th>
                              <th className="px-3 py-1.5 font-medium">Monto</th>
                              <th className="px-3 py-1.5 font-medium">Vence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {planPreview.map((line) => (
                              <tr key={line.index} className="border-b border-neutral-50 last:border-0">
                                <td className="px-3 py-1.5">{line.index}</td>
                                <td className="px-3 py-1.5 font-medium">
                                  €{line.total.toLocaleString("es-AR")} EUR
                                </td>
                                <td className="px-3 py-1.5 text-neutral-500">
                                  {formatDate(line.dueAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
                {selectedProject && (
                  <p className="col-span-2 text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                    {form.type === "sena" ? (
                      <>
                        Valor del proyecto: €{selectedProject.value.toLocaleString("es-AR")} EUR —
                        podés emitir varios recibos de seña. Saldo sin documentar: €{" "}
                        {suggestedRemainingTotal(
                          selectedProject.value,
                          selectedProjectInvoices,
                          form.projectId,
                        ).toLocaleString("es-AR")}{" "}
                        EUR.
                      </>
                    ) : (
                      <>
                        Saldo sugerido: €{" "}
                        {suggestedFinalTotal(
                          selectedProject.value,
                          selectedProjectInvoices,
                          form.projectId,
                        ).toLocaleString("es-AR")}{" "}
                        EUR (valor del proyecto menos lo ya cobrado). Solo una factura final por
                        proyecto.
                      </>
                    )}
                  </p>
                )}
                {!modalValidation.ok && (
                  <p className="col-span-2 text-xs text-red-600">{modalValidation.error}</p>
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
                    onChange={(e) =>
                      setForm({
                        ...form,
                        issuedAt: e.target.value,
                        dueAt: form.dueAt || defaultDueAtFromIssued(e.target.value),
                      })
                    }
                  />
                </Field>
                {!(form.type === "sena" && senaMode === "plan") && (
                  <Field label="Fecha de vencimiento">
                    <input
                      type="date"
                      className="fv"
                      value={form.dueAt}
                      onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                    />
                    <p className="mt-1 text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                      Recordatorios automáticos al cliente: 7 días antes, 1 día antes y el día de
                      vencimiento (solo si está pendiente).
                    </p>
                  </Field>
                )}
                {form.type === "sena" && senaMode === "plan" && (
                  <p className="col-span-2 text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                    Cada cuota tendrá su propio vencimiento. Los recordatorios se envían por cuota
                    pendiente.
                  </p>
                )}
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
                  disabled={saving || !modalValidation.ok}
                  className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "#F03172" }}
                >
                  {saving
                    ? "Generando…"
                    : form.type === "sena" && senaMode === "plan"
                      ? planPreview.length > 0
                        ? `Generar ${planPreview.length} recibos`
                        : "Generar recibos"
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
