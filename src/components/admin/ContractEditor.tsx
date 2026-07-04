"use client";

import { useCallback, useEffect, useState } from "react";
import { QuoteFormattedBody } from "@/components/quote/QuoteFormattedBody";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Topbar } from "@/components/admin/ui/Topbar";
import {
  CONTRACT_STATUS_LABELS,
  type ContractContent,
  type ContractStatus,
} from "@/lib/contract-types";
import { brandUi } from "@/lib/brand-ui";

type ContractEditorProps = {
  projectId: string;
  clientName: string;
  projectTitle: string;
};

type ContractData = {
  content: ContractContent;
  status: ContractStatus;
  statusLabel: string;
  contractSentAt: string | null;
  contractAcceptedAt: string | null;
  client: { name: string; email: string; company: string };
};

export function ContractEditor({
  projectId,
  clientName,
  projectTitle,
}: ContractEditorProps) {
  const [data, setData] = useState<ContractData | null>(null);
  const [body, setBody] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/projects-erp/${projectId}/contract`, {
      credentials: "include",
    });
    if (res.ok) {
      const j = (await res.json()) as ContractData;
      setData(j);
      setBody(j.content.body ?? "");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isLocked = data?.status === "aceptado";
  const canEdit = data?.status === "borrador" || data?.status === "enviado";

  async function saveDraft() {
    if (!canEdit || isLocked) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/contract`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { body: body.trim(), format: "markdown" as const },
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

  async function sendContract() {
    if (isLocked) return;
    setSending(true);
    setMessage(null);
    setLastLink(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/contract/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { body: body.trim(), format: "markdown" as const },
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

  if (loading) {
    return (
      <Card id="contrato" className="mb-8">
        <Topbar title="Contrato" subtitle={`${clientName} · ${projectTitle}`} />
        <p className="text-xs" style={{ color: brandUi.textMuted }}>
          Cargando…
        </p>
      </Card>
    );
  }

  const status = data?.status ?? "borrador";
  const editorLabel = editorOpen
    ? "Ocultar contrato"
    : isLocked
      ? "Ver contrato"
      : "Editar contrato";

  return (
    <Card id="contrato" className="mb-8">
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
            <p style={{ color: brandUi.textFaint }}>Borrador — aún no enviado al cliente</p>
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

      {editorOpen && (
        <div
          className="mt-4 pt-4 border-t grid grid-cols-1 lg:grid-cols-2 gap-4"
          style={{ borderColor: brandUi.border }}
        >
          <div className="space-y-3">
            <label className="block">
              <span
                className="text-[9px] font-medium uppercase tracking-widest"
                style={{ color: brandUi.textFaint }}
              >
                Texto del contrato (Markdown)
              </span>
              <textarea
                className="mt-1 w-full rounded border p-3 text-sm font-mono leading-relaxed min-h-[320px]"
                style={{
                  borderColor: brandUi.borderStrong,
                  background: isLocked ? brandUi.navySoft : brandUi.surface,
                  color: brandUi.text,
                }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isLocked}
                readOnly={isLocked}
              />
            </label>

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
                    {showPreview ? "Ocultar vista previa" : "Vista previa"}
                  </Button>
                  <Button variant="secondary" disabled={saving} onClick={() => void saveDraft()}>
                    {saving ? "Guardando…" : "Guardar borrador"}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={sending || !body.trim()}
                    onClick={() => void sendContract()}
                  >
                    {sending ? "Enviando…" : "Enviar contrato →"}
                  </Button>
                </>
              )}
            </div>

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

          {showPreview && (
            <div
              className="rounded-lg border p-4 min-h-[320px] overflow-auto bg-white"
              style={{ borderColor: brandUi.border }}
            >
              <QuoteFormattedBody body={body} format="markdown" theme="light" />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
