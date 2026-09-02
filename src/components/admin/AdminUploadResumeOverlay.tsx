"use client";

import { useEffect, useState } from "react";
import { brandUi } from "@/lib/brand-ui";
import {
  ERP_UPLOAD_RELOAD_READY_EVENT,
  hideAdminReloadOverlay,
  peekAdminUploadReloadPending,
  showAdminReloadOverlay,
  type AdminUploadReloadPending,
} from "@/lib/admin-reload-overlay";
import { restoreAdminScrollPositionForPage } from "@/lib/admin-main-scroll";

const READY_FALLBACK_MS = 12_000;
const FADE_MS = 280;

export function AdminUploadResumeOverlay() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [copy, setCopy] = useState<AdminUploadReloadPending | null>(null);

  useEffect(() => {
    const pending = peekAdminUploadReloadPending();
    if (!pending) return;

    setCopy(pending);
    setVisible(true);
    setFading(false);
    showAdminReloadOverlay(
      pending.message || "Archivo guardado",
      pending.detail || "Cargando el proyecto y volviendo a tu etapa…",
    );

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      setFading(true);
      hideAdminReloadOverlay();
      window.setTimeout(() => setVisible(false), FADE_MS);
    };

    const onReady = () => {
      if (!window.location.pathname.includes("/admin/proyectos/")) {
        restoreAdminScrollPositionForPage();
      }
      close();
    };

    window.addEventListener(ERP_UPLOAD_RELOAD_READY_EVENT, onReady);
    const fallback = window.setTimeout(onReady, READY_FALLBACK_MS);

    return () => {
      window.removeEventListener(ERP_UPLOAD_RELOAD_READY_EVENT, onReady);
      window.clearTimeout(fallback);
    };
  }, []);

  if (!visible || !copy) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-6 transition-opacity duration-300"
      style={{
        background: "rgba(242,242,242,0.92)",
        backdropFilter: "blur(6px)",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
      role="alertdialog"
      aria-busy={!fading}
      aria-live="assertive"
    >
      <div
        className="w-full max-w-sm rounded-[20px] border bg-white px-6 py-7 text-center shadow-2xl"
        style={{ borderColor: brandUi.border }}
      >
        <div
          className="mx-auto mb-4 h-11 w-11 rounded-full border-[3px] border-solid animate-spin"
          style={{
            borderColor: "rgba(50,63,246,0.15)",
            borderTopColor: brandUi.blue,
          }}
          aria-hidden
        />
        <p className="text-[15px] font-semibold leading-snug" style={{ color: brandUi.text }}>
          {copy.message || "Archivo guardado"}
        </p>
        <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: brandUi.textMuted }}>
          {copy.detail || "Cargando el proyecto y volviendo a tu etapa…"}
        </p>
      </div>
    </div>
  );
}
