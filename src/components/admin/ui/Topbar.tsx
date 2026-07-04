import type { ReactNode } from "react";

type TopbarProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b"
      style={{ borderColor: "rgba(13,13,13,0.1)" }}
    >
      <div>
        <p
          className="text-[9px] font-medium uppercase tracking-widest mb-1"
          style={{ color: "rgba(13,13,13,0.42)" }}
        >
          {subtitle ?? "Soulful ERP"}
        </p>
        <h1 className="font-serif text-2xl italic" style={{ color: "#0D0D0D" }}>
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
