"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyPhaseMount } from "@/components/admin/LazyPhaseMount";
import { PhaseDocumentEditor } from "@/components/admin/PhaseDocumentEditor";
import { PhaseClientSendBar } from "@/components/admin/PhaseClientSendBar";
import { BrandKitPanel } from "@/components/admin/BrandKitPanel";
import { ManualPdfPanel } from "@/components/admin/ManualPdfPanel";
import { getManualPdfFromPhase } from "@/lib/manual-pdf";
import { PhaseNotesEmailBar } from "@/components/admin/PhaseNotesEmailBar";
import { ProjectFlowBar } from "@/components/admin/ProjectFlowBar";
import { getPhaseClientMeta } from "@/lib/phase-client-store";
import type { HtmlPhaseKey } from "@/lib/phase-client-flow";
import {
  PHASE_DOCUMENT_HINTS,
  PHASE_DOCUMENT_TITLES,
  type PhaseDocumentKey,
} from "@/lib/phase-document-templates";
import {
  deriveProjectStatus,
  PROJECT_STATUS_LABELS,
  type ProjectPipelineSignals,
} from "@/lib/project-pipeline";

const PanelLoading = ({ label }: { label: string }) => (
  <p className="text-xs py-4 text-center" style={{ color: "rgba(19,25,69,0.42)" }}>
    Cargando {label}…
  </p>
);

const ContractEditor = dynamic(
  () => import("@/components/admin/ContractEditor").then((m) => ({ default: m.ContractEditor })),
  { loading: () => <PanelLoading label="contrato" /> },
);

const PrebriefPanel = dynamic(
  () => import("@/components/admin/PrebriefPanel").then((m) => ({ default: m.PrebriefPanel })),
  { loading: () => <PanelLoading label="pre-brief" /> },
);

const NarrativaPanel = dynamic(
  () => import("@/components/admin/NarrativaPanel").then((m) => ({ default: m.NarrativaPanel })),
  { loading: () => <PanelLoading label="narrativa" /> },
);

// ── tipos ──────────────────────────────────────────────────
type InvoiceSummary = {
  id: string; number: string; type: string; total: number; status: string; issuedAt: string;
};

type ClientProject = {
  id: string; title: string; service: string; value: number; status: string;
  contractStatus: string;
  prebriefSubmittedAt: string | null;
  narrativaStatus: string;
  narrativaAcknowledgedAt: string | null;
  phases: Record<string, Record<string, string>>;
  startDate: string | null; deliveryDate: string | null; notes: string;
  client: { id: string; name: string; company: string; email: string };
  invoices: InvoiceSummary[];
};

type PhaseSyncProgress = {
  contractStatus: string;
  prebriefSubmittedAt: string | Date | null;
  narrativaStatus: string;
  narrativaAcknowledgedAt: string | Date | null;
  status?: string;
};

type PhaseContent = {
  state: string;
  startDate: string;
  endDate: string;
  body: string;
  bodyFormat: string;
  brandKit: string;
  manualPdfUrl: string;
  manualPdfFileName: string;
  manualPdfMime: string;
  owner: string;
  clientStatus: string;
  clientSentAt: string;
  clientReceivedAt: string;
};

// ── fases del proyecto ─────────────────────────────────────
const PHASES = [
  {
    key: "onboarding", title: "1) Onboarding",
    desc: "Primer contacto, alineación inicial y recopilación de contexto del proyecto.",
    cover: "/admin/project-phases/onboarding.jpg",
    fallback: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop",
  },
  {
    key: "prebrief", title: "2) Pre-brief",
    desc: "Base estratégica previa al brief formal con información esencial del negocio.",
    cover: "/admin/project-phases/pre-brief.jpg",
    fallback: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
  },
  {
    key: "narrativa", title: "3) Narrativa de marca",
    desc: "Narrativa, posicionamiento, conceptos clave y dirección estratégica.",
    cover: "/admin/project-phases/estrategia-de-marca.jpg",
    fallback: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=800&auto=format&fit=crop",
  },
  {
    key: "identidad", title: "4) Identidad Visual",
    desc: "Construcción del sistema visual, recursos gráficos y lineamientos de aplicación.",
    cover: "/admin/project-phases/identidad-visual.jpg",
    fallback: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
  },
  {
    key: "manual", title: "5) Manual de marca",
    desc: "Documento madre para ordenar el sistema, sus reglas y sus usos recomendados.",
    cover: "/admin/project-phases/manualde-marca.jpg",
    fallback: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop",
  },
];

const STATE_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "active", label: "En proceso" },
  { value: "done", label: "Completada" },
];

const STATE_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(19,25,69,0.06)", color: "rgba(19,25,69,0.4)" },
  active: { bg: "rgba(240,49,114,0.1)", color: "#F03172" },
  done: { bg: "#e3f2e3", color: "#1a6b1a" },
};

const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

const PROJECT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  onboarding: { bg: "rgba(50,63,246,0.08)", color: "#323FF6" },
  diseno: { bg: "rgba(240,49,114,0.1)", color: "#F03172" },
  implementacion: { bg: "rgba(255,160,0,0.12)", color: "#b45000" },
  entregado: { bg: "#e3f2e3", color: "#1a6b1a" },
};

function emptyPhaseContent(): PhaseContent {
  return {
    state: "pending",
    startDate: "",
    endDate: "",
    body: "",
    bodyFormat: "",
    brandKit: "",
    manualPdfUrl: "",
    manualPdfFileName: "",
    manualPdfMime: "",
    owner: "",
    clientStatus: "",
    clientSentAt: "",
    clientReceivedAt: "",
  };
}

function parsePhases(raw: Record<string, Record<string, string>>): Record<string, PhaseContent> {
  const result: Record<string, PhaseContent> = {};
  for (const ph of PHASES) {
    const saved = raw[ph.key] ?? {};
    result[ph.key] = {
      state: saved.state ?? "pending",
      startDate: saved.startDate ?? "",
      endDate: saved.endDate ?? "",
      body: saved.body ?? "",
      bodyFormat: saved.bodyFormat ?? "",
      brandKit: saved.brandKit ?? "",
      manualPdfUrl: saved.manualPdfUrl ?? "",
      manualPdfFileName: saved.manualPdfFileName ?? "",
      manualPdfMime: saved.manualPdfMime ?? "",
      owner: saved.owner ?? "",
      clientStatus: saved.clientStatus ?? "",
      clientSentAt: saved.clientSentAt ?? "",
      clientReceivedAt: saved.clientReceivedAt ?? "",
    };
  }
  return result;
}

function formatPhaseDateLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function formatPhaseDateRange(startDate: string, endDate: string): string | null {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start && !end) return null;
  if (start && end) return `${formatPhaseDateLabel(start)} — ${formatPhaseDateLabel(end)}`;
  if (start) return `Desde ${formatPhaseDateLabel(start)}`;
  return `Hasta ${formatPhaseDateLabel(end)}`;
}

function phaseCover(ph: typeof PHASES[0]) {
  return `url("${ph.cover}"), url("${ph.fallback}")`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { dateStyle: "medium" });
}

const DELETE_CONFIRM_PHRASE = "ELIMINAR";

// ── componente principal ───────────────────────────────────
export function ERPProjectWorkspace({ project: initial }: { project: ClientProject }) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [phases, setPhases] = useState<Record<string, PhaseContent>>(() =>
    parsePhases(initial.phases ?? {})
  );
  const [savingPhase, setSavingPhase] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAck, setDeleteAck] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [syncingPhases, setSyncingPhases] = useState(false);

  const refreshPhaseStates = useCallback(async () => {
    setSyncingPhases(true);
    try {
      const res = await fetch(`/api/admin/projects-erp/${project.id}/phases/sync`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return;
      const j = (await res.json()) as {
        phases: Record<string, Record<string, string>>;
        progress?: PhaseSyncProgress | null;
      };
      if (j.phases) {
        setPhases(parsePhases(j.phases));
      }
      if (j.progress) {
        setProject((p) => ({
          ...p,
          contractStatus: j.progress!.contractStatus,
          prebriefSubmittedAt: j.progress!.prebriefSubmittedAt
            ? String(j.progress!.prebriefSubmittedAt)
            : null,
          narrativaStatus: j.progress!.narrativaStatus,
          narrativaAcknowledgedAt: j.progress!.narrativaAcknowledgedAt
            ? String(j.progress!.narrativaAcknowledgedAt)
            : null,
          ...(j.progress!.status ? { status: j.progress!.status } : {}),
        }));
      }
    } finally {
      setSyncingPhases(false);
    }
  }, [project.id]);

  useEffect(() => {
    void refreshPhaseStates();
  }, [refreshPhaseStates]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      void refreshPhaseStates();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshPhaseStates]);

  const savePhaseContent = useCallback(
    async (key: string, data: Partial<PhaseContent>): Promise<boolean> => {
      setSavingPhase(key);
      const { state: _state, ...content } = data;
      const res = await fetch(`/api/admin/projects-erp/${project.id}/phases`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: key, content }),
      });
      if (res.ok) {
        const j = (await res.json()) as { phases?: Record<string, Record<string, string>> };
        if (j.phases) {
          setPhases(parsePhases(j.phases));
        }
      }
      setSavingPhase(null);
      return res.ok;
    },
    [project.id]
  );

  function updateField(phaseKey: string, field: keyof PhaseContent, value: string) {
    setPhases((prev) => ({
      ...prev,
      [phaseKey]: { ...prev[phaseKey], [field]: value },
    }));
  }

  function resetDeleteModal() {
    setDeleteOpen(false);
    setDeleteAck(false);
    setDeletePhrase("");
    setDeleteError(null);
  }

  async function deleteProjectPermanently() {
    setDeleteError(null);
    setDeleting(true);
    const res = await fetch(`/api/admin/projects-erp/${project.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleting(false);
    if (res.ok) {
      resetDeleteModal();
      router.push("/admin/proyectos");
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

  const projectPipelineSignals: ProjectPipelineSignals = {
    contractStatus: project.contractStatus ?? "borrador",
    hasSenaPaid: project.invoices.some((i) => i.type === "sena" && i.status === "pagado"),
    prebriefSubmittedAt: project.prebriefSubmittedAt,
    narrativaStatus: project.narrativaStatus ?? "borrador",
    narrativaAcknowledgedAt: project.narrativaAcknowledgedAt,
    phases,
    projectStatus: project.status,
  };

  const displayProjectStatus = deriveProjectStatus(projectPipelineSignals);
  const sc = PROJECT_STATUS_COLORS[displayProjectStatus] ?? PROJECT_STATUS_COLORS.onboarding;
  const totalFacturado = project.invoices.reduce((a, i) => a + i.total, 0);
  const porCobrar = project.invoices.filter((i) => i.status === "pendiente").reduce((a, i) => a + i.total, 0);

  return (
    <>
    <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm md:p-8">

      {/* ── Cabecera ── */}
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-6 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-400">Workspace del proyecto</p>
          <h1 className="mt-2 font-serif text-3xl italic" style={{ color: "#131945" }}>
            {project.title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(19,25,69,0.42)" }}>
            {project.client.name}
            {project.client.company ? ` — ${project.client.company}` : ""}
            {" · "}{SERVICE_LABELS[project.service] ?? project.service}
            {" · "}${project.value.toLocaleString("es-AR")} USD
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-block rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wide"
            style={{ background: sc.bg, color: sc.color }}
            title="Se actualiza según el avance del proyecto"
          >
            {PROJECT_STATUS_LABELS[displayProjectStatus]}
          </span>
          <button
            type="button"
            onClick={() => {
              setDeleteAck(false);
              setDeletePhrase("");
              setDeleteError(null);
              setDeleteOpen(true);
            }}
            className="rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-50"
            style={{ borderColor: "rgba(185,28,28,0.35)", color: "#b91c1c" }}
          >
            Eliminar proyecto…
          </button>
        </div>
      </div>

      <div className="mb-8">
        <p
          className="text-[9px] font-medium uppercase tracking-widest mb-2"
          style={{ color: "rgba(19,25,69,0.42)" }}
        >
          Progreso de este proyecto
        </p>
        <ProjectFlowBar signals={projectPipelineSignals} />
        <p className="text-[10px] mt-2" style={{ color: "rgba(19,25,69,0.38)" }}>
          Contrato y seña en <strong>1) Onboarding</strong>. Pre-brief en{" "}
          <strong>2) Pre-brief</strong>. Narrativa en <strong>3) Narrativa</strong>. Los estados
          se actualizan solos según cada hito.{syncingPhases ? " Sincronizando…" : ""}
        </p>
      </div>

      {/* ── Grilla de cards ── */}
      <div id="phases-grid" className="rounded-lg border bg-white p-4 md:p-6 mb-8" style={{ borderColor: "rgba(19,25,69,0.1)" }}>
        <div className="mb-5">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">{project.title}</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Cada card te lleva directo a su sección. Hacé clic para completar información.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PHASES.map((ph) => {
            const pc = phases[ph.key];
            const stc = STATE_COLORS[pc.state] ?? STATE_COLORS.pending;
            const dateRange = formatPhaseDateRange(pc.startDate, pc.endDate);
            return (
              <a key={ph.key} href={`#fase-${ph.key}`}
                className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <article>
                  <div className="relative h-[160px] overflow-hidden bg-neutral-100">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                      style={{ backgroundImage: phaseCover(ph) }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
                    <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium shadow-sm"
                      style={{ color: stc.color }}>
                      {STATE_OPTIONS.find((s) => s.value === pc.state)?.label ?? "Pendiente"}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                        style={{ background: "rgba(240,49,114,0.1)" }}>
                        <span className="text-[9px] font-semibold" style={{ color: "#F03172" }}>SB</span>
                      </div>
                      <h3 className="truncate text-[14px] font-semibold leading-tight text-neutral-900">
                        {ph.title}
                      </h3>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">{ph.desc}</p>
                    {dateRange ? (
                      <p className="mt-2 text-[10px] font-medium tracking-wide text-neutral-400">
                        {dateRange}
                      </p>
                    ) : (
                      <p className="mt-2 text-[10px] italic text-neutral-300">Sin fechas</p>
                    )}
                  </div>
                </article>
              </a>
            );
          })}
        </div>
      </div>

      {/* ── Secciones de fases ── */}
      <div className="space-y-6">
        {PHASES.map((ph) => {
          const pc = phases[ph.key];
          const isSaving = savingPhase === ph.key;
          return (
            <section key={ph.key} id={`fase-${ph.key}`}
              className="scroll-mt-24 overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm">
              {/* Portada */}
              <div className="relative h-[180px] overflow-hidden border-b border-neutral-200 bg-neutral-100">
                <div className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: phaseCover(ph) }} />
                <div className="absolute inset-0 bg-brand-navy/10" />
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 px-5 pb-5">
                  <div className="max-w-2xl text-white">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                      Etapa del proyecto
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold">{ph.title}</h3>
                    <p className="mt-1 text-sm text-white/85">{ph.desc}</p>
                  </div>
                  <a href="#phases-grid"
                    className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-neutral-800">
                    Volver a cards
                  </a>
                </div>
              </div>

              {/* Herramientas por etapa (contrato, pre-brief, etc.) */}
              {(ph.key === "onboarding" || ph.key === "prebrief" || ph.key === "narrativa") && (
                <div
                  className="border-b px-5 py-5 md:px-6 space-y-4"
                  style={{ borderColor: "rgba(19,25,69,0.1)", background: "rgba(19,25,69,0.02)" }}
                >
                  <p className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "rgba(19,25,69,0.42)" }}>
                    {ph.key === "onboarding"
                      ? "Cierre comercial e inicio"
                      : ph.key === "prebrief"
                        ? "Cuestionario al cliente"
                        : "Documento estratégico al cliente"}
                  </p>

                  {ph.key === "onboarding" && (
                    <LazyPhaseMount phaseKey="onboarding">
                      <>
                        <ContractEditor
                          embedded
                          projectId={project.id}
                          clientName={project.client.name}
                          projectTitle={project.title}
                        />
                        <div
                          className="rounded-2xl border bg-white p-4 flex flex-wrap items-center justify-between gap-3 text-sm"
                          style={{ borderColor: "rgba(19,25,69,0.1)" }}
                        >
                          <div>
                            <p className="font-medium text-neutral-900">Seña del proyecto</p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {(() => {
                                const sena = project.invoices.find((i) => i.type === "sena");
                                if (!sena) return "Sin recibo de seña vinculado aún.";
                                return sena.status === "pagado"
                                  ? `Pagada · ${sena.number}`
                                  : `Pendiente · ${sena.number}`;
                              })()}
                            </p>
                          </div>
                          <Link
                            href={`/admin/facturas?clientId=${project.client.id}&projectId=${project.id}`}
                            className="text-xs font-medium hover:underline"
                            style={{ color: "#F03172" }}
                          >
                            Gestionar facturas →
                          </Link>
                        </div>
                      </>
                    </LazyPhaseMount>
                  )}

                  {ph.key === "prebrief" && (
                    <LazyPhaseMount phaseKey="prebrief">
                      <PrebriefPanel
                        embedded
                        projectId={project.id}
                        clientName={project.client.name}
                        clientEmail={project.client.email}
                      />
                    </LazyPhaseMount>
                  )}

                  {ph.key === "narrativa" && (
                    <LazyPhaseMount phaseKey="narrativa">
                      <NarrativaPanel
                        embedded
                        projectId={project.id}
                        clientName={project.client.name}
                        projectTitle={project.title}
                        clientEmail={project.client.email}
                      />
                    </LazyPhaseMount>
                  )}
                </div>
              )}

              {/* Notas internas + seguimiento por fase */}
              <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:p-6">
                <div className="space-y-3">
                    {ph.key === "identidad" && (
                      <BrandKitPanel
                        phaseLabel="Identidad visual"
                        brandKitJson={pc.brandKit}
                        saving={isSaving}
                        onSave={async (brandKit) => {
                          setPhases((prev) => ({
                            ...prev,
                            [ph.key]: { ...prev[ph.key], brandKit },
                          }));
                          return savePhaseContent(ph.key, { brandKit });
                        }}
                      />
                    )}
                    {ph.key === "manual" && (
                      <ManualPdfPanel
                        pdf={getManualPdfFromPhase(pc)}
                        saving={isSaving}
                        onSave={async (meta) => {
                          const payload = meta
                            ? {
                                manualPdfUrl: meta.url,
                                manualPdfFileName: meta.fileName,
                                manualPdfMime: meta.mime,
                              }
                            : {
                                manualPdfUrl: "",
                                manualPdfFileName: "",
                                manualPdfMime: "",
                              };
                          setPhases((prev) => ({
                            ...prev,
                            [ph.key]: { ...prev[ph.key], ...payload },
                          }));
                          return savePhaseContent(ph.key, payload);
                        }}
                      />
                    )}
                    <PhaseDocumentEditor
                      phaseKey={ph.key as PhaseDocumentKey}
                      title={PHASE_DOCUMENT_TITLES[ph.key as PhaseDocumentKey]}
                      hint={PHASE_DOCUMENT_HINTS[ph.key as PhaseDocumentKey]}
                      saved={{ body: pc.body, bodyFormat: pc.bodyFormat }}
                      saving={isSaving}
                      onSave={async ({ body, bodyFormat }) => {
                        setPhases((prev) => ({
                          ...prev,
                          [ph.key]: { ...prev[ph.key], body, bodyFormat },
                        }));
                        return savePhaseContent(ph.key, { body, bodyFormat });
                      }}
                    />
                    {(ph.key === "onboarding" || ph.key === "prebrief" || ph.key === "narrativa") && (
                      <PhaseNotesEmailBar
                        projectId={project.id}
                        phaseKey={ph.key as PhaseDocumentKey}
                        htmlBody={pc.body}
                        projectTitle={project.title}
                      />
                    )}
                    {(ph.key === "identidad" || ph.key === "manual") && (
                      <PhaseClientSendBar
                        projectId={project.id}
                        phaseKey={ph.key as HtmlPhaseKey}
                        htmlBody={pc.body}
                        brandKitJson={pc.brandKit}
                        manualPdfUrl={pc.manualPdfUrl}
                        clientEmail={project.client.email}
                        meta={getPhaseClientMeta({
                          clientStatus: pc.clientStatus,
                          clientSentAt: pc.clientSentAt,
                          clientReceivedAt: pc.clientReceivedAt,
                        })}
                        onSent={() => {
                          const now = new Date().toISOString();
                          setPhases((prev) => ({
                            ...prev,
                            [ph.key]: {
                              ...prev[ph.key],
                              clientStatus: "enviado",
                              clientSentAt: now,
                              clientReceivedAt: "",
                              state: "active",
                            },
                          }));
                          void refreshPhaseStates();
                        }}
                        onMetaChange={(meta) => {
                          setPhases((prev) => ({
                            ...prev,
                            [ph.key]: {
                              ...prev[ph.key],
                              clientStatus: meta.clientStatus,
                              clientSentAt: meta.clientSentAt,
                              clientReceivedAt: meta.clientReceivedAt,
                              state: meta.clientStatus === "recibido" ? "done" : "active",
                            },
                          }));
                          void refreshPhaseStates();
                        }}
                      />
                    )}
                </div>

                {/* Sidebar de seguimiento */}
                <aside className="space-y-4 rounded-[20px] bg-neutral-50 p-4 h-fit">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                      Seguimiento
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-neutral-900">Estado de la fase</h4>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-800">Responsable</span>
                    <input
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-[#323FF6]"
                      placeholder="Sofia / cliente / equipo"
                      value={pc.owner}
                      onChange={(e) => updateField(ph.key, "owner", e.target.value)}
                      onBlur={() => void savePhaseContent(ph.key, { owner: pc.owner })}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-neutral-800">Inicio</span>
                      <input
                        type="date"
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-[#323FF6]"
                        value={pc.startDate}
                        onChange={(e) => updateField(ph.key, "startDate", e.target.value)}
                        onBlur={() =>
                          void savePhaseContent(ph.key, {
                            startDate: pc.startDate,
                            endDate: pc.endDate,
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-neutral-800">Fin</span>
                      <input
                        type="date"
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-[#323FF6]"
                        value={pc.endDate}
                        onChange={(e) => updateField(ph.key, "endDate", e.target.value)}
                        onBlur={() =>
                          void savePhaseContent(ph.key, {
                            startDate: pc.startDate,
                            endDate: pc.endDate,
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="block">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-800">Estado</span>
                    <div
                      className="inline-flex rounded-full px-3 py-1.5 text-sm font-medium"
                      style={{
                        background: (STATE_COLORS[pc.state] ?? STATE_COLORS.pending).bg,
                        color: (STATE_COLORS[pc.state] ?? STATE_COLORS.pending).color,
                      }}
                    >
                      {STATE_OPTIONS.find((s) => s.value === pc.state)?.label ?? "Pendiente"}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
                      Se calcula automáticamente según contrato, seña, envíos y respuestas del
                      cliente.
                    </p>
                  </div>

                  {/* Fechas del proyecto */}
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                    <p className="font-medium text-neutral-900 mb-2">Fechas del proyecto</p>
                    <p>Inicio: <span className="font-medium">{formatDate(project.startDate)}</span></p>
                    <p className="mt-1">Entrega: <span className="font-medium">{formatDate(project.deliveryDate)}</span></p>
                  </div>

                  {/* Estado de guardado */}
                  {isSaving && (
                    <p className="text-[11px] text-center" style={{ color: "#323FF6" }}>
                      Guardando…
                    </p>
                  )}

                  {/* Facturas vinculadas */}
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                        Facturación
                      </p>
                      <Link
                        href={`/admin/facturas?clientId=${project.client.id}&projectId=${project.id}`}
                        className="text-[10px] font-medium hover:underline whitespace-nowrap"
                        style={{ color: "#F03172" }}
                      >
                        + Factura
                      </Link>
                    </div>
                    {project.invoices.length === 0 ? (
                      <p className="text-xs text-neutral-400">Sin facturas vinculadas a este proyecto.</p>
                    ) : (
                      <>
                        {project.invoices.map((inv) => (
                          <div key={inv.id} className="flex justify-between text-xs gap-2">
                            <span className="text-neutral-500 font-mono">{inv.number}</span>
                            <span className="font-medium">
                              ${inv.total.toLocaleString("es-AR")}{" "}
                              <span className={inv.status === "pagado" ? "text-green-700" : "text-orange-700"}>
                                {inv.status === "pagado" ? "pagada" : "pend."}
                              </span>
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm pt-2 border-t border-neutral-100">
                          <span className="text-neutral-500">Facturado</span>
                          <span className="font-medium">${totalFacturado.toLocaleString("es-AR")} USD</span>
                        </div>
                        {porCobrar > 0 && (
                          <div className="flex justify-between text-sm">
                            <span style={{ color: "#b45000" }}>Por cobrar</span>
                            <span className="font-medium" style={{ color: "#b45000" }}>
                              ${porCobrar.toLocaleString("es-AR")} USD
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <Link href={`/admin/clientes/${project.client.id}`}
                    className="block text-center rounded-2xl border border-neutral-200 px-4 py-2.5 text-xs font-medium hover:bg-neutral-50 transition-colors"
                    style={{ color: "#323FF6" }}>
                    Ver ficha de {project.client.name} →
                  </Link>
                </aside>
              </div>
            </section>
          );
        })}
      </div>
    </div>

    {deleteOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(19,25,69,0.2)" }}
        onClick={(e) => e.target === e.currentTarget && !deleting && resetDeleteModal()}
      >
        <div
          className="w-full max-w-md rounded bg-white shadow-2xl p-5 space-y-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
        >
          <h3
            id="delete-project-title"
            className="font-serif text-lg italic"
            style={{ color: "#b91c1c" }}
          >
            Eliminar proyecto
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(19,25,69,0.65)" }}>
            Se borrará de forma permanente el proyecto{" "}
            <strong style={{ color: "#131945" }}>{project.title}</strong> de{" "}
            <strong style={{ color: "#131945" }}>{project.client.name}</strong>, incluyendo
            facturas y tokens de acceso vinculados solo a este proyecto. El cliente y sus otros
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
            <span style={{ color: "#131945" }}>
              Confirmo que quiero eliminar este proyecto y entiendo que no se puede deshacer.
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
              onClick={() => void deleteProjectPermanently()}
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
