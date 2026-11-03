"use client";

import { useCallback, useEffect, useState } from "react";
import type { HtmlPhaseKey } from "@/lib/phase-client-flow";
import { brandUi } from "@/lib/brand-ui";

type PhaseClientPortalLinkProps = {
  projectId: string;
  phaseKey: HtmlPhaseKey | string;
  /** Incrementar tras un envío para volver a cargar el enlace. */
  refreshToken?: number;
  compact?: boolean;
};

export function PhaseClientPortalLink({
  projectId,
  phaseKey,
  refreshToken = 0,
  compact = false,
}: PhaseClientPortalLinkProps) {
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/admin/projects-erp/${projectId}/portal-link?phase=${encodeURIComponent(phaseKey)}`,
      { credentials: "include" },
    );
    setLoading(false);
    if (!res.ok) {
      setPublicUrl(null);
      return;
    }
    const j = (await res.json()) as { publicUrl?: string | null };
    setPublicUrl(j.publicUrl?.trim() || null);
  }, [projectId, phaseKey]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <p className="text-[11px]" style={{ color: brandUi.textFaint }}>
        {compact ? "…" : "Buscando enlace del cliente…"}
      </p>
    );
  }

  if (!publicUrl) {
    return (
      <p className="text-[11px] leading-relaxed" style={{ color: brandUi.textMuted }}>
        {compact
          ? null
          : "Todavía no hay enlace generado. Enviá la identidad al cliente (bloque «Mensaje al cliente» más abajo) para crear el link permanente del portal."}
      </p>
    );
  }

  return (
    <div
      className={`rounded-xl border px-3 py-3 space-y-2 ${compact ? "" : "mt-1"}`}
      style={{ borderColor: brandUi.border, background: brandUi.surface }}
    >
      <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
        Enlace del cliente (portal)
      </p>
      <p className="text-[11px] leading-relaxed" style={{ color: brandUi.textMuted }}>
        Mismo link que recibe por mail. No vence: podés reenviarlo o copiarlo cuando quieras.
      </p>
      <a
        href={publicUrl}
        target="_blank"
        rel="noreferrer"
        className="block text-[11px] break-all hover:underline"
        style={{ color: brandUi.blue }}
      >
        {publicUrl}
      </a>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="rounded-full border px-3 py-1 text-[10px] font-medium"
        style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
      >
        {copied ? "Copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}
