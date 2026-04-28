"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// ── helpers ────────────────────────────────────────────────
function SbSection({ label }: { label: string }) {
  return (
    <div
      className="px-4 pt-4 pb-1 text-[8px] font-medium uppercase tracking-[0.14em]"
      style={{ color: "rgba(255,255,255,0.18)" }}
    >
      {label}
    </div>
  );
}

function SbItem({
  href,
  label,
  badge,
  active,
}: {
  href: string;
  label: string;
  badge?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 mx-2 px-3 py-2 rounded text-[11px] tracking-[0.02em] transition-all"
      style={{
        background: active ? "rgba(240,49,114,0.2)" : "transparent",
        color: active ? "#F03172" : "rgba(255,255,255,0.38)",
      }}
    >
      <span
        className="w-1 h-1 rounded-full flex-shrink-0"
        style={{ background: "currentColor", opacity: 0.6 }}
      />
      {label}
      {badge != null && badge > 0 && (
        <span
          className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
          style={{ background: "#F03172" }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

// ── componente principal ───────────────────────────────────
export function AdminSidebar() {
  const pathname = usePathname();
  const [newMsgCount, setNewMsgCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/contact-messages", { credentials: "include" })
      .then((r) => r.json())
      .then((j: { items: { status: string }[] }) => {
        setNewMsgCount(j.items?.filter((m) => m.status === "nuevo").length ?? 0);
      })
      .catch(() => null);
  }, []);

  function active(base: string) {
    return pathname === base || pathname.startsWith(base + "/");
  }

  return (
    <div
      className="flex flex-col h-full overflow-y-auto flex-shrink-0"
      style={{ width: 216, background: "#0D0D0D" }}
    >
      {/* Logo */}
      <div
        className="px-4 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="font-serif text-sm italic"
          style={{ color: "#F9F3DB" }}
        >
          Soulful Branding<sup className="text-[8px] not-italic" style={{ color: "#F03172" }}>®</sup>
        </div>
        <div
          className="text-[8px] uppercase tracking-[0.16em] mt-1"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          Panel admin
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        <SbSection label="CRM" />
        <SbItem href="/admin/leads" label="Leads" badge={newMsgCount} active={active("/admin/leads")} />
        <SbItem href="/admin/clientes" label="Clientes" active={active("/admin/clientes")} />

        <SbSection label="Proyectos" />
        <SbItem href="/admin/proyectos" label="Proyectos" active={active("/admin/proyectos")} />
        <SbItem href="/admin/facturas" label="Facturas" active={active("/admin/facturas")} />

        <SbSection label="Portfolio público" />
        <SbItem href="/admin/projects" label="Trabajos publicados" active={active("/admin/projects")} />
        <SbItem href="/admin/content" label="Contenido del sitio" active={active("/admin/content")} />

        <SbSection label="Vistas" />
        <SbItem href="/admin" label="Dashboard" active={pathname === "/admin"} />
        <SbItem href="/" label="Ver sitio →" active={false} />
      </nav>

      {/* Footer */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-serif text-xs"
          style={{ background: "#F03172", color: "#fff" }}
        >
          S
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
            Sofia Ciabattoni
          </div>
        </div>
        <LogoutSbButton />
      </div>
    </div>
  );
}

function LogoutSbButton() {
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/admin/login";
  }
  return (
    <button
      onClick={() => void handleLogout()}
      className="text-[9px] uppercase tracking-wider hover:opacity-80 transition-opacity"
      style={{ color: "rgba(255,255,255,0.22)", background: "none", border: "none", cursor: "pointer" }}
      title="Cerrar sesión"
    >
      Salir
    </button>
  );
}
