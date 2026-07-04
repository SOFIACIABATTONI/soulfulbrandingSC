import type { ReactNode } from "react";
import { brandUi } from "@/lib/brand-ui";

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Card({ title, subtitle, children, className = "", id }: CardProps) {
  return (
    <section
      id={id}
      className={`rounded-lg border p-5 shadow-sm ${className}`}
      style={{ borderColor: brandUi.border, background: brandUi.surface }}
    >
      {(title || subtitle) && (
        <header className="mb-4">
          {title && (
            <h2 className="font-serif text-xl italic font-normal" style={{ color: brandUi.text }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-xs" style={{ color: brandUi.textMuted }}>
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
