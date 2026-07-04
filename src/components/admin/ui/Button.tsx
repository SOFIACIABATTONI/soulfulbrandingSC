import type { ButtonHTMLAttributes, ReactNode } from "react";
import { brandUi } from "@/lib/brand-ui";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, { bg: string; color: string; border: string }> = {
  primary: { bg: brandUi.accent, color: "#fff", border: brandUi.accent },
  secondary: { bg: brandUi.surface, color: brandUi.text, border: brandUi.borderStrong },
  ghost: { bg: "transparent", color: brandUi.text, border: brandUi.borderStrong },
  danger: { bg: "transparent", color: "#b91c1c", border: "rgba(185,28,28,0.35)" },
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  children,
  className = "",
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const v = VARIANTS[variant];
  return (
    <button
      type="button"
      disabled={disabled}
      className={`rounded px-4 py-2 text-xs font-medium uppercase tracking-wider transition-opacity disabled:opacity-40 ${className}`}
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
