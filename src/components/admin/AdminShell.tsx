"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { brandUi } from "@/lib/brand-ui";
import adminLoginBg from "../../../assets/images/shared/about1.png";

const NO_SIDEBAR = ["/admin/login"];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR.includes(pathname);

  if (!showSidebar) {
    return (
      <div className="relative min-h-screen font-sans text-brand-navy md:flex">
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
    <div className="flex h-screen overflow-hidden bg-brand-page font-sans text-brand-navy">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
