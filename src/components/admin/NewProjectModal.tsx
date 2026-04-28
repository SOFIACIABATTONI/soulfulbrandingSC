"use client";

import { useState } from "react";

type ProjectSummary = {
  id: string;
  title: string;
  service: string;
  status: string;
  value: number;
  startDate: string | null;
  deliveryDate: string | null;
};

const EMPTY_FORM = {
  title: "",
  service: "identidad-de-marca",
  value: "",
  startDate: new Date().toISOString().slice(0, 10),
  deliveryDate: "",
  notes: "",
};

export function NewProjectModal({
  clientId,
  clientName,
  onClose,
  onCreated,
}: {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onCreated: (project: ProjectSummary) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.value || Number(form.value) <= 0) {
      setError("El valor debe ser mayor a 0.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/projects-erp", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        title: form.title,
        service: form.service,
        value: Number(form.value),
        startDate: form.startDate || undefined,
        deliveryDate: form.deliveryDate || undefined,
        notes: form.notes,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const j = (await res.json()) as { item: ProjectSummary };
      onCreated(j.item);
    } else {
      setError("Error al crear el proyecto. Intentá de nuevo.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,13,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-serif text-lg italic">Nuevo proyecto</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(13,13,13,0.42)" }}>
              Para {clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xl text-neutral-400 hover:text-neutral-700 leading-none px-1"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs rounded px-3 py-2" style={{ background: "#fee2e2", color: "#b91c1c" }}>
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Nombre del proyecto" required>
                <input
                  required
                  className="fv"
                  placeholder="Identidad de marca — Valentina R."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Servicio" required>
              <select
                className="fv"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              >
                <option value="identidad-de-marca">Identidad de marca</option>
                <option value="estrategia-visual">Estrategia visual</option>
                <option value="diseno-editorial">Diseño editorial</option>
              </select>
            </Field>
            <Field label="Valor total (USD)" required>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                className="fv"
                placeholder="3200"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </Field>
            <Field label="Fecha de inicio">
              <input
                type="date"
                className="fv"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="Fecha de entrega estimada">
              <input
                type="date"
                className="fv"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
              />
            </Field>
            <div className="col-span-2">
              <Field label="Notas iniciales">
                <textarea
                  className="fv w-full resize-y"
                  rows={2}
                  placeholder="Contexto, acuerdos iniciales…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-neutral-100 sticky bottom-0 bg-white py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "#0D0D0D" }}
            >
              {saving ? "Creando…" : "Crear proyecto"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .fv {
          width: 100%;
          padding: 7px 10px;
          font-size: 13px;
          border: 1px solid rgba(13,13,13,0.15);
          border-radius: 2px;
          background: #F9F3DB;
          color: #0D0D0D;
          outline: none;
        }
        .fv:focus { border-color: rgba(50,63,246,0.5); background: #fff; }
        select.fv { appearance: auto; }
      `}</style>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "rgba(13,13,13,0.42)" }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
