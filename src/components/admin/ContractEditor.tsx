"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Topbar } from "@/components/admin/ui/Topbar";
import type { ContractProjectInput } from "@/lib/contract-default-content";
import {
  getContractHtmlTemplate,
  resolveContractHtml,
} from "@/lib/contract-html-templates";
import {
  CONTRACT_STATUS_LABELS,
  type ContractContent,
  type ContractStatus,
} from "@/lib/contract-types";
import { brandUi } from "@/lib/brand-ui";
import { CONTENT_HASH_HELP, formatIpForDisplay } from "@/lib/contract-acceptance";
import "@/components/admin/rich-text-editor.css";

type ContractEditorProps = {
  projectId: string;
  clientName: string;
  projectTitle: string;
  /** Dentro de la sección #fase-onboarding (sin margen externo). */
  embedded?: boolean;
};

type ContractData = {
  content: ContractContent;
  status: ContractStatus;
  statusLabel: string;
  contractSentAt: string | null;
  contractAcceptedAt: string | null;
  client: { name: string; email: string; company: string };
  project: { id: string; title: string; service: string; value: number };
  acceptance: {
    typedName: string;
    clientEmail: string;
    ipAddress: string;
    userAgent: string;
    contentHash: string;
    acceptedAt: string;
    pdfUrl: string;
  } | null;
};

export function ContractEditor({
  projectId,
  clientName,
  projectTitle,
  embedded = false,
}: ContractEditorProps) {
  const [data, setData] = useState<ContractData | null>(null);
  const [html, setHtml] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectInput = useMemo<ContractProjectInput | null>(() => {
    if (!data) return null;
    return {
      title: data.project.title,
      service: data.project.service,
      value: data.project.value,
      client: data.client,
    };
  }, [data]);

  const defaultHtml = useMemo(
    () => (projectInput ? getContractHtmlTemplate(projectInput) : ""),
    [projectInput],
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/projects-erp/${projectId}/contract`, {
      credentials: "include",
    });
    if (res.ok) {
      const j = (await res.json()) as ContractData;
      setData(j);
      const input: ContractProjectInput = {
        title: j.project.title,
        service: j.project.service,
        value: j.project.value,
        client: j.client,
        contractContent: j.content,
      };
      setHtml(resolveContractHtml(j.content, input));
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const isLocked = data?.status === "aceptado";
  const canEdit = data?.status === "borrador" || data?.status === "enviado";

  async function saveDraft(nextHtml = html) {
    if (!canEdit || isLocked) return;
    const trimmed = nextHtml.trim();
    if (!trimmed) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/contract`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { body: trimmed, format: "html" as const },
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Borrador guardado.");
      void load();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo guardar.");
    }
  }

  function persistDraft(nextHtml: string) {
    setHtml(nextHtml);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveDraft(nextHtml), 900);
  }

  async function sendContract() {
    if (isLocked) return;
    await saveDraft(html);
    setSending(true);
    setMessage(null);
    setLastLink(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/contract/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { body: html.trim(), format: "html" as const },
        personalNote: personalNote.trim() || undefined,
      }),
    });
    setSending(false);
    if (res.ok) {
      const j = (await res.json()) as {
        publicUrl?: string;
        publicToken?: string;
        emailed?: boolean;
      };
      setLastLink(j.publicUrl ?? null);
      setMessage(
        j.emailed
          ? `Contrato enviado a ${data?.client.email ?? "el cliente"}.`
          : `Contrato registrado. ${j.publicToken ? `Link dev: ${j.publicUrl}` : "Configurá Resend para enviar el mail."}`,
      );
      void load();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo enviar.");
    }
  }

  function restoreTemplate() {
    if (!projectInput || isLocked) return;
    if (
      !window.confirm(
        "¿Volver al modelo original del contrato?\n\nSe reemplazará el texto actual por la plantilla inicial.",
      )
    ) {
      return;
    }
    setHtml(defaultHtml);
    void saveDraft(defaultHtml);
  }

  const cardClass = embedded ? "rounded-2xl border shadow-sm" : "mb-8";

  if (loading) {
    return (
      <Card id={embedded ? undefined : "contrato"} className={cardClass} frameVariant={embedded ? "client" : "default"}>
        <Topbar title="Contrato" subtitle={`${clientName} · ${projectTitle}`} />
        <p className="text-xs" style={{ color: brandUi.textMuted }}>
          Cargando…
        </p>
      </Card>
    );
  }

  const status = data?.status ?? "borrador";
  const ipDisplay = data?.acceptance ? formatIpForDisplay(data.acceptance.ipAddress) : null;
  const editorLabel = editorOpen
    ? "Ocultar contrato"
    : isLocked
      ? "Ver contrato"
      : "Editar contrato";

  return (
    <Card id={embedded ? undefined : "contrato"} className={cardClass} frameVariant={embedded ? "client" : "default"}>
      <Topbar
        title="Contrato"
        subtitle={`${clientName} · ${projectTitle}`}
        actions={
          <span
            className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{
              background:
                status === "aceptado"
                  ? "#e3f2e3"
                  : status === "enviado"
                    ? brandUi.accentSoft
                    : brandUi.navySoft,
              color:
                status === "aceptado"
                  ? "#1a6b1a"
                  : status === "enviado"
                    ? brandUi.accent
                    : brandUi.textMuted,
            }}
          >
            {CONTRACT_STATUS_LABELS[status]}
          </span>
        }
      />

      <div
        className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t"
        style={{ borderColor: brandUi.border }}
      >
        <div className="text-xs space-y-0.5">
          {data?.contractAcceptedAt && (
            <p style={{ color: "#1a6b1a" }}>
              Aceptado el{" "}
              {new Date(data.contractAcceptedAt).toLocaleString("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
          {!data?.contractAcceptedAt && data?.contractSentAt && (
            <p style={{ color: brandUi.textMuted }}>
              Enviado el{" "}
              {new Date(data.contractSentAt).toLocaleString("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
          {status === "borrador" && (
            <p style={{ color: brandUi.textFaint }}>
              Editá el contrato con el mismo editor visual que el resto de las fases.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setEditorOpen((v) => !v)}
          className="text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity"
          style={{ color: brandUi.accent, background: "none", border: "none", cursor: "pointer" }}
          aria-expanded={editorOpen}
        >
          {editorLabel} {editorOpen ? "↑" : "↓"}
        </button>
      </div>

      {data?.acceptance && (
        <div
          className="mt-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: brandUi.border, background: "rgba(26,107,26,0.04)" }}
        >
          <p className="text-sm font-medium" style={{ color: "#1a6b1a" }}>
            Certificado de aceptación
          </p>
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt style={{ color: brandUi.textFaint }}>Nombre declarado</dt>
              <dd style={{ color: brandUi.text }}>{data.acceptance.typedName}</dd>
            </div>
            <div>
              <dt style={{ color: brandUi.textFaint }}>Email</dt>
              <dd style={{ color: brandUi.text }}>{data.acceptance.clientEmail}</dd>
            </div>
            <div>
              <dt style={{ color: brandUi.textFaint }}>IP</dt>
              <dd style={{ color: brandUi.text }}>{ipDisplay?.value ?? "—"}</dd>
              {ipDisplay?.note && (
                <dd className="mt-1 text-[10px] leading-relaxed" style={{ color: brandUi.textFaint }}>
                  {ipDisplay.note}
                </dd>
              )}
            </div>
            <div>
              <dt style={{ color: brandUi.textFaint }}>Huella SHA-256</dt>
              <dd className="break-all font-mono text-[10px]" style={{ color: brandUi.text }}>
                {data.acceptance.contentHash}
              </dd>
              <dd className="mt-1 text-[10px] leading-relaxed" style={{ color: brandUi.textFaint }}>
                {CONTENT_HASH_HELP}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt style={{ color: brandUi.textFaint }}>Navegador</dt>
              <dd className="break-all" style={{ color: brandUi.textMuted }}>
                {data.acceptance.userAgent || "—"}
              </dd>
            </div>
          </dl>
          <a
            href={data.acceptance.pdfUrl}
            className="inline-flex text-xs font-medium uppercase tracking-wider hover:opacity-80"
            style={{ color: brandUi.accent }}
          >
            Descargar PDF del certificado →
          </a>
        </div>
      )}

      {editorOpen && (
        <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: brandUi.border }}>
          <div
            className="rounded-2xl border-2 px-4 py-3"
            style={{ borderColor: "#F03172", background: "rgba(240,49,114,0.06)" }}
          >
            <p className="text-sm font-medium" style={{ color: "#F03172" }}>
              Documento para el cliente — contrato
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: brandUi.textMuted }}>
              Mismo editor que pre-brief y narrativa: negritas, listas, tablas y checkboxes. El
              cliente lo ve igual en el enlace de aceptación.
            </p>
          </div>

          {!isLocked && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={restoreTemplate}
                className="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors hover:bg-neutral-50"
                style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
              >
                Volver al modelo original
              </button>
              {saving && (
                <span className="text-[11px] ml-auto" style={{ color: brandUi.blue }}>
                  Guardando…
                </span>
              )}
            </div>
          )}

          {isLocked ? (
            <div
              className="phase-doc-html max-w-none rounded-lg border p-4 bg-white"
              style={{ borderColor: brandUi.border }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <RichTextEditor
              value={html}
              ariaLabel="Texto del contrato"
              placeholder="Completá el contrato…"
              frameVariant="client"
              onChange={persistDraft}
              onBlur={() => void saveDraft()}
            />
          )}

          {!isLocked && (
            <label className="block">
              <span
                className="text-[9px] font-medium uppercase tracking-widest"
                style={{ color: brandUi.textFaint }}
              >
                Nota personalizada (mail)
              </span>
              <textarea
                className="mt-1 w-full rounded border p-2 text-sm min-h-[72px]"
                style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
                placeholder="Ej: Con mucho cariño para este proceso…"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
              />
            </label>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {!isLocked && (
              <>
                <Button variant="ghost" onClick={() => setShowPreview((v) => !v)}>
                  {showPreview ? "Ocultar vista previa" : "Vista previa (como la ve el cliente)"}
                </Button>
                <Button variant="secondary" disabled={saving} onClick={() => void saveDraft()}>
                  {saving ? "Guardando…" : "Guardar borrador"}
                </Button>
                <Button
                  variant="primary"
                  disabled={sending || !html.trim()}
                  onClick={() => void sendContract()}
                >
                  {sending ? "Enviando…" : "Enviar contrato →"}
                </Button>
              </>
            )}
          </div>

          {showPreview && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
                Así verá el contrato al abrir el enlace del mail (no va el texto completo en el correo).
              </p>
              <div
                className="phase-doc-html max-w-none rounded-lg border p-4 bg-white"
                style={{ borderColor: brandUi.border }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          )}

          {message && (
            <p className="text-xs" style={{ color: brandUi.textMuted }}>
              {message}
            </p>
          )}
          {lastLink && (
            <p className="text-[10px] break-all" style={{ color: brandUi.blue }}>
              {lastLink}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
