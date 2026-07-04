import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, { bg: string; color: string; border: string }> = {
  primary: { bg: "#F03172", color: "#fff", border: "#F03172" },
  secondary: { bg: "#0D0D0D", color: "#fff", border: "#0D0D0D" },
  ghost: { bg: "transparent", color: "#0D0D0D", border: "rgba(13,13,13,0.18)" },
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
