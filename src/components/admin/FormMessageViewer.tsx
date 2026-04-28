"use client";

// ── parser ─────────────────────────────────────────────────
type ParsedLine =
  | { type: "section"; text: string }
  | { type: "qa"; label: string; value: string }
  | { type: "intro"; text: string };

export function parseFormMessage(raw: string): ParsedLine[] {
  const result: ParsedLine[] = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("[Formulario:")) continue;
    if (t.startsWith("Etapa:")) continue;
    if (/^—.+—$/.test(t)) {
      result.push({ type: "section", text: t.replace(/^—\s*/, "").replace(/\s*—$/, "") });
      continue;
    }
    const ci = t.indexOf(":");
    if (ci > 0 && ci < t.length - 1) {
      result.push({ type: "qa", label: t.slice(0, ci).trim(), value: t.slice(ci + 1).trim() || "(sin respuesta)" });
    } else {
      result.push({ type: "intro", text: t });
    }
  }
  return result;
}

export function isFormMessage(text: string) {
  return text.trimStart().startsWith("[Formulario:");
}

// ── componente ─────────────────────────────────────────────
export function FormMessageViewer({
  message,
  expanded,
  onToggle,
}: {
  message: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const parsed = parseFormMessage(message);

  if (!expanded) {
    const firstQA = parsed.find(
      (l): l is { type: "qa"; label: string; value: string } =>
        l.type === "qa" && l.value !== "(sin respuesta)"
    );
    const preview = firstQA
      ? `${firstQA.label}: ${firstQA.value}`
      : message.slice(0, 120);
    return (
      <div>
        <p
          className="text-xs leading-relaxed line-clamp-2"
          style={{ color: "rgba(13,13,13,0.55)" }}
        >
          {preview}
        </p>
        <button
          type="button"
          onClick={onToggle}
          className="text-[10px] mt-1 hover:underline"
          style={{ color: "#323FF6" }}
        >
          Ver respuestas completas ↓
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {parsed.map((line, i) => {
        if (line.type === "section") {
          return (
            <p
              key={i}
              className="text-[9px] font-medium uppercase tracking-widest pt-2 border-t"
              style={{ color: "rgba(13,13,13,0.35)", borderColor: "rgba(13,13,13,0.08)" }}
            >
              {line.text}
            </p>
          );
        }
        if (line.type === "intro") {
          return (
            <p key={i} className="text-xs italic" style={{ color: "rgba(13,13,13,0.42)" }}>
              {line.text}
            </p>
          );
        }
        const qa = line as { type: "qa"; label: string; value: string };
        return (
          <div key={i} className="grid gap-1 text-xs" style={{ gridTemplateColumns: "minmax(0,160px) 1fr" }}>
            <span className="leading-relaxed" style={{ color: "rgba(13,13,13,0.42)" }}>
              {qa.label}
            </span>
            <span className="leading-relaxed font-medium" style={{ color: "#0D0D0D" }}>
              {qa.value}
            </span>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onToggle}
        className="text-[10px] pt-1 hover:underline"
        style={{ color: "rgba(13,13,13,0.35)" }}
      >
        Colapsar ↑
      </button>
    </div>
  );
}
