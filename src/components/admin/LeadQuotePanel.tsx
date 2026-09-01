"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QuoteFormattedBody } from "@/components/quote/QuoteFormattedBody";
import {
  CLIENT_RESPONSE_LABELS,
  QUOTE_STATUS_LABELS,
  normalizeQuoteContent,
  type QuoteContent,
  type QuoteContentFormat,
} from "@/lib/quote-types";
import type { Lead } from "@prisma/client";
import {
  QUOTE_PROPOSAL_TEMPLATES,
  buildQuoteContentForProposal,
  defaultProposalIdForLead,
  getQuoteProposalTemplate,
  resolveProposalIdFromContent,
  type QuoteProposalTemplate,
} from "@/lib/quote-proposal-templates";
import type { QuoteProposalId } from "@/lib/quote-types";
import { bbbDeckSlideCount, isBbbDeckFormat } from "@/lib/quote-bbb-deck";
import { isQuotePdfFormat } from "@/lib/quote-proposal-pdfs";
import { ConfirmDialog } from "./ui/ConfirmDialog";

type PendingConfirm = "send" | "delete" | null;

type QuoteRow = {
  id: string;
  leadId: string;
  status: string;
  content: unknown;
  clientResponse: string | null;
  clientComment: string;
  expiresAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type LeadQuotePanelProps = {
  leadId: string;
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">;
  clientId?: string | null;
};

export function LeadQuotePanel({ leadId, lead, clientId = null }: LeadQuotePanelProps) {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [format, setFormat] = useState<QuoteContentFormat>("pdf");
  const [pdfUrl, setPdfUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [total, setTotal] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(clientId ?? null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<QuoteProposalId>(() =>
    defaultProposalIdForLead(lead),
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${leadId}/quotes`, {
      credentials: "include",
    });
    if (res.ok) {
      const j = (await res.json()) as { items: QuoteRow[] };
      setQuotes(j.items);
      if (!activeId && j.items[0]) {
        setActiveId(j.items[0].id);
        applyContent(normalizeQuoteContent(j.items[0].content));
      }
    }
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    setResolvedClientId(clientId ?? null);
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (resolvedClientId || loading) return;
    const hasApproved = quotes.some((q) => q.status === "aprobado");
    if (!hasApproved) return;
    void fetch(`/api/admin/leads/${leadId}/ensure-client`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((j: { clientId?: string } | null) => {
        if (j?.clientId) setResolvedClientId(j.clientId);
      })
      .catch(() => undefined);
  }, [resolvedClientId, loading, quotes, leadId]);

  const active = quotes.find((q) => q.id === activeId) ?? null;

  function applyContent(c: QuoteContent) {
    setBody(c.body ?? "");
    setFormat(c.format ?? "markdown");
    setPdfUrl(c.pdfUrl ?? "");
    setVideoUrl(c.videoUrl ?? "");
    setTotal(c.total != null ? String(c.total) : "");
    setSelectedProposalId(resolveProposalIdFromContent(c));
  }

  function applyProposalTemplate(template: QuoteProposalTemplate) {
    setSelectedProposalId(template.id);
    applyContent(template.buildContent(lead));
    setEditorOpen(true);
    setMessage(null);
    setLastLink(null);
  }

  const isDeck = isBbbDeckFormat(format);
  const isPdf = isQuotePdfFormat(format);

  function selectQuote(q: QuoteRow) {
    setActiveId(q.id);
    applyContent(normalizeQuoteContent(q.content));
    setMessage(null);
    setLastLink(null);
  }

  function buildContentPayload(): QuoteContent {
    const base = buildQuoteContentForProposal(selectedProposalId, lead);
    const totalNum = total.trim() ? Number(total) : undefined;
    return {
      ...base,
      body: body.trim() || base.body,
      ...(pdfUrl.trim() && isQuotePdfFormat(base.format) ? { pdfUrl: pdfUrl.trim() } : {}),
      ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
      ...(totalNum != null ? { total: totalNum, currency: "EUR" } : {}),
    };
  }

  async function createQuote() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/leads/${leadId}/quotes`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId: selectedProposalId }),
    });
    setSaving(false);
    if (res.ok) {
      const j = (await res.json()) as { item: QuoteRow; publicToken?: string };
      await load();
      setActiveId(j.item.id);
      selectQuote(j.item);
      setEditorOpen(true);
      if (j.publicToken) {
        setMessage(`Borrador creado. Token de prueba (solo dev): ${j.publicToken}`);
      }
    } else {
      let msg = "No se pudo crear el presupuesto.";
      try {
        const j = (await res.json()) as { error?: string; details?: string };
        if (j.error) msg = j.error;
        if (res.status === 500 && !j.error) {
          msg =
            "Error del servidor. Probablemente falta aplicar la migración (npx prisma migrate deploy) y reiniciar npm run dev.";
        }
      } catch {
        /* ignore */
      }
      setMessage(msg);
    }
  }

  async function saveDraft() {
    if (!active || active.status !== "borrador") return;
    setSaving(true);
    setMessage(null);
    const content = buildContentPayload();
    const res = await fetch(`/api/admin/leads/${leadId}/quotes/${active.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Borrador guardado.");
      await load();
    } else {
      setMessage("No se pudo guardar.");
    }
  }

  async function sendQuote() {
    if (!active || active.status !== "borrador") return;
    await saveDraft();
    setSending(true);
    setMessage(null);
    setLastLink(null);
    const res = await fetch(
      `/api/admin/leads/${leadId}/quotes/${active.id}/send`,
      { method: "POST", credentials: "include" },
    );
    setSending(false);
    if (res.ok) {
      const j = (await res.json()) as {
        emailed: boolean;
        publicUrl?: string;
        publicToken?: string;
      };
      await load();
      if (j.publicUrl) setLastLink(j.publicUrl);
      setMessage(
        j.emailed
          ? "Presupuesto enviado por correo."
          : "Marcado como enviado. Revisá Resend (API key / FROM) — el link quedó abajo.",
      );
      if (j.publicToken) {
        setLastLink(
          (prev) => prev ?? `${window.location.origin}/presupuesto/${j.publicToken}`,
        );
      }
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo enviar.");
    }
  }

  async function deleteDraft() {
    if (!active || active.status !== "borrador") return;
    const res = await fetch(`/api/admin/leads/${leadId}/quotes/${active.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setActiveId(null);
      setBody("");
      setFormat("pdf");
      setPdfUrl("");
      setVideoUrl("");
      setTotal("");
      setSelectedProposalId(defaultProposalIdForLead(lead));
      await load();
      setMessage("Borrador eliminado.");
    }
  }

  async function handleConfirmAction() {
    if (pendingConfirm === "send") {
      setPendingConfirm(null);
      await sendQuote();
      return;
    }
    if (pendingConfirm === "delete") {
      setPendingConfirm(null);
      await deleteDraft();
    }
  }

  const activeProposal = getQuoteProposalTemplate(
    active ? resolveProposalIdFromContent(normalizeQuoteContent(active.content)) : selectedProposalId,
  );

  if (loading) {
    return (
      <p className="text-sm" style={{ color: "rgba(13,13,13,0.42)" }}>
        Cargando presupuestos…
      </p>
    );
  }

  return (
    <div
      className="rounded border bg-white p-5 mt-6"
      style={{ borderColor: "rgba(13,13,13,0.1)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p
          className="text-[9px] font-medium uppercase tracking-widest"
          style={{ color: "rgba(13,13,13,0.42)" }}
        >
          Presupuesto (ERP)
        </p>
        <button
          type="button"
          onClick={() => void createQuote()}
          disabled={saving}
          className="rounded px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          style={{ background: "#F03172" }}
        >
          + Nuevo borrador
        </button>
      </div>

      <div className="mb-5">
        <p className="text-[9px] font-medium uppercase tracking-widest mb-2" style={{ color: "rgba(13,13,13,0.42)" }}>
          Elegí la propuesta a enviar
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUOTE_PROPOSAL_TEMPLATES.map((template) => {
            const selected = selectedProposalId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setSelectedProposalId(template.id);
                  if (active?.status === "borrador") {
                    applyProposalTemplate(template);
                  }
                }}
                className="rounded-lg border px-3 py-3 text-left transition hover:border-[#F03172]/40"
                style={{
                  borderColor: selected ? "#F03172" : "rgba(13,13,13,0.12)",
                  background: selected ? "rgba(240,49,114,0.06)" : "#fff",
                }}
              >
                <p className="text-sm font-medium" style={{ color: "#131945" }}>
                  {template.label}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "rgba(19,25,69,0.55)" }}>
                  {template.description}
                </p>
                {template.id === "born-and-be" && (
                  <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "rgba(19,25,69,0.55)" }}>
                    {bbbDeckSlideCount("bbb-deck-ht-2026")} diapositivas JPG — no hace falta PDF.
                  </p>
                )}
              </button>
            );
          })}
        </div>
        {(!active || active.status === "borrador") && (
          <button
            type="button"
            onClick={() => applyProposalTemplate(getQuoteProposalTemplate(selectedProposalId))}
            className="mt-2 text-xs hover:underline"
            style={{ color: "#323FF6" }}
          >
            Cargar plantilla «{getQuoteProposalTemplate(selectedProposalId).label}»
            {active?.status === "borrador" ? " en este borrador" : ""}
          </button>
        )}
      </div>

      {quotes.length === 0 ? (
        <p className="text-sm" style={{ color: "rgba(13,13,13,0.5)" }}>
          Sin presupuestos. Elegí una propuesta arriba y tocá «+ Nuevo borrador» para armarla y enviarla al cliente.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {quotes.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => selectQuote(q)}
                className="rounded border px-2 py-1 text-[10px] uppercase tracking-wide"
                style={{
                  borderColor: activeId === q.id ? "#F03172" : "rgba(13,13,13,0.15)",
                  background: activeId === q.id ? "rgba(240,49,114,0.08)" : "#fff",
                  color: "#0D0D0D",
                }}
              >
                {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                {" · "}
                {getQuoteProposalTemplate(resolveProposalIdFromContent(normalizeQuoteContent(q.content))).label}
                {" · "}
                {new Date(q.createdAt).toLocaleDateString("es-AR")}
              </button>
            ))}
          </div>

          {active && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span
                  className="rounded px-2 py-0.5 font-medium uppercase tracking-wide"
                  style={{
                    background: "rgba(50,63,246,0.08)",
                    color: "#323FF6",
                  }}
                >
                  {QUOTE_STATUS_LABELS[active.status] ?? active.status}
                </span>
                <span
                  className="rounded px-2 py-0.5 font-medium"
                  style={{ background: "rgba(240,49,114,0.08)", color: "#F03172" }}
                >
                  {activeProposal.label}
                </span>
                {active.clientResponse && (
                  <span style={{ color: "#131945" }}>
                    Cliente: {CLIENT_RESPONSE_LABELS[active.clientResponse] ?? active.clientResponse}
                    {active.clientComment ? (" — " + active.clientComment) : ""}
                  </span>
                )}
                {!active.clientResponse && active.clientComment && (
                  <span style={{ color: "rgba(19,25,69,0.55)" }}>
                    — {active.clientComment}
                  </span>
                )}
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t"
                style={{ borderColor: "rgba(19,25,69,0.1)" }}
              >
                <div className="text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                  {active.sentAt && (
                    <span>
                      Enviado {new Date(active.sentAt).toLocaleDateString("es-AR")}
                      {active.viewedAt &&
                        (" · Visto " + new Date(active.viewedAt).toLocaleDateString("es-AR"))}
                    </span>
                  )}
                  {!active.sentAt && active.status === "borrador" && (
                    <span>Borrador — aún no enviado</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditorOpen((v) => !v)}
                  className="text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity"
                  style={{ color: "#F03172", background: "none", border: "none", cursor: "pointer" }}
                  aria-expanded={editorOpen}
                >
                  {active.status === "borrador" ? "Ver / editar presupuesto" : "Ver presupuesto completo"}{" "}
                  {editorOpen ? "↑" : "↓"}
                </button>
              </div>

              {editorOpen && (active.status === "borrador" ? (
                <>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(13,13,13,0.5)" }}>
                    {isPdf
                      ? `El cliente verá el PDF «${activeProposal.label}» en el link del mail. Ingresá el total acordado abajo antes de enviar.`
                      : isDeck
                        ? `Deck JPG «${activeProposal.label}» (${bbbDeckSlideCount(format)} diapositivas). Ingresá el total acordado abajo antes de enviar.`
                        : `Propuesta «${activeProposal.label}». Ingresá el total acordado abajo.`}
                  </p>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-end">
                      <label className="block text-[9px] uppercase tracking-widest max-w-[200px]">
                        <span style={{ color: "rgba(13,13,13,0.42)" }}>Total EUR</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full mt-1 rounded border px-3 py-2 text-sm"
                          placeholder="Monto acordado con el cliente"
                          value={total}
                          onChange={(e) => setTotal(e.target.value)}
                        />
                      </label>
                      {isPdf && pdfUrl ? (
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium hover:underline"
                          style={{ color: "#323FF6" }}
                        >
                          Ver PDF fuente →
                        </a>
                      ) : null}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[9px] font-medium uppercase tracking-widest"
                          style={{ color: "rgba(13,13,13,0.42)" }}
                        >
                          Vista previa (como la ve el cliente)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPreview((v) => !v)}
                          className="text-[10px] hover:underline"
                          style={{ color: "#323FF6" }}
                        >
                          {showPreview ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                      {showPreview && (
                        <div
                          className={
                            isDeck || isPdf
                              ? "rounded-lg border overflow-hidden"
                              : "rounded-lg border max-h-[560px] overflow-y-auto px-5 py-6"
                          }
                          style={{
                            background: isDeck || isPdf ? "#FFFFFF" : "#0D0D0D",
                            borderColor: "rgba(13,13,13,0.2)",
                          }}
                        >
                          <QuoteFormattedBody
                            body={body || "…"}
                            format={format}
                            pdfUrl={pdfUrl || undefined}
                            videoUrl={videoUrl || undefined}
                            total={total.trim() ? Number(total) : undefined}
                            currency="EUR"
                            deckVariant="preview"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => void saveDraft()}
                      disabled={saving}
                      className="rounded px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                      style={{ background: "#0D0D0D" }}
                    >
                      {saving ? "Guardando…" : "Guardar borrador"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingConfirm("send")}
                      disabled={sending || (!isDeck && !isPdf && !body.trim())}
                      className="rounded px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                      style={{ background: "#F03172" }}
                    >
                      {sending ? "Enviando…" : "Enviar por correo →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingConfirm("delete")}
                      className="rounded border px-3 py-2 text-xs"
                      style={{ borderColor: "rgba(13,13,13,0.15)" }}
                    >
                      Eliminar borrador
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className={
                    isBbbDeckFormat(normalizeQuoteContent(active.content).format) ||
                    isQuotePdfFormat(normalizeQuoteContent(active.content).format)
                      ? "rounded-lg border overflow-hidden"
                      : "rounded-lg border px-5 py-6"
                  }
                  style={{
                    background:
                      isBbbDeckFormat(normalizeQuoteContent(active.content).format) ||
                      isQuotePdfFormat(normalizeQuoteContent(active.content).format)
                        ? "#FFFFFF"
                        : "#0D0D0D",
                    borderColor: "rgba(13,13,13,0.15)",
                  }}
                >
                  <QuoteFormattedBody
                    body={normalizeQuoteContent(active.content).body}
                    format={normalizeQuoteContent(active.content).format}
                    pdfUrl={normalizeQuoteContent(active.content).pdfUrl}
                    videoUrl={normalizeQuoteContent(active.content).videoUrl}
                    total={normalizeQuoteContent(active.content).total}
                    currency={normalizeQuoteContent(active.content).currency}
                    deckVariant="preview"
                  />
                </div>
              ))}

              {editorOpen && active.respondedAt && (
                <p className="text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                  Respondido: {new Date(active.respondedAt).toLocaleString("es-AR")}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {message && (
        <p className="text-xs mt-3 rounded px-2 py-1.5" style={{ background: "#F9F3DB", color: "#131945" }}>
          {message}
        </p>
      )}
      {lastLink && (
        <p className="text-xs mt-2 break-all">
          <span style={{ color: "rgba(19,25,69,0.42)" }}>Link cliente: </span>
          <a href={lastLink} style={{ color: "#323FF6" }} target="_blank" rel="noreferrer">
            {lastLink}
          </a>
        </p>
      )}

      {resolvedClientId && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t"
          style={{ borderColor: "rgba(19,25,69,0.1)" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "rgba(19,25,69,0.55)" }}>
            Cliente vinculado — proyectos, contratos y facturas se gestionan en{" "}
            <strong style={{ color: "#131945" }}>Clientes</strong>.
          </p>
          <Link
            href={"/admin/clientes/" + resolvedClientId}
            className="rounded px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
            style={{ background: "#F03172" }}
          >
            Ver ficha de cliente →
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={pendingConfirm === "send"}
        title="Enviar presupuesto"
        description={
          <>
            Se enviará por correo a{" "}
            <strong style={{ color: "#131945" }}>{lead.email}</strong> la propuesta{" "}
            <strong style={{ color: "#131945" }}>{activeProposal.label}</strong> y se generará un
            enlace nuevo para que el cliente la vea.
          </>
        }
        confirmLabel="Enviar presupuesto"
        loading={sending}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setPendingConfirm(null)}
      />

      <ConfirmDialog
        open={pendingConfirm === "delete"}
        title="Eliminar borrador"
        description="Se borrará este borrador del presupuesto. Esta acción no se puede deshacer."
        confirmLabel="Eliminar borrador"
        confirmVariant="danger"
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}
