"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ADMIN_PHASE_NAVIGATE_EVENT } from "@/lib/admin-main-scroll";

type LazyPhaseMountProps = {
  /** Clave de fase: onboarding, prebrief, narrativa… */
  phaseKey: string;
  children: ReactNode;
};

/**
 * Monta hijos (paneles con fetch) solo cuando la sección entra en vista
 * o el usuario navega con #fase-{phaseKey}.
 */
export function LazyPhaseMount({ phaseKey, children }: LazyPhaseMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === `#fase-${phaseKey}`;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === `#fase-${phaseKey}`) {
      setMounted(true);
    }
  }, [phaseKey]);

  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px", threshold: 0 },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [mounted]);

  useEffect(() => {
    function onHashChange() {
      if (window.location.hash === `#fase-${phaseKey}`) {
        setMounted(true);
      }
    }
    function onPhaseNavigate(event: Event) {
      const detail = (event as CustomEvent<{ phaseKey?: string }>).detail;
      if (detail?.phaseKey === phaseKey) {
        setMounted(true);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener(ADMIN_PHASE_NAVIGATE_EVENT, onPhaseNavigate);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener(ADMIN_PHASE_NAVIGATE_EVENT, onPhaseNavigate);
    };
  }, [phaseKey]);

  return (
    <div ref={ref}>
      {mounted ? (
        children
      ) : (
        <p
          className="text-xs py-3 text-center rounded-xl border border-dashed"
          style={{ color: "rgba(19,25,69,0.38)", borderColor: "rgba(19,25,69,0.12)" }}
        >
          Herramientas de esta etapa — se cargan al hacer scroll o clic en la card
        </p>
      )}
    </div>
  );
}
