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
  buildBornAndBeDeckContent,
  buildMarkdownQuoteContent,
} from "@/lib/quote-default-content";
import { isBbbDeckFormat } from "@/lib/quote-bbb-deck";
import { buildPresupuestoMarkdown } from "@/lib/quote-templates";

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
  const [format, setFormat] = useState<QuoteContentFormat>("bbb-deck-2026");
  const [videoUrl, setVideoUrl] = useState("");
  const [total, setTotal] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(clientId ?? null);

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
    setVideoUrl(c.videoUrl ?? "");
    setTotal(c.total != null ? String(c.total) : "");
  }

  const isDeck = isBbbDeckFormat(format);

  function selectQuote(q: QuoteRow) {
    setActiveId(q.id);
    applyContent(normalizeQuoteContent(q.content));
    setMessage(null);
    setLastLink(null);
  }

  function buildContentPayload(): QuoteContent {
    const deck = isBbbDeckFormat(format);
    const totalNum = total.trim() ? Number(total) : undefined;
    if (deck) {
      const base = buildBornAndBeDeckContent(lead);
      return {
        format: "bbb-deck-2026",
        body: base.body,
        videoUrl: videoUrl.trim() || undefined,
        total: totalNum ?? base.total,
        currency: "USD",
      };
    }
    return {
      format: "markdown",
      body: body.trim(),
      videoUrl: videoUrl.trim() || undefined,
      ...(totalNum != null ? { total: totalNum, currency: "USD" } : {}),
    };
  }

  async function createQuote() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/leads/${leadId}/quotes`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
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
    if (!confirm("¿Enviar presupuesto por correo al cliente? Se generará un enlace nuevo."))
      return;
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
    if (!confirm("¿Eliminar este borrador?")) return;
    const res = await fetch(`/api/admin/leads/${leadId}/quotes/${active.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setActiveId(null);
      setBody("");
      setFormat("bbb-deck-2026");
      setVideoUrl("");
      setTotal("");
      await load();
      setMessage("Borrador eliminado.");
    }
  }

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

      {quotes.length === 0 ? (
        <p className="text-sm" style={{ color: "rgba(13,13,13,0.5)" }}>
          Sin presupuestos. Creá un borrador para armar la propuesta y enviarla al cliente.
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
                    {isDeck
                      ? "Plantilla Born & Be (12 diapositivas JPG). El cliente ve el deck en el link; el correo incluye el botón a la propuesta completa."
                      : "Carta en Markdown editable. El cliente recibe el mismo diseño en negro por mail y en el link."}
                  </p>
                  <div className={isDeck ? "space-y-4" : "grid grid-cols-1 xl:grid-cols-2 gap-4"}>
                    {!isDeck && (
                      <div className="space-y-3">
                        <textarea
                          className="w-full rounded border px-3 py-2 text-sm font-mono leading-relaxed resize-y"
                          style={{
                            borderColor: "rgba(50,63,246,0.4)",
                            minHeight: 280,
                            color: "#0D0D0D",
                          }}
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          spellCheck
                        />
                        <button
                          type="button"
                          onClick={() => setBody(buildPresupuestoMarkdown(lead))}
                          className="text-xs hover:underline"
                          style={{ color: "#323FF6" }}
                        >
                          Restaurar plantilla Markdown
                        </button>
                      </div>
                    )}
                    {isDeck && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            const c = buildBornAndBeDeckContent(lead);
                            applyContent(c);
                          }}
                          className="hover:underline"
                          style={{ color: "#323FF6" }}
                        >
                          Restaurar deck Born & Be
                        </button>
                        <span style={{ color: "rgba(13,13,13,0.25)" }}>|</span>
                        <button
                          type="button"
                          onClick={() => {
                            const c = buildMarkdownQuoteContent(lead);
                            applyContent(c);
                          }}
                          className="hover:underline"
                          style={{ color: "#323FF6" }}
                        >
                          Cambiar a carta Markdown
                        </button>
                      </div>
                    )}
                    <div className="space-y-3">
                      {!isDeck && (
                        <label className="block text-[9px] uppercase tracking-widest">
                          <span style={{ color: "rgba(13,13,13,0.42)" }}>
                            Video (YouTube o Vimeo) — opcional
                          </span>
                          <input
                            type="url"
                            className="w-full mt-1 rounded border px-3 py-2 text-sm font-sans"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                          />
                        </label>
                      )}
                      <label className="block text-[9px] uppercase tracking-widest max-w-[200px]">
                        <span style={{ color: "rgba(13,13,13,0.42)" }}>
                          Total USD {isDeck ? "(referencia; slide 10 fija)" : "(opcional)"}
                        </span>
                        <input
                          type="number"
                          className="w-full mt-1 rounded border px-3 py-2 text-sm"
                          value={total}
                          onChange={(e) => setTotal(e.target.value)}
                        />
                      </label>
                      {!isDeck && (
                        <button
                          type="button"
                          onClick={() => {
                            const c = buildBornAndBeDeckContent(lead);
                            applyContent(c);
                          }}
                          className="text-xs hover:underline"
                          style={{ color: "#323FF6" }}
                        >
                          Usar deck Born & Be
                        </button>
                      )}
                    </div>
                    <div className={isDeck ? "" : ""}>
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
                          className="rounded-lg border max-h-[560px] overflow-y-auto"
                          style={{
                            background: "#0D0D0D",
                            borderColor: "rgba(13,13,13,0.2)",
                            padding: isDeck ? 0 : undefined,
                          }}
                        >
                          <div className={isDeck ? "" : "px-5 py-6"}>
                            <QuoteFormattedBody
                              body={body || "…"}
                              format={format}
                              videoUrl={videoUrl || undefined}
                              total={total.trim() ? Number(total) : undefined}
                              currency="USD"
                            />
                          </div>
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
                      onClick={() => void sendQuote()}
                      disabled={sending || (!isDeck && !body.trim())}
                      className="rounded px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                      style={{ background: "#F03172" }}
                    >
                      {sending ? "Enviando…" : "Enviar por correo →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteDraft()}
                      className="rounded border px-3 py-2 text-xs"
                      style={{ borderColor: "rgba(13,13,13,0.15)" }}
                    >
                      Eliminar borrador
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="rounded-lg border px-5 py-6"
                  style={{ background: "#0D0D0D", borderColor: "rgba(13,13,13,0.15)" }}
                >
                  <QuoteFormattedBody
                    body={normalizeQuoteContent(active.content).body}
                    format={normalizeQuoteContent(active.content).format}
                    videoUrl={normalizeQuoteContent(active.content).videoUrl}
                    total={normalizeQuoteContent(active.content).total}
                    currency={normalizeQuoteContent(active.content).currency}
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
    </div>
  );
}
