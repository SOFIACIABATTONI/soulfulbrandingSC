"use client";

import type { StageFormId } from "@/lib/site-content";
import { buildStageFormMessage, getStageForm } from "@/lib/stage-forms";
import { cn } from "@/lib/cn";
import { ContactSuccessNotice } from "@/components/site/ContactSuccessNotice";

type Props = {
  formId: StageFormId;
  /** Etapa seleccionada (título de la card) */
  etapaLabel: string;
  idPrefix?: string;
  status: "idle" | "loading" | "ok" | "err";
  onSubmit: (payload: { name: string; email: string; message: string }) => Promise<boolean>;
};

export function StageMomentForm({ formId, etapaLabel, idPrefix = "", status, onSubmit }: Props) {
  const def = getStageForm(formId);
  const pid = (s: string) => (idPrefix ? `${idPrefix}${s}` : s);
  const inputClass =
    "mt-1 w-full min-w-0 rounded-lg border border-neutral-300/90 bg-white px-2.5 py-2 text-[0.82rem] leading-snug text-brand-navy placeholder:text-neutral-400 outline-none ring-brand-blue/35 focus:ring-2 md:text-[0.85rem]";
  const labelClass =
    "block max-w-full break-words text-[11px] font-medium leading-snug text-brand-navy/80 md:text-xs";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { name, email, message } = buildStageFormMessage(def, fd, etapaLabel);
    const ok = await onSubmit({ name, email, message });
    if (ok) form.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl",
        "border border-black/10 bg-white shadow-[0_20px_50px_-24px_rgba(19,25,69,0.28)] ring-1 ring-black/[0.06]",
        "max-h-[min(78vh,680px)] sm:max-h-[min(80vh,720px)]",
      )}
    >
      {/* Cabecera fija: tipo de formulario + etapa (siempre visible) */}
      <div className="shrink-0 border-b border-black/[0.07] bg-gradient-to-br from-brand-pink/10 via-white to-brand-sky/15 px-4 py-3 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-magenta">{def.title}</p>
        <p className="mt-1.5 text-xs font-semibold text-brand-navy">Momento elegido: {etapaLabel}</p>
        <p className="mt-0.5 text-[10px] text-brand-navy/55">Desplazá el contenido para completar todas las secciones.</p>
      </div>

      {/* Cuerpo con scroll: bienvenida + campos */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-pretty text-[0.8rem] leading-relaxed text-brand-navy/90 [overflow-wrap:anywhere]">{def.welcome}</p>

        {def.sections.map((sec, si) => (
          <div
            key={`${formId}-sec-${si}-${sec.heading ?? ""}`}
            className="mt-6 border-t border-black/[0.06] pt-5 first:mt-5 first:border-t-0 first:pt-0"
          >
            {sec.heading && (
              <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-brand-navy">{sec.heading}</h3>
            )}
            {sec.intro && (
              <p className="mt-2 text-pretty text-[0.78rem] leading-relaxed text-brand-navy/85 [overflow-wrap:anywhere]">
                {sec.intro}
              </p>
            )}
            <div className="mt-3 space-y-3">
              {sec.fields.map((f) => (
                <div key={f.name} className="min-w-0">
                  <label className={labelClass} htmlFor={pid(f.name)}>
                    {f.label}
                    {f.required ? <span className="text-red-600"> *</span> : null}
                  </label>
                  {f.multiline ? (
                    <textarea
                      id={pid(f.name)}
                      name={f.name}
                      required={f.required}
                      rows={f.rows ?? 3}
                      className={cn(inputClass, "min-h-[56px] resize-y [overflow-wrap:anywhere]")}
                    />
                  ) : (
                    <input
                      id={pid(f.name)}
                      name={f.name}
                      type={f.bind === "email" ? "email" : "text"}
                      required={f.required}
                      autoComplete={f.bind === "name" ? "name" : f.bind === "email" ? "email" : undefined}
                      className={cn(inputClass, "[overflow-wrap:anywhere]")}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pie fijo: enviar siempre visible */}
      <div className="shrink-0 border-t border-black/[0.08] bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-5">
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-lg bg-brand-navy px-3 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-brand-navyDark disabled:opacity-60"
        >
          {status === "loading" ? "Enviando…" : "Enviar"}
        </button>
        {status === "ok" && <ContactSuccessNotice />}
        {status === "err" && <p className="mt-2 text-sm text-red-700">No se pudo enviar. Intenta de nuevo.</p>}
      </div>
    </form>
  );
}
