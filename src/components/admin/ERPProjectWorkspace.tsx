"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { navigateAdminToPhaseHash, scrollAdminMainToHash } from "@/lib/admin-main-scroll";
import { PhaseDocumentEditor } from "@/components/admin/PhaseDocumentEditor";
import { PhaseManualStatusBar } from "@/components/admin/PhaseManualStatusBar";
import { BrandKitPanel } from "@/components/admin/BrandKitPanel";
import { ManualPdfPanel } from "@/components/admin/ManualPdfPanel";
import { getManualPdfFromPhase } from "@/lib/manual-pdf";
import { PhaseNotesEmailBar } from "@/components/admin/PhaseNotesEmailBar";
import { ProjectFlowBar } from "@/components/admin/ProjectFlowBar";
import { ProjectTrackingFab } from "@/components/admin/ProjectTrackingFab";
import { ProjectPhaseCoverEditor } from "@/components/admin/ProjectPhaseCoverEditor";
import { GenericProjectPhasePanel } from "@/components/admin/GenericProjectPhasePanel";
import type { ProjectPhaseDefinition } from "@/lib/project-phase-catalog";
import {
  buildProjectPhaseList,
  createCustomProjectPhaseId,
  parseCustomPhaseDefinitions,
  PROJECT_LAYOUT_STORAGE_KEY,
  resolvePhaseCoverImage,
  serializeCustomPhaseDefinitions,
  hasPhaseCoverImage,
  type CustomPhaseDefinition,
} from "@/lib/project-phase-layout";
import { getPhaseClientMeta, type PhaseClientMeta } from "@/lib/phase-client-store";
import type { WorkspacePhaseKey } from "@/lib/project-phase-sync";
import {
  PHASE_DOCUMENT_HINTS,
  PHASE_DOCUMENT_TITLES,
  type PhaseDocumentKey,
} from "@/lib/phase-document-templates";
import {
  deriveProjectStatus,
  PROJECT_STATUS_LABELS,
  projectHasFinalPaid,
  projectHasSenaPaid,
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
  coverUrl: string;
};

function buildPhaseListFromRaw(raw: Record<string, Record<string, string>>): ProjectPhaseDefinition[] {
  return buildProjectPhaseList(parseCustomPhaseDefinitions(raw));
}

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

const STATE_LABELS: Record<string, string> = Object.fromEntries(
  STATE_OPTIONS.map((s) => [s.value, s.label]),
);

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
    coverUrl: "",
  };
}

function parsePhases(
  raw: Record<string, Record<string, string>>,
  phaseList: ProjectPhaseDefinition[],
): Record<string, PhaseContent> {
  const result: Record<string, PhaseContent> = {};
  for (const ph of phaseList) {
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
      coverUrl: saved.coverUrl ?? "",
    };
  }
  return result;
}

function phaseCoverImage(content?: Pick<PhaseContent, "coverUrl">): string | undefined {
  const resolved = resolvePhaseCoverImage({ coverUrl: content?.coverUrl });
  return resolved ?? undefined;
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

function toDateInputValue(d: string | null): string {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d.slice(0, 10);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DELETE_CONFIRM_PHRASE = "ELIMINAR";

// ── componente principal ───────────────────────────────────
export function ERPProjectWorkspace({ project: initial }: { project: ClientProject }) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [rawPhases, setRawPhases] = useState<Record<string, Record<string, string>>>(
    () => initial.phases ?? {},
  );
  const phaseList = useMemo(() => buildPhaseListFromRaw(rawPhases), [rawPhases]);
  const [phases, setPhases] = useState<Record<string, PhaseContent>>(() =>
    parsePhases(initial.phases ?? {}, buildPhaseListFromRaw(initial.phases ?? {})),
  );
  const [savingPhase, setSavingPhase] = useState<string | null>(null);
  const [coverUploadingKey, setCoverUploadingKey] = useState<string | null>(null);
  const [addingPhase, setAddingPhase] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAck, setDeleteAck] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [syncingPhases, setSyncingPhases] = useState(false);
  const [savingProjectDates, setSavingProjectDates] = useState(false);

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
        setRawPhases(j.phases);
        setPhases(parsePhases(j.phases, buildPhaseListFromRaw(j.phases)));
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

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#fase-") && hash !== "#phases-grid") return;

    const runScroll = () => scrollAdminMainToHash(hash, "auto");
    runScroll();
    const t1 = window.setTimeout(runScroll, 50);
    const t2 = window.setTimeout(runScroll, 280);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [phaseList.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHashChange = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#fase-") && hash !== "#phases-grid") return;
      window.requestAnimationFrame(() => {
        scrollAdminMainToHash(hash);
      });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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
          setRawPhases(j.phases);
          setPhases(parsePhases(j.phases, buildPhaseListFromRaw(j.phases)));
        }
      }
      setSavingPhase(null);
      return res.ok;
    },
    [project.id]
  );

  const handlePhaseMetaChange = useCallback(
    (phaseKey: string, meta: PhaseClientMeta) => {
      setPhases((prev) => ({
        ...prev,
        [phaseKey]: {
          ...prev[phaseKey],
          clientStatus: meta.clientStatus,
          clientSentAt: meta.clientSentAt,
          clientReceivedAt: meta.clientReceivedAt,
          state:
            meta.clientStatus === "recibido"
              ? "done"
              : meta.clientStatus === "enviado"
                ? "active"
                : prev[phaseKey]?.state,
        },
      }));
      void refreshPhaseStates();
    },
    [refreshPhaseStates],
  );

  function updateProjectDateField(field: "startDate" | "deliveryDate", value: string) {
    setProject((prev) => ({ ...prev, [field]: value || null }));
  }

  const saveProjectDates = useCallback(async () => {
    setSavingProjectDates(true);
    const res = await fetch(`/api/admin/projects-erp/${project.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: project.startDate ? toDateInputValue(project.startDate) : null,
        deliveryDate: project.deliveryDate ? toDateInputValue(project.deliveryDate) : null,
      }),
    });
    if (res.ok) {
      const j = (await res.json()) as {
        item?: { startDate?: string | null; deliveryDate?: string | null };
      };
      if (j.item) {
        setProject((p) => ({
          ...p,
          startDate: j.item!.startDate ? String(j.item!.startDate) : null,
          deliveryDate: j.item!.deliveryDate ? String(j.item!.deliveryDate) : null,
        }));
      }
    }
    setSavingProjectDates(false);
  }, [project.id, project.startDate, project.deliveryDate]);

  const savePhaseDateRange = useCallback(
    async (phaseKey: string) => {
      const pc = phases[phaseKey];
      if (!pc) return;

      const idx = phaseList.findIndex((p) => p.key === phaseKey);
      let cascadeNextKey: string | null = null;
      let cascadeStart = "";

      if (pc.endDate.trim() && idx >= 0 && idx < phaseList.length - 1) {
        cascadeNextKey = phaseList[idx + 1].key;
        const nextStart = phases[cascadeNextKey]?.startDate ?? "";
        if (!nextStart.trim()) {
          cascadeStart = pc.endDate;
          setPhases((prev) => ({
            ...prev,
            [cascadeNextKey!]: { ...prev[cascadeNextKey!], startDate: pc.endDate },
          }));
        }
      }

      await savePhaseContent(phaseKey, { startDate: pc.startDate, endDate: pc.endDate });

      if (cascadeNextKey && cascadeStart) {
        const nextEnd = phases[cascadeNextKey]?.endDate ?? "";
        await savePhaseContent(cascadeNextKey, {
          startDate: cascadeStart,
          endDate: nextEnd,
        });
      }
    },
    [phases, savePhaseContent, phaseList],
  );

  const saveCustomPhaseLayout = useCallback(
    async (defs: CustomPhaseDefinition[]) => {
      const res = await fetch(`/api/admin/projects-erp/${project.id}/phases`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: PROJECT_LAYOUT_STORAGE_KEY,
          content: { customPhases: serializeCustomPhaseDefinitions(defs) },
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as { phases?: Record<string, Record<string, string>> };
        if (j.phases) {
          setRawPhases(j.phases);
          setPhases(parsePhases(j.phases, buildPhaseListFromRaw(j.phases)));
        }
      }
      return res.ok;
    },
    [project.id],
  );

  async function addCustomPhase() {
    const title = window.prompt("Nombre de la nueva etapa", "Testimonio")?.trim();
    if (!title) return;
    setAddingPhase(true);
    const key = createCustomProjectPhaseId();
    const defs = [
      ...parseCustomPhaseDefinitions(rawPhases),
      {
        key,
        title,
        desc: "Documento para el cliente — contenido editable y envío por mail.",
      },
    ];
    const ok = await saveCustomPhaseLayout(defs);
    setAddingPhase(false);
    if (ok) {
      window.location.hash = `fase-${key}`;
    }
  }

  async function updateCustomPhaseDef(
    phaseKey: string,
    patch: Partial<Pick<CustomPhaseDefinition, "title" | "desc">>,
  ) {
    const defs = parseCustomPhaseDefinitions(rawPhases).map((d) =>
      d.key === phaseKey ? { ...d, ...patch } : d,
    );
    await saveCustomPhaseLayout(defs);
  }

  async function removeCustomPhase(phaseKey: string) {
    const def = parseCustomPhaseDefinitions(rawPhases).find((d) => d.key === phaseKey);
    if (!def) return;
    const ok = window.confirm(`¿Eliminar la etapa "${def.title}"? No se puede deshacer.`);
    if (!ok) return;
    const defs = parseCustomPhaseDefinitions(rawPhases).filter((d) => d.key !== phaseKey);
    await saveCustomPhaseLayout(defs);
  }

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
    hasSenaPaid: projectHasSenaPaid(project.invoices, project.id),
    hasFinalPaid: projectHasFinalPaid(project.invoices, project.id),
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
          <strong>2) Pre-brief</strong>. Narrativa en <strong>3) Narrativa</strong>. Onboarding
          también se marca con el pago total. Los estados se actualizan solos según cada hito.
          {displayProjectStatus === "entregado" ? (
            <strong style={{ color: "#1a6b1a" }}> Proyecto entregado.</strong>
          ) : null}
          {syncingPhases ? " Sincronizando…" : ""}
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
          {phaseList.map((ph) => {
            const pc = phases[ph.key] ?? emptyPhaseContent();
            const stc = STATE_COLORS[pc.state] ?? STATE_COLORS.pending;
            const dateRange = formatPhaseDateRange(pc.startDate, pc.endDate);
            const hasCover = hasPhaseCoverImage(pc);
            return (
              <a
                key={ph.key}
                href={`#fase-${ph.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateAdminToPhaseHash(ph.key);
                }}
                className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <article>
                  {hasCover ? (
                    <div className="relative h-[160px] overflow-hidden bg-neutral-50">
                      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                        style={{ backgroundImage: phaseCoverImage(pc) }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
                      <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium shadow-sm"
                        style={{ color: stc.color }}>
                        {STATE_OPTIONS.find((s) => s.value === pc.state)?.label ?? "Pendiente"}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end border-b border-neutral-100 px-4 py-2">
                      <span
                        className="rounded-full px-3 py-1 text-[10px] font-medium"
                        style={{ background: stc.bg, color: stc.color }}
                      >
                        {STATE_OPTIONS.find((s) => s.value === pc.state)?.label ?? "Pendiente"}
                      </span>
                    </div>
                  )}
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
          <button
            type="button"
            disabled={addingPhase}
            onClick={() => void addCustomPhase()}
            className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-8 text-center transition-colors hover:border-[#F03172] hover:bg-white disabled:opacity-50"
          >
            <span className="text-2xl font-light text-neutral-400">+</span>
            <span className="text-sm font-medium text-neutral-600">
              {addingPhase ? "Creando etapa…" : "Nueva etapa"}
            </span>
            <span className="text-xs text-neutral-400 max-w-[200px]">
              Ej: Testimonio, encuesta o entrega extra con mail al cliente
            </span>
          </button>
        </div>
      </div>

      {/* ── Secciones de fases ── */}
      <div className="space-y-6">
        {phaseList.map((ph) => {
          const pc = phases[ph.key] ?? emptyPhaseContent();
          const isSaving = savingPhase === ph.key;
          const isCustom = ph.genericClient === true;
          const hasCover = hasPhaseCoverImage(pc);
          return (
            <section key={ph.key} id={`fase-${ph.key}`}
              className="scroll-mt-24 overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm">
              {/* Portada */}
              {hasCover ? (
                <div className="relative h-[180px] overflow-hidden border-b border-neutral-200 bg-neutral-50">
                  <div className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: phaseCoverImage(pc) }} />
                  <div className="absolute inset-0 bg-brand-navy/10" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 px-5 pb-5">
                    <div className="max-w-2xl text-white">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                        Etapa del proyecto
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold">{ph.title}</h3>
                      <p className="mt-1 text-sm text-white/85">{ph.desc}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => void removeCustomPhase(ph.key)}
                          className="rounded-full bg-red-600/90 px-4 py-2 text-xs font-medium text-white"
                        >
                          Eliminar etapa
                        </button>
                      )}
                      <a
                        href="#phases-grid"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.hash = "phases-grid";
                          scrollAdminMainToHash("#phases-grid");
                        }}
                        className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-neutral-800"
                      >
                        Volver a cards
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-b border-neutral-200 px-5 py-5 md:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-2xl">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                        Etapa del proyecto
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold text-neutral-900">{ph.title}</h3>
                      <p className="mt-1 text-sm text-neutral-500">{ph.desc}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => void removeCustomPhase(ph.key)}
                          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700"
                        >
                          Eliminar etapa
                        </button>
                      )}
                      <a
                        href="#phases-grid"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.hash = "phases-grid";
                          scrollAdminMainToHash("#phases-grid");
                        }}
                        className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-800"
                      >
                        Volver a cards
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-b px-5 py-4 md:px-6" style={{ borderColor: "rgba(19,25,69,0.08)" }}>
                <ProjectPhaseCoverEditor
                  label={ph.title}
                  coverUrl={pc.coverUrl}
                  onUploadingChange={(uploading) =>
                    setCoverUploadingKey(uploading ? ph.key : null)
                  }
                  onChange={(coverUrl) => {
                    setPhases((prev) => ({
                      ...prev,
                      [ph.key]: { ...(prev[ph.key] ?? emptyPhaseContent()), coverUrl },
                    }));
                    void savePhaseContent(ph.key, { coverUrl });
                  }}
                />
                {coverUploadingKey === ph.key && (
                  <p className="text-[11px] mt-2" style={{ color: "#323FF6" }}>
                    Subiendo imagen…
                  </p>
                )}
                {isCustom && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-neutral-600">Título</span>
                      <input
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        defaultValue={ph.title}
                        onBlur={(e) => {
                          const title = e.target.value.trim();
                          if (title && title !== ph.title) {
                            void updateCustomPhaseDef(ph.key, { title });
                          }
                        }}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-xs font-medium text-neutral-600">Descripción</span>
                      <textarea
                        className="w-full min-h-[64px] rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        defaultValue={ph.desc}
                        onBlur={(e) => {
                          const desc = e.target.value.trim();
                          if (desc !== ph.desc) {
                            void updateCustomPhaseDef(ph.key, { desc });
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Herramientas por etapa (contrato, pre-brief, etc.) */}
              {!isCustom && (ph.key === "onboarding" || ph.key === "prebrief" || ph.key === "narrativa") && (
                <div
                  className="border-b px-5 py-5 md:px-6 space-y-4"
                  style={{ borderColor: "rgba(240,49,114,0.2)", background: "rgba(240,49,114,0.03)" }}
                >
                  <p className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "#F03172" }}>
                    {ph.key === "onboarding"
                      ? "Documento para el cliente — contrato e inicio"
                      : ph.key === "prebrief"
                        ? "Documento para el cliente — cuestionario"
                        : "Documento para el cliente — narrativa estratégica"}
                  </p>

                  {ph.key === "onboarding" && (
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
                  )}

                  {ph.key === "prebrief" && (
                    <PrebriefPanel
                      embedded
                      projectId={project.id}
                      clientName={project.client.name}
                      clientEmail={project.client.email}
                    />
                  )}

                  {ph.key === "narrativa" && (
                    <NarrativaPanel
                      embedded
                      projectId={project.id}
                      clientName={project.client.name}
                      projectTitle={project.title}
                      clientEmail={project.client.email}
                    />
                  )}
                </div>
              )}

              {/* Contenido de la fase — ancho completo */}
              <div className="space-y-4 p-5 md:p-6">
                    {isCustom && (
                      <GenericProjectPhasePanel
                        projectId={project.id}
                        phaseKey={ph.key}
                        phaseTitle={ph.title}
                        clientEmail={project.client.email}
                        saved={{
                          body: pc.body,
                          bodyFormat: pc.bodyFormat,
                          clientStatus: pc.clientStatus,
                          clientSentAt: pc.clientSentAt,
                          clientReceivedAt: pc.clientReceivedAt,
                        }}
                        saving={isSaving}
                        meta={getPhaseClientMeta({
                          clientStatus: pc.clientStatus,
                          clientSentAt: pc.clientSentAt,
                          clientReceivedAt: pc.clientReceivedAt,
                        })}
                        onSave={async ({ body, bodyFormat }) => {
                          setPhases((prev) => ({
                            ...prev,
                            [ph.key]: { ...(prev[ph.key] ?? emptyPhaseContent()), body, bodyFormat },
                          }));
                          return savePhaseContent(ph.key, { body, bodyFormat });
                        }}
                        onSent={() => {
                          const now = new Date().toISOString();
                          handlePhaseMetaChange(ph.key, {
                            clientStatus: "enviado",
                            clientSentAt: now,
                            clientReceivedAt: "",
                          });
                        }}
                        onMetaChange={(meta) => handlePhaseMetaChange(ph.key, meta)}
                      />
                    )}
                    {!isCustom && ph.key === "identidad" && (
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
                    {!isCustom && ph.key === "manual" && (
                      <ManualPdfPanel
                        pdf={getManualPdfFromPhase(pc)}
                        saving={isSaving}
                        clientSend={{
                          projectId: project.id,
                          phaseKey: "manual",
                          clientEmail: project.client.email,
                          meta: getPhaseClientMeta({
                            clientStatus: pc.clientStatus,
                            clientSentAt: pc.clientSentAt,
                            clientReceivedAt: pc.clientReceivedAt,
                          }),
                          onSent: () => {
                            const now = new Date().toISOString();
                            handlePhaseMetaChange(ph.key, {
                              clientStatus: "enviado",
                              clientSentAt: now,
                              clientReceivedAt: "",
                            });
                          },
                        }}
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
                    {!isCustom && ph.key === "identidad" && (
                      <PhaseDocumentEditor
                        phaseKey="identidad"
                        title={PHASE_DOCUMENT_TITLES.identidad}
                        hint="Lo que escribas acá lo ve el cliente al abrir el enlace del mail (junto al Brand ID)."
                        variant="client"
                        saved={{ body: pc.body, bodyFormat: pc.bodyFormat }}
                        saving={isSaving}
                        clientSend={{
                          projectId: project.id,
                          phaseKey: "identidad",
                          clientEmail: project.client.email,
                          brandKitJson: pc.brandKit,
                          meta: getPhaseClientMeta({
                            clientStatus: pc.clientStatus,
                            clientSentAt: pc.clientSentAt,
                            clientReceivedAt: pc.clientReceivedAt,
                          }),
                          onSent: () => {
                            const now = new Date().toISOString();
                            handlePhaseMetaChange(ph.key, {
                              clientStatus: "enviado",
                              clientSentAt: now,
                              clientReceivedAt: "",
                            });
                          },
                        }}
                        onSave={async ({ body, bodyFormat }) => {
                          setPhases((prev) => ({
                            ...prev,
                            [ph.key]: { ...prev[ph.key], body, bodyFormat },
                          }));
                          return savePhaseContent(ph.key, { body, bodyFormat });
                        }}
                      />
                    )}
                    {!isCustom && (
                    <PhaseManualStatusBar
                      projectId={project.id}
                      phaseKey={ph.key as WorkspacePhaseKey}
                      meta={getPhaseClientMeta({
                        clientStatus: pc.clientStatus,
                        clientSentAt: pc.clientSentAt,
                        clientReceivedAt: pc.clientReceivedAt,
                      })}
                      disabled={isSaving}
                      onMetaChange={(meta) => handlePhaseMetaChange(ph.key, meta)}
                      hint={
                        ph.key === "onboarding"
                          ? "Útil si el contrato, la seña o el pago total se cerraron por fuera del sistema."
                          : ph.key === "prebrief"
                            ? "Marcá recibido si el cliente completó el pre-brief por otro canal."
                            : ph.key === "narrativa"
                              ? "Marcá recibido si el cliente aprobó la narrativa fuera del portal."
                              : undefined
                      }
                    />
                    )}

                {!isCustom && (ph.key === "onboarding" || ph.key === "prebrief" || ph.key === "narrativa") && (
                  <details className="group rounded-2xl border border-neutral-200 bg-neutral-50/80 open:bg-neutral-50">
                    <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 select-none [&::-webkit-details-marker]:hidden">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-widest text-neutral-400">
                          Notas privadas
                        </p>
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">
                          {PHASE_DOCUMENT_TITLES[ph.key as PhaseDocumentKey]}
                          {pc.body.trim() ? " · con contenido" : ""}
                        </p>
                      </div>
                      <span className="text-neutral-400 text-xs group-open:rotate-180 transition-transform">
                        ▾
                      </span>
                    </summary>
                    <div className="px-4 pb-4 pt-1 space-y-4 border-t border-neutral-200/80">
                      <PhaseDocumentEditor
                        phaseKey={ph.key as PhaseDocumentKey}
                        title={PHASE_DOCUMENT_TITLES[ph.key as PhaseDocumentKey]}
                        hint={PHASE_DOCUMENT_HINTS[ph.key as PhaseDocumentKey]}
                        variant="internal"
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
                      <PhaseNotesEmailBar
                        projectId={project.id}
                        phaseKey={ph.key as PhaseDocumentKey}
                        htmlBody={pc.body}
                        projectTitle={project.title}
                      />
                    </div>
                  </details>
                )}

                <details className="group rounded-2xl border border-neutral-200 bg-neutral-50/80 open:bg-neutral-50">
                  <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 select-none [&::-webkit-details-marker]:hidden">
                    <div>
                      <p className="text-[9px] font-medium uppercase tracking-widest text-neutral-400">
                        Seguimiento de esta etapa
                      </p>
                      <p className="text-sm font-medium text-neutral-700 mt-0.5">
                        Fechas, responsable y estado
                        {pc.owner ? ` · ${pc.owner}` : ""}
                      </p>
                    </div>
                    <span className="text-neutral-400 text-xs group-open:rotate-180 transition-transform">
                      ▾
                    </span>
                  </summary>
                  <div className="px-4 pb-4 pt-1 space-y-4 border-t border-neutral-200/80">
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

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-neutral-800">Inicio etapa</span>
                        <input
                          type="date"
                          className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-[#323FF6]"
                          value={pc.startDate}
                          onChange={(e) => updateField(ph.key, "startDate", e.target.value)}
                          onBlur={() => void savePhaseDateRange(ph.key)}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-neutral-800">Fin etapa</span>
                        <input
                          type="date"
                          className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-[#323FF6]"
                          value={pc.endDate}
                          onChange={(e) => updateField(ph.key, "endDate", e.target.value)}
                          onBlur={() => void savePhaseDateRange(ph.key)}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] leading-relaxed text-neutral-400 -mt-2">
                      Al guardar la fecha de fin, si la etapa siguiente no tiene inicio, se completa
                      automáticamente (podés editarla después).
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-neutral-800">Estado:</span>
                      <div
                        className="inline-flex rounded-full px-3 py-1.5 text-sm font-medium"
                        style={{
                          background: (STATE_COLORS[pc.state] ?? STATE_COLORS.pending).bg,
                          color: (STATE_COLORS[pc.state] ?? STATE_COLORS.pending).color,
                        }}
                      >
                        {STATE_OPTIONS.find((s) => s.value === pc.state)?.label ?? "Pendiente"}
                      </div>
                      <p className="text-[11px] text-neutral-400 w-full sm:w-auto">
                        Se calcula según contrato, pagos, envíos y respuestas del cliente.
                      </p>
                    </div>

                    {isSaving && (
                      <p className="text-[11px]" style={{ color: "#323FF6" }}>
                        Guardando…
                      </p>
                    )}
                  </div>
                </details>
              </div>
            </section>
          );
        })}
      </div>
    </div>

    <ProjectTrackingFab
      projectTitle={project.title}
      client={project.client}
      projectId={project.id}
      startDate={project.startDate}
      deliveryDate={project.deliveryDate}
      savingProjectDates={savingProjectDates}
      phases={phaseList.map((p) => ({
        key: p.key,
        title: p.title,
        state: phases[p.key]?.state ?? "pending",
        startDate: phases[p.key]?.startDate ?? "",
        endDate: phases[p.key]?.endDate ?? "",
        owner: phases[p.key]?.owner ?? "",
      }))}
      stateLabels={STATE_LABELS}
      stateColors={STATE_COLORS}
      invoices={project.invoices}
      totalFacturado={totalFacturado}
      porCobrar={porCobrar}
      toDateInputValue={toDateInputValue}
      onProjectDateChange={updateProjectDateField}
      onSaveProjectDates={() => void saveProjectDates()}
    />

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
