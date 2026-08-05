"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { brandUi } from "@/lib/brand-ui";
import adminLoginBg from "../../../assets/images/shared/about1.png";

const NO_SIDEBAR = ["/admin/login"];
const MENU_OPEN_KEY = "erp-admin-menu-open";

function readMenuOpen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(MENU_OPEN_KEY);
    if (raw === "0") return false;
    if (raw === "1") return true;
  } catch {
    /* ignore */
  }
  return true;
}

function persistMenuOpen(open: boolean) {
  try {
    window.localStorage.setItem(MENU_OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR.includes(pathname);
  const [menuOpen, setMenuOpen] = useState(true);

  useEffect(() => {
    setMenuOpen(readMenuOpen());
  }, []);

  function toggleMenu() {
    setMenuOpen((prev) => {
      const next = !prev;
      persistMenuOpen(next);
      return next;
    });
  }

  if (!showSidebar) {
    return (
      <div className="erp-admin relative min-h-screen font-sans text-brand-navy md:flex">
        <div className="absolute inset-0 md:hidden" aria-hidden>
          <Image
            src={adminLoginBg}
            alt=""
            fill
            className="object-cover object-[center_22%]"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0" style={{ background: "rgba(242,242,242,0.9)" }} />
        </div>

        <div className="relative z-10 flex w-full min-h-screen items-center justify-center px-4 py-8 md:w-[min(100%,520px)] md:flex-none md:bg-brand-page md:px-8">
          {children}
        </div>

        <div className="relative hidden min-h-screen flex-1 md:block" aria-hidden>
          <Image
            src={adminLoginBg}
            alt=""
            fill
            className="object-cover object-[center_28%]"
            sizes="(min-width: 768px) 60vw"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${brandUi.page} 0%, rgba(242,242,242,0.15) 18%, rgba(19,25,69,0.08) 100%)`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="erp-admin relative flex h-screen overflow-hidden bg-brand-page font-sans text-brand-navy">
      <div
        className="flex-shrink-0 h-full overflow-hidden transition-[width] duration-200 ease-out"
        style={{ width: menuOpen ? 216 : 0 }}
      >
        <AdminSidebar open={menuOpen} onToggleMenu={toggleMenu} />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {!menuOpen && (
          <button
            type="button"
            onClick={toggleMenu}
            className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-sm transition-opacity hover:opacity-90"
            style={{
              borderColor: brandUi.borderStrong,
              background: brandUi.surface,
              color: brandUi.text,
            }}
            aria-label="Abrir menú del ERP"
          >
            <span aria-hidden>☰</span>
            Menú
          </button>
        )}

        <main className={`min-w-0 flex-1 overflow-x-hidden overflow-y-auto ${menuOpen ? "" : "pt-12"}`}>{children}</main>
      </div>
    </div>
  );
}
