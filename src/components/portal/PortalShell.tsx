"use client";

import type { ReactNode } from "react";
import { brandUi } from "@/lib/brand-ui";

type PortalShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  /** default = formularios; wide = decks / documentos visuales a pantalla casi completa */
  layout?: "default" | "wide";
};

/** Layout minimalista para portales cliente (presupuesto, contrato). */
export function PortalShell({
  children,
  eyebrow,
  title,
  subtitle,
  footer,
  layout = "default",
}: PortalShellProps) {
  const isWide = layout === "wide";

  return (
    <main
      className={`min-h-screen bg-brand-page text-brand-navy font-sans ${
        isWide ? "py-6 px-0 sm:py-8 sm:px-4" : "py-10 px-4"
      }`}
    >
      <article
        className={
          isWide ? "w-full max-w-none sm:max-w-5xl lg:max-w-6xl mx-auto" : "max-w-xl mx-auto"
        }
      >
        {(eyebrow || title || subtitle) && (
          <header className={`mb-8 text-center ${isWide ? "px-4 sm:px-0" : ""}`}>
            {eyebrow && (
              <p className="text-[10px] uppercase tracking-[0.25em] mb-3 text-brand-magenta">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="font-serif text-3xl italic font-normal text-brand-navy">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm mt-2" style={{ color: brandUi.textMuted }}>
                {subtitle}
              </p>
            )}
          </header>
        )}
        {children}
        {footer}
      </article>
    </main>
  );
}

export function PortalCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border bg-white px-6 py-8 sm:px-8 shadow-sm ${className}`}
      style={{ borderColor: brandUi.border }}
    >
      {children}
    </div>
  );
}
