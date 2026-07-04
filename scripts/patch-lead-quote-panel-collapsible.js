const fs = require("fs");
const path = "src/components/admin/LeadQuotePanel.tsx";

let s = fs.readFileSync(path, "utf8");

if (!s.startsWith('"use client"')) {
  console.error("File does not look like valid UTF-8 TSX");
  process.exit(1);
}

if (!s.includes('import Link from "next/link"')) {
  s = s.replace(
    'import { useCallback, useEffect, useState } from "react";',
    'import { useCallback, useEffect, useState } from "react";\nimport Link from "next/link";',
  );
}

s = s.replace(
  `type LeadQuotePanelProps = {
  leadId: string;
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">;
};`,
  `type LeadQuotePanelProps = {
  leadId: string;
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">;
  clientId?: string | null;
};`,
);

s = s.replace(
  "export function LeadQuotePanel({ leadId, lead }: LeadQuotePanelProps) {",
  "export function LeadQuotePanel({ leadId, lead, clientId = null }: LeadQuotePanelProps) {",
);

if (!s.includes("editorOpen")) {
  s = s.replace(
    "const [showPreview, setShowPreview] = useState(true);",
    "const [showPreview, setShowPreview] = useState(true);\n  const [editorOpen, setEditorOpen] = useState(false);",
  );
}

s = s.replace(
  `      setActiveId(j.item.id);
      selectQuote(j.item);`,
  `      setActiveId(j.item.id);
      selectQuote(j.item);
      setEditorOpen(true);`,
);

const oldBlock = `          {active && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span
                  className="rounded px-2 py-0.5 font-medium uppercase tracking-wide"
                  style={{
                    background: "rgba(50,63,246,0.08)",
                    color: "#323FF6",
                  }}
                >
                  {QUOTE_STATUS_LABELS[active.status] ?? active.status}
                </span>
                {active.clientResponse && (
                  <span style={{ color: "#0D0D0D" }}>
                    Cliente: {CLIENT_RESPONSE_LABELS[active.clientResponse] ?? active.clientResponse}
                  </span>
                )}
                {active.clientComment && (
                  <span style={{ color: "rgba(13,13,13,0.55)" }}>
                    — {active.clientComment}
                  </span>
                )}
              </div>

              {active.status === "borrador" ? (`;

const newBlock = `          {active && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span
                  className="rounded px-2 py-0.5 font-medium uppercase tracking-wide"
                  style={{
                    background: "rgba(50,63,246,0.08)",
                    color: "#323FF6",
                  }}
                >
                  {QUOTE_STATUS_LABELS[active.status] ?? active.status}
                </span>
                {active.clientResponse && (
                  <span style={{ color: "#131945" }}>
                    Cliente: {CLIENT_RESPONSE_LABELS[active.clientResponse] ?? active.clientResponse}
                    {active.clientComment ? (" — " + active.clientComment) : ""}
                  </span>
                )}
                {!active.clientResponse && active.clientComment && (
                  <span style={{ color: "rgba(19,25,69,0.55)" }}>
                    — {active.clientComment}
                  </span>
                )}
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t"
                style={{ borderColor: "rgba(19,25,69,0.1)" }}
              >
                <div className="text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                  {active.sentAt && (
                    <span>
                      Enviado {new Date(active.sentAt).toLocaleDateString("es-AR")}
                      {active.viewedAt &&
                        (" · Visto " + new Date(active.viewedAt).toLocaleDateString("es-AR"))}
                    </span>
                  )}
                  {!active.sentAt && active.status === "borrador" && (
                    <span>Borrador — aún no enviado</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditorOpen((v) => !v)}
                  className="text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity"
                  style={{ color: "#F03172", background: "none", border: "none", cursor: "pointer" }}
                  aria-expanded={editorOpen}
                >
                  {active.status === "borrador" ? "Ver / editar presupuesto" : "Ver presupuesto completo"}{" "}
                  {editorOpen ? "↑" : "↓"}
                </button>
              </div>

              {editorOpen && (active.status === "borrador" ? (`;

if (!s.includes(oldBlock)) {
  console.error("Could not find block to replace (start)");
  process.exit(1);
}
s = s.replace(oldBlock, newBlock);

const oldEnd = `              ) : (
                <div
                  className="rounded-lg border px-5 py-6"
                  style={{ background: "#0D0D0D", borderColor: "rgba(13,13,13,0.15)" }}
                >
                  <QuoteFormattedBody
                    body={normalizeQuoteContent(active.content).body}
                    format={normalizeQuoteContent(active.content).format}
                    videoUrl={normalizeQuoteContent(active.content).videoUrl}
                    total={normalizeQuoteContent(active.content).total}
                    currency={normalizeQuoteContent(active.content).currency}
                  />
                </div>
              )}

              {active.sentAt && (
                <p className="text-[10px]" style={{ color: "rgba(13,13,13,0.42)" }}>
                  Enviado: {new Date(active.sentAt).toLocaleString("es-AR")}
                  {active.viewedAt &&
                    (" · Visto: " + new Date(active.viewedAt).toLocaleString("es-AR"))}
                  {active.respondedAt &&
                    (" · Respondido: " + new Date(active.respondedAt).toLocaleString("es-AR"))}
                </p>
              )}
            </div>
          )}`;

const newEnd = `              ) : (
                <div
                  className="rounded-lg border px-5 py-6 mt-4 pt-4 border-t"
                  style={{
                    background: "#0D0D0D",
                    borderColor: "rgba(19,25,69,0.1)",
                  }}
                >
                  <QuoteFormattedBody
                    body={normalizeQuoteContent(active.content).body}
                    format={normalizeQuoteContent(active.content).format}
                    videoUrl={normalizeQuoteContent(active.content).videoUrl}
                    total={normalizeQuoteContent(active.content).total}
                    currency={normalizeQuoteContent(active.content).currency}
                  />
                </div>
              ))}

              {editorOpen && active.respondedAt && (
                <p className="text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                  Respondido: {new Date(active.respondedAt).toLocaleString("es-AR")}
                </p>
              )}
            </div>
          )}`;

if (!s.includes("              ) : (\n                <div\n                  className=\"rounded-lg border px-5 py-6\"")) {
  console.error("Could not find block to replace (end)");
  process.exit(1);
}
s = s.replace(oldEnd, newEnd);

const oldFooter = `      {message && (
        <p className="text-xs mt-3 rounded px-2 py-1.5" style={{ background: "#F9F3DB", color: "#0D0D0D" }}>
          {message}
        </p>
      )}
      {lastLink && (
        <p className="text-xs mt-2 break-all">
          <span style={{ color: "rgba(13,13,13,0.42)" }}>Link cliente: </span>
          <a href={lastLink} style={{ color: "#323FF6" }} target="_blank" rel="noreferrer">
            {lastLink}
          </a>
        </p>
      )}
    </div>
  );
}`;

const newFooter = `      {message && (
        <p className="text-xs mt-3 rounded px-2 py-1.5" style={{ background: "#F9F3DB", color: "#131945" }}>
          {message}
        </p>
      )}
      {lastLink && (
        <p className="text-xs mt-2 break-all">
          <span style={{ color: "rgba(19,25,69,0.42)" }}>Link cliente: </span>
          <a href={lastLink} style={{ color: "#323FF6" }} target="_blank" rel="noreferrer">
            {lastLink}
          </a>
        </p>
      )}

      {clientId && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t"
          style={{ borderColor: "rgba(19,25,69,0.1)" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "rgba(19,25,69,0.55)" }}>
            Cliente vinculado — proyectos, contratos y facturas se gestionan en{" "}
            <strong style={{ color: "#131945" }}>Clientes</strong>.
          </p>
          <Link
            href={"/admin/clientes/" + clientId}
            className="rounded px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
            style={{ background: "#F03172" }}
          >
            Ver ficha de cliente →
          </Link>
        </div>
      )}
    </div>
  );
}`;

if (!s.includes("      {message && (")) {
  console.error("Could not find footer");
  process.exit(1);
}
s = s.replace(oldFooter, newFooter);

fs.writeFileSync(path, s, "utf8");
console.log("LeadQuotePanel patched OK, lines:", s.split("\n").length);
