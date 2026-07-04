import type { ReactNode } from "react";
import { brandUi } from "@/lib/brand-ui";

type TopbarProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b"
      style={{ borderColor: brandUi.border }}
    >
      <div>
        <p
          className="text-[9px] font-medium uppercase tracking-widest mb-1"
          style={{ color: brandUi.textFaint }}
        >
          {subtitle ?? "Soulful ERP"}
        </p>
        <h1 className="font-serif text-2xl italic font-normal" style={{ color: brandUi.text }}>
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
