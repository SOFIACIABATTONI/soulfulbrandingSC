"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { brandUi } from "@/lib/brand-ui";

function SbSection({ label }: { label: string }) {
  return (
    <div
      className="px-4 pt-4 pb-1 text-[8px] font-medium uppercase tracking-[0.14em]"
      style={{ color: brandUi.textFaint }}
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
        background: active ? brandUi.accentSoft : "transparent",
        color: active ? brandUi.accent : brandUi.textMuted,
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
          style={{ background: brandUi.accent }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

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
      className="flex flex-col h-full overflow-y-auto flex-shrink-0 border-r"
      style={{ width: 216, background: brandUi.surface, borderColor: brandUi.border }}
    >
      <Link
        href="/admin"
        className="px-4 py-5 flex-shrink-0 block transition-opacity hover:opacity-90"
        style={{
          borderBottom: `1px solid ${brandUi.border}`,
          background: `linear-gradient(180deg, ${brandUi.accentSoft} 0%, ${brandUi.surface} 72%)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/soulful-branding.svg"
          alt="Soulful Branding®"
          width={894}
          height={112}
          className="h-[18px] w-full max-w-[168px] object-contain object-left"
          decoding="async"
        />
        <div
          className="text-[8px] font-medium uppercase tracking-[0.16em] mt-2.5"
          style={{ color: brandUi.accent }}
        >
          Panel admin
        </div>
      </Link>

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

      <div
        className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
        style={{ borderTop: `1px solid ${brandUi.border}` }}
      >
        <div
          className="flex-shrink-0 rounded-md px-1.5 py-1 flex items-center justify-center"
          style={{ background: brandUi.text }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logoclaro.png"
            alt="SO — Soulful Branding"
            width={320}
            height={72}
            className="block h-5 w-auto max-w-[52px] object-contain"
            decoding="async"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] truncate" style={{ color: brandUi.textMuted }}>
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
      style={{ color: brandUi.textFaint, background: "none", border: "none", cursor: "pointer" }}
      title="Cerrar sesión"
    >
      Salir
    </button>
  );
}
