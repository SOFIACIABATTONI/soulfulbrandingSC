import type { ReactNode } from "react";

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
      className={`rounded border p-5 ${className}`}
      style={{ borderColor: "rgba(13,13,13,0.12)", background: "#F9F3DB" }}
    >
      {(title || subtitle) && (
        <header className="mb-4">
          {title && (
            <h2 className="font-serif text-xl italic" style={{ color: "#0D0D0D" }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-xs" style={{ color: "rgba(13,13,13,0.45)" }}>
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
