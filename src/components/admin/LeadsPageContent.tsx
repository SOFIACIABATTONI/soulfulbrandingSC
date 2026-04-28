"use client";

import { useState } from "react";
import { LeadsManager } from "./LeadsManager";
import { ContactInbox } from "./ContactInbox";

type Tab = "leads" | "mensajes";

export function LeadsPageContent({ newMsgCount }: { newMsgCount: number }) {
  const [tab, setTab] = useState<Tab>("leads");
  const [liveNewCount, setLiveNewCount] = useState(newMsgCount);

  return (
    <div>
      {/* ── Tabs ── */}
      <div
        className="flex gap-0 mb-6 border-b"
        style={{ borderColor: "rgba(13,13,13,0.12)" }}
      >
        <TabButton
          active={tab === "leads"}
          onClick={() => setTab("leads")}
        >
          Leads
        </TabButton>
        <TabButton
          active={tab === "mensajes"}
          onClick={() => setTab("mensajes")}
          badge={liveNewCount}
        >
          Mensajes recibidos
        </TabButton>
      </div>

      {tab === "leads" ? (
        <LeadsManager />
      ) : (
        <ContactInbox onNewCountChange={setLiveNewCount} />
      )}
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
  badge,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
      style={{
        borderColor: active ? "#F03172" : "transparent",
        color: active ? "#F03172" : "rgba(13,13,13,0.42)",
        background: "none",
        marginBottom: "-1px",
      }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-medium text-white"
          style={{ background: "#F03172" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
