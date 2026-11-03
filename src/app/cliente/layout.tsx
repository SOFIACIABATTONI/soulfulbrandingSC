import type { ReactNode } from "react";

/** Circuito cliente: hereda tipografía de marca del layout raíz (Helvetica + EB Garamond). */
export default function ClienteLayout({ children }: { children: ReactNode }) {
  return <div className="font-sans text-brand-navy antialiased">{children}</div>;
}
