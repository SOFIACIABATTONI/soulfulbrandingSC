"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { brandUi } from "@/lib/brand-ui";

const NO_SIDEBAR = ["/admin/login"];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR.includes(pathname);

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-brand-page font-sans text-brand-navy">{children}</div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-page font-sans text-brand-navy">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
