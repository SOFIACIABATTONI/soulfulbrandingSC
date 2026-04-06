"use client";

import { useState } from "react";

async function uploadFile(file: File, minWidth?: number, minHeight?: number): Promise<string> {
  const fd = new FormData();
  fd.set("file", file);
  if (minWidth) fd.set("minWidth", String(minWidth));
  if (minHeight) fd.set("minHeight", String(minHeight));
  const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
  const j = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) throw new Error(j.error || "Error al subir");
  return j.url ?? "";
}

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helpText?: string;
  minWidth?: number;
  minHeight?: number;
  ratio?: string;
};

function checkImageConstraints(
  file: File,
  minWidth?: number,
  minHeight?: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!minWidth && !minHeight) return Promise.resolve({ ok: true });
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      if (minWidth && w < minWidth) {
        resolve({ ok: false, error: `La imagen es muy pequeña: mínimo ${minWidth}px de ancho.` });
        return;
      }
      if (minHeight && h < minHeight) {
        resolve({ ok: false, error: `La imagen es muy pequeña: mínimo ${minHeight}px de alto.` });
        return;
      }
      resolve({ ok: true });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ ok: false, error: "No se pudo leer la imagen." });
    };
    img.src = objectUrl;
  });
}

export function ImageField({ label, value, onChange, helpText, minWidth, minHeight, ratio }: Props) {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… o sube un archivo"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      {(helpText || minWidth || minHeight || ratio) && (
        <p className="text-xs text-neutral-500">
          {helpText ?? ""}
          {(minWidth || minHeight || ratio) ? " " : ""}
          {[minWidth ? `Mín: ${minWidth}px ancho` : "", minHeight ? `Mín: ${minHeight}px alto` : "", ratio ? `Proporción sugerida: ${ratio}` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          className="text-sm"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setErr(null);
            setLoading(true);
            try {
              const dims = await checkImageConstraints(f, minWidth, minHeight);
              if (!dims.ok) {
                setErr(dims.error);
                return;
              }
              const url = await uploadFile(f, minWidth, minHeight);
              onChange(url);
            } catch (x) {
              setErr(x instanceof Error ? x.message : "Error");
            } finally {
              setLoading(false);
            }
          }}
        />
        {loading && <span className="text-xs text-neutral-500">Subiendo…</span>}
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
