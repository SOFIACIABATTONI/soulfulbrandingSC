"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { brandUi } from "@/lib/brand-ui";

const SIDEBAR_SECTIONS_KEY = "erp-admin-sidebar-sections";

type NavItem = {
  href: string;
  label: string;
  badge?: number;
  /** Solo coincide con la ruta exacta (p. ej. Dashboard). */
  exact?: boolean;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "crm",
    label: "CRM",
    items: [
      { href: "/admin/leads", label: "Leads" },
      { href: "/admin/clientes", label: "Clientes" },
    ],
  },
  {
    id: "proyectos",
    label: "Proyectos",
    items: [
      { href: "/admin/proyectos", label: "Proyectos" },
      { href: "/admin/facturas", label: "Facturas" },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio público",
    items: [
      { href: "/admin/projects", label: "Trabajos publicados" },
      { href: "/admin/content", label: "Contenido del sitio" },
      { href: "/admin/testimonials", label: "Testimonios" },
    ],
  },
  {
    id: "vistas",
    label: "Vistas",
    items: [
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/", label: "Ver sitio →" },
    ],
  },
];

function readStoredOpenSections(): Record<string, boolean> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_SECTIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function SbCollapsibleSection({
  id,
  label,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: (sectionId: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="mb-0.5">
      <button
        type="button"
        id={`sidebar-section-${id}`}
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-2 px-4 pt-4 pb-1.5 text-left transition-opacity hover:opacity-80"
        style={{ color: brandUi.textFaint, background: "none", border: "none", cursor: "pointer" }}
        aria-expanded={open}
        aria-controls={`sidebar-section-panel-${id}`}
      >
        <span className="text-[8px] font-medium uppercase tracking-[0.14em]">{label}</span>
        <span className="text-[10px] leading-none" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div id={`sidebar-section-panel-${id}`} role="region" aria-labelledby={`sidebar-section-${id}`}>
          {children}
        </div>
      )}
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

export function AdminSidebar({
  open,
  onToggleMenu,
}: {
  open: boolean;
  onToggleMenu: () => void;
}) {
  const pathname = usePathname();
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_SECTIONS.map((s) => [s.id, true])),
  );

  const isItemActive = useCallback(
    (item: NavItem) => {
      if (item.exact) return pathname === item.href;
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    },
    [pathname],
  );

  const activeSectionId = useMemo(() => {
    for (const section of NAV_SECTIONS) {
      if (section.items.some(isItemActive)) return section.id;
    }
    return null;
  }, [isItemActive]);

  useEffect(() => {
    fetch("/api/admin/contact-messages", { credentials: "include" })
      .then((r) => r.json())
      .then((j: { items: { status: string }[] }) => {
        setNewMsgCount(j.items?.filter((m) => m.status === "nuevo").length ?? 0);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    const stored = readStoredOpenSections();
    if (stored) {
      setOpenSections((prev) => {
        const next = { ...prev };
        for (const section of NAV_SECTIONS) {
          if (typeof stored[section.id] === "boolean") {
            next[section.id] = stored[section.id];
          }
        }
        if (activeSectionId) next[activeSectionId] = true;
        return next;
      });
      return;
    }
    if (activeSectionId) {
      setOpenSections((prev) => ({ ...prev, [activeSectionId]: true }));
    }
  }, [activeSectionId]);

  function toggleSection(sectionId: string) {
    setOpenSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        window.localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div
      className="flex flex-col h-full overflow-y-auto flex-shrink-0 border-r"
      style={{ width: 216, background: brandUi.surface, borderColor: brandUi.border }}
    >
      <div
        className="flex items-start justify-between gap-2 px-4 py-5 flex-shrink-0"
        style={{
          borderBottom: `1px solid ${brandUi.border}`,
          background: `linear-gradient(180deg, ${brandUi.accentSoft} 0%, ${brandUi.surface} 72%)`,
        }}
      >
        <Link href="/admin" className="min-w-0 flex-1 block transition-opacity hover:opacity-90">
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
        {open && (
          <button
            type="button"
            onClick={onToggleMenu}
            className="mt-0.5 shrink-0 rounded border px-2 py-1 text-[10px] leading-none transition-opacity hover:opacity-80"
            style={{
              borderColor: brandUi.borderStrong,
              color: brandUi.textMuted,
              background: brandUi.surface,
            }}
            title="Ocultar menú"
            aria-label="Ocultar menú lateral"
          >
            ◀
          </button>
        )}
      </div>

      <nav className="flex-1 py-2">
        {NAV_SECTIONS.map((section) => (
          <SbCollapsibleSection
            key={section.id}
            id={section.id}
            label={section.label}
            open={openSections[section.id] ?? true}
            onToggle={toggleSection}
          >
            {section.items.map((item) => (
              <SbItem
                key={item.href}
                href={item.href}
                label={item.label}
                badge={item.href === "/admin/leads" ? newMsgCount : undefined}
                active={isItemActive(item)}
              />
            ))}
          </SbCollapsibleSection>
        ))}
      </nav>

      <div
        className="flex h-11 flex-shrink-0 items-center gap-2.5 px-4"
        style={{ borderTop: `1px solid ${brandUi.border}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/sc-so-logo.svg"
          alt="SO — Soulful Branding"
          width={125}
          height={113}
          className="block h-5 w-auto max-w-[52px] shrink-0 object-contain object-center"
          decoding="async"
        />
        <div className="min-w-0 flex-1 leading-none">
          <div className="truncate text-[10px] leading-none" style={{ color: brandUi.textMuted }}>
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
      type="button"
      onClick={() => void handleLogout()}
      className="shrink-0 self-center border-0 bg-transparent p-0 text-[9px] uppercase leading-none tracking-wider transition-opacity hover:opacity-80"
      style={{ color: brandUi.textFaint, cursor: "pointer" }}
      title="Cerrar sesión"
    >
      Salir
    </button>
  );
}
