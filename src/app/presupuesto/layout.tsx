import type { ReactNode } from "react";

/** Presupuesto público — misma tipografía que portales /cliente. */
export default function PresupuestoLayout({ children }: { children: ReactNode }) {
  return <div className="font-sans text-brand-navy antialiased">{children}</div>;
}
