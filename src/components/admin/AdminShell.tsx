"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

const NO_SIDEBAR = ["/admin/login"];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR.includes(pathname);

  if (!showSidebar) {
    return <div className="min-h-screen" style={{ background: "#F9F3DB" }}>{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ background: "#F9F3DB" }}
      >
        {children}
      </main>
    </div>
  );
}
