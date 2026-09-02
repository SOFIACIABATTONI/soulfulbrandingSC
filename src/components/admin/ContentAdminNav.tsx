"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTENT_SECTIONS } from "@/lib/admin-content-sections";
import { brandUi } from "@/lib/brand-ui";

export function ContentAdminNav() {
  const pathname = usePathname();

  return (
    <aside
      className="w-full shrink-0 border-b border-neutral-200 bg-white lg:w-56 lg:border-b-0 lg:border-r"
      aria-label="Secciones del contenido"
    >
      <div className="px-4 py-4 lg:sticky lg:top-0 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Contenido del sitio</p>
        <nav className="mt-3 flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {CONTENT_SECTIONS.map((section) => {
            const href = `/admin/content/${section.id}`;
            const active = pathname === href;
            return (
              <Link
                key={section.id}
                href={href}
                className="shrink-0 rounded-md px-3 py-2 text-sm transition-colors lg:shrink"
                style={{
                  background: active ? brandUi.accentSoft : "transparent",
                  color: active ? brandUi.accent : brandUi.textMuted,
                }}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
