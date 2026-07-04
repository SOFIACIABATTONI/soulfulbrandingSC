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
      <Card title="Contrato" subtitle="Cargando…">
        <p className="text-xs" style={{ color: "rgba(13,13,13,0.45)" }}>
          Preparando editor…
        </p>
      </Card>
    );
  }

  const status = data?.status ?? "borrador";

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
                    ? "rgba(240,49,114,0.1)"
                    : "rgba(13,13,13,0.06)",
              color:
                status === "aceptado"
                  ? "#1a6b1a"
                  : status === "enviado"
                    ? "#F03172"
                    : "rgba(13,13,13,0.5)",
            }}
          >
            {CONTRACT_STATUS_LABELS[status]}
          </span>
        }
      />

      {data?.contractAcceptedAt && (
        <p className="text-xs mb-4" style={{ color: "#1a6b1a" }}>
          Aceptado el{" "}
          {new Date(data.contractAcceptedAt).toLocaleString("es-AR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block">
            <span
              className="text-[9px] font-medium uppercase tracking-widest"
              style={{ color: "rgba(13,13,13,0.42)" }}
            >
              Texto del contrato (Markdown)
            </span>
            <textarea
              className="mt-1 w-full rounded border p-3 text-sm font-mono leading-relaxed min-h-[320px]"
              style={{
                borderColor: "rgba(13,13,13,0.15)",
                background: isLocked ? "rgba(13,13,13,0.04)" : "#fff",
                color: "#0D0D0D",
              }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isLocked}
            />
          </label>

          {!isLocked && (
            <label className="block">
              <span
                className="text-[9px] font-medium uppercase tracking-widest"
                style={{ color: "rgba(13,13,13,0.42)" }}
              >
                Nota personalizada (mail)
              </span>
              <textarea
                className="mt-1 w-full rounded border p-2 text-sm min-h-[72px]"
                style={{ borderColor: "rgba(13,13,13,0.15)", background: "#fff" }}
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
                <Button variant="primary" disabled={sending || !body.trim()} onClick={() => void sendContract()}>
                  {sending ? "Enviando…" : "Enviar contrato →"}
                </Button>
              </>
            )}
          </div>

          {message && (
            <p className="text-xs" style={{ color: "rgba(13,13,13,0.65)" }}>
              {message}
            </p>
          )}
          {lastLink && (
            <p className="text-[10px] break-all" style={{ color: "#323FF6" }}>
              {lastLink}
            </p>
          )}
        </div>

        {showPreview && (
          <div
            className="rounded border p-4 min-h-[320px] overflow-auto"
            style={{ borderColor: "rgba(13,13,13,0.1)", background: "#0D0D0D" }}
          >
            <QuoteFormattedBody
              body={body}
              format="markdown"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
