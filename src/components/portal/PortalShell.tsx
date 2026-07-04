"use client";

import type { ReactNode } from "react";
import { brandUi } from "@/lib/brand-ui";

type PortalShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
};

/** Layout minimalista para portales cliente (presupuesto, contrato). */
export function PortalShell({ children, eyebrow, title, subtitle, footer }: PortalShellProps) {
  return (
    <main className="min-h-screen bg-brand-page text-brand-navy font-sans py-10 px-4">
      <article className="max-w-xl mx-auto">
        {(eyebrow || title || subtitle) && (
          <header className="mb-8 text-center">
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
