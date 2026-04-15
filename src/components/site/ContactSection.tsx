"use client";

import Image from "next/image";
import { Suspense, useId, useLayoutEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { clearLegacyMomentoStorage, resolveMomentoQuery } from "@/lib/contact-momento";
import { STAGE_FORM_IDS, type SiteContentData, type StageFormId } from "@/lib/site-content";
import { StageMomentForm } from "@/components/site/StageMomentForm";
import { SectionShell } from "@/components/site/SectionShell";
import { HERO_PAPER_TEXTURE_URL } from "@/components/site/HeroSection";
import { cn } from "@/lib/cn";
import alchemyBookBackground from "../../../assets/images/shared/alchemybookbaja.png";
import bookPortrait from "../../../assets/images/shared/book-portrait.png";
import floorPortrait from "../../../assets/images/shared/sofia-creative-process-floor.jpg";

const SOULFUL_BRAND_WORDMARK_SRC = "/brand/soulful-branding.svg" as const;

type Props = {
  contact: SiteContentData["contact"];
  /** Títulos de etapas para el desplegable “¿En qué momento estás?” */
  stageOptions?: string[];
  /** Etapas con `formId` para abrir el formulario largo desde + INFO */
  stages?: SiteContentData["stages"]["stages"];
  /**
   * Query `?etapa=&formulario=` desde el servidor (page.tsx).
   * Sin esto, `useSearchParams()` suele ir vacío en el primer render y siempre se ve el formulario corto.
   */
  initialQuery?: { etapa?: string; formulario?: string };
};

const DEFAULT_STAGES = [
  "Estoy comenzando",
  "Necesito evolucionar",
  "Busco expandirme",
] as const;

const DEFAULT_FOOTER_LINES = [
  "INTERNATIONAL CREATIVE STUDIO",
  "HIGH END EXPERTISE",
  "SERVICIOS EXCLUSIVOS 1:1",
] as const;

function SocialRow({
  contact,
  className,
}: {
  contact: SiteContentData["contact"];
  className?: string;
}) {
  const igGradId = useId().replace(/:/g, "");
  const mailto = contact.emailMailto?.trim() || "mailto:hola@soulfulbranding.com";
  const substack = contact.substackUrl?.trim() || "https://substack.com";
  const pinterest = contact.pinterestUrl?.trim() || "https://www.pinterest.com";
  const items: { href: string; label: string; children: React.ReactNode }[] = [
    {
      href: mailto,
      label: "Email",
      children: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
    },
    {
      href: contact.instagramUrl?.trim() || "https://instagram.com",
      label: "Instagram",
      children: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <defs>
            <linearGradient id={igGradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFDD55" />
              <stop offset="50%" stopColor="#FF543E" />
              <stop offset="100%" stopColor="#C837AB" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#${igGradId})`}
            d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM17.5 6.5a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"
          />
        </svg>
      ),
    },
    {
      href: substack,
      label: "Substack",
      children: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <rect width="24" height="24" rx="4" fill="#FF6719" />
          <path fill="#fff" d="M7 7h10v2H7V7zm0 3.5h10v2H7v-2zm0 3.5h7v2H7v-2z" />
        </svg>
      ),
    },
    {
      href: pinterest,
      label: "Pinterest",
      children: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <circle cx="12" cy="12" r="11" fill="#E60023" />
          <path
            fill="#fff"
            d="M12 6a5 5 0 0 0-2 9.65c-.05-.4-.09-.96.02-1.38.1-.42.65-2.7.65-2.7s-.17-.33-.17-.82c0-.77.45-1.34 1-1.34.47 0 .7.35.7.77 0 .47-.3 1.17-.45 1.82-.13.55.28 1 .83 1 1 0 1.77-1.05 1.77-2.57a2.6 2.6 0 0 0-2.75-2.7c-1.85 0-2.93 1.39-2.93 2.83 0 .55.21 1.14.48 1.46.05.06.06.12.04.18l-.18.73c-.03.12-.1.15-.22.09-1.03-.48-1.67-1.98-1.67-3.19 0-2.6 1.89-5 5.75-5 3.02 0 5.37 2.15 5.37 5.03 0 3-1.89 5.4-4.52 5.4-.89 0-1.73-.46-2.02-.99l-.55 2.1c-.2.78-.74 1.76-1.1 2.36.83.26 1.71.4 2.62.4 4.42 0 8-3.58 8-8s-3.58-8-8-8z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {items.map(({ href, label, children }) => {
        const external = href.startsWith("http");
        return (
          <a
            key={label}
            href={href}
            {...(external ? { target: "_blank" as const, rel: "noopener noreferrer" } : {})}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 transition hover:scale-105 hover:shadow-md"
            aria-label={label}
          >
            {children}
          </a>
        );
      })}
    </div>
  );
}

function ContactFormCard({
  defaultMessage,
  initialStage,
  stages,
  onSubmit,
  status,
  idPrefix = "",
}: {
  defaultMessage: string;
  initialStage: string;
  stages: string[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  status: "idle" | "loading" | "ok" | "err";
  /** Evita ids duplicados si hay dos formularios en el DOM (móvil + desktop). */
  idPrefix?: string;
}) {
  const pid = (s: string) => (idPrefix ? `${idPrefix}${s}` : s);
  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-300/90 bg-white px-2.5 py-2 text-[0.82rem] leading-snug text-brand-navy placeholder:text-neutral-400 outline-none ring-brand-blue/35 focus:ring-2 md:text-[0.85rem]";
  const labelClass = "block text-[11px] font-medium text-brand-navy/80 md:text-xs";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-black/[0.06] bg-white p-3 shadow-[0_10px_32px_-14px_rgba(19,25,69,0.22)] sm:p-3.5"
    >
      <div>
        <label className={labelClass} htmlFor={pid("contact-name")}>
          Tu nombre
        </label>
        <input
          id={pid("contact-name")}
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="¿Cómo te llamas?"
          className={inputClass}
        />
      </div>
      <div className="mt-2">
        <label className={labelClass} htmlFor={pid("contact-email")}>
          Tu email
        </label>
        <input
          id={pid("contact-email")}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          className={inputClass}
        />
      </div>
      <div className="mt-2">
        <label className={labelClass} htmlFor={pid("contact-stage")}>
          ¿En qué momento estás?
        </label>
        <select
          id={pid("contact-stage")}
          key={`${idPrefix}${initialStage || "none"}`}
          name="stage"
          required
          defaultValue={initialStage || ""}
          className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%23666%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-[length:1.1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9")}
        >
          <option value="" disabled>
            Selecciona una opción
          </option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2">
        <label className={labelClass} htmlFor={pid("contact-message")}>
          Cuéntame sobre tu proyecto
        </label>
        <textarea
          id={pid("contact-message")}
          key={`${idPrefix}${defaultMessage || "empty"}`}
          name="message"
          required
          rows={3}
          defaultValue={defaultMessage}
          placeholder="¿Qué te gustaría lograr? ¿Cuál es la misión de tu proyecto?"
          className={cn(inputClass, "min-h-[72px] resize-y")}
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-3 w-full rounded-lg bg-brand-navy px-3 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-brand-navyDark disabled:opacity-60"
      >
        {status === "loading" ? "Enviando…" : "Enviar"}
      </button>
      {status === "ok" && <p className="mt-3 text-sm text-green-700">Mensaje enviado. Gracias.</p>}
      {status === "err" && <p className="mt-3 text-sm text-red-700">No se pudo enviar. Intenta de nuevo.</p>}
    </form>
  );
}

function ContactSectionContent({
  contact,
  stageOptions,
  defaultMessage = "",
  initialStage = "",
  stageFormId = null,
  etapaFromQuery = "",
}: Props & {
  defaultMessage?: string;
  initialStage?: string;
  stageFormId?: StageFormId | null;
  etapaFromQuery?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const stages = stageOptions?.length ? stageOptions : [...DEFAULT_STAGES];
  const useStageForm = Boolean(stageFormId && STAGE_FORM_IDS.includes(stageFormId));

  async function submitStageForm(payload: { name: string; email: string; message: string }) {
    setStatus("loading");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        formKey: stageFormId,
        stageTitle: etapaFromQuery || "",
      }),
    });
    const ok = res.ok;
    setStatus(ok ? "ok" : "err");
    return ok;
  }
  const footerLines = contact.footerLines?.length ? contact.footerLines : [...DEFAULT_FOOTER_LINES];
  const headingMobile =
    contact.heading.trim().toUpperCase() === "CONTACTO" ? "Contacto" : contact.heading;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const stage = String(fd.get("stage") ?? "").trim();
    let message = String(fd.get("message") ?? "");
    if (stage) {
      message = `¿En qué momento estás?: ${stage}\n\n${message}`;
    }
    setStatus("loading");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        message,
        formKey: "contacto-corto",
        stageTitle: stage,
      }),
    });
    setStatus(res.ok ? "ok" : "err");
    if (res.ok) form.reset();
  }

  return (
    <section
      id="contacto"
      className="relative scroll-mt-24 overflow-x-hidden pb-8 pt-8 md:pb-10 md:pt-10 lg:scroll-mt-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.97]"
        style={{
          backgroundImage: `url('${HERO_PAPER_TEXTURE_URL}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[#f7f4ef]/70" aria-hidden />

      <SectionShell className="relative z-10">
        {/* ——— Móvil: mockup editorial (título serif → form → doble foto → marca sobre imágenes → redes) ——— */}
        <div className="space-y-8 pb-6 lg:hidden">
          <header className="text-left">
            <h2 className="font-serif text-[clamp(2.4rem,11vw,3.75rem)] font-semibold italic leading-[1.05] tracking-[-0.02em] text-brand-navy">
              {headingMobile}
            </h2>
            <p className="mt-5 max-w-md px-1 text-[0.95rem] leading-[1.65] text-neutral-800">
              {contact.intro}
            </p>
          </header>

          <div className="mx-auto w-full max-w-md px-1">
            {useStageForm && stageFormId ? (
              <StageMomentForm
                key={`m-${stageFormId}-${etapaFromQuery}`}
                idPrefix="m-"
                formId={stageFormId}
                etapaLabel={etapaFromQuery || "—"}
                onSubmit={submitStageForm}
                status={status}
              />
            ) : (
              <ContactFormCard
                idPrefix="m-"
                defaultMessage={defaultMessage}
                initialStage={initialStage}
                stages={stages}
                onSubmit={onSubmit}
                status={status}
              />
            )}
          </div>

          <div className="relative -mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full">
            <div className="grid grid-cols-2 gap-0">
              <div className="relative aspect-[4/5] min-h-[200px]">
                <Image
                  src={floorPortrait}
                  alt=""
                  fill
                  className="object-cover object-[center_45%]"
                  sizes="50vw"
                  priority={false}
                />
              </div>
              <div className="relative aspect-[4/5] min-h-[200px]">
                <Image
                  src={bookPortrait}
                  alt=""
                  fill
                  className="object-cover object-[52%_38%]"
                  sizes="50vw"
                  priority={false}
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#f5f3ef]/98 via-[#f5f3ef]/88 to-transparent px-3 pb-5 pt-16 text-center">
              <div className="mx-auto max-w-[min(92vw,21rem)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SOULFUL_BRAND_WORDMARK_SRC} alt={contact.footerTagline} className="mx-auto h-auto w-full object-contain" />
              </div>
              <div className="mx-auto mt-3 max-w-md space-y-0.5">
                {footerLines.map((line) => (
                  <p
                    key={line}
                    className="font-sans text-[9px] font-bold uppercase tracking-normal text-[#3b3837] sm:text-[10px]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <SocialRow contact={contact} className="justify-center pb-2" />
        </div>

        {/* ——— Desktop: tarjeta con foto de fondo + form a la derecha + pie de marca ——— */}
        <div className="hidden lg:block">
          <div className="relative overflow-visible rounded-2xl shadow-[0_20px_50px_-24px_rgba(19,25,69,0.35)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <Image
                src={alchemyBookBackground}
                alt=""
                fill
                className="object-cover object-[52%_24%]"
                sizes="100vw"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#f5f3ef]/95 via-[#f5f3ef]/55 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#f5f3ef]/85 via-transparent to-[#f5f3ef]/30" />
            </div>

            <div className="relative z-10 flex min-h-0 flex-col overflow-visible lg:min-h-[min(64vh,560px)] lg:px-2 lg:py-6 xl:px-4 xl:py-8">
              <div className="grid grid-cols-1 gap-6 px-4 pb-6 pt-5 lg:grid-cols-12 lg:gap-6 lg:px-6 lg:pb-10 lg:pt-4 xl:pt-5">
                <div className="text-left lg:col-span-5 lg:self-start lg:pt-2">
                  <h2 className="font-sans text-[clamp(1.65rem,4vw,2.6rem)] font-bold uppercase leading-tight tracking-[0.06em] text-brand-navy">
                    {contact.heading}
                  </h2>
                  <p className="mt-4 max-w-md text-[0.95rem] leading-[1.65] text-neutral-800 md:text-base">
                    {contact.intro}
                  </p>
                  <SocialRow contact={contact} className="mt-6" />
                </div>

                <div
                  className={cn(
                    "lg:col-span-7 lg:relative lg:min-h-0",
                    "lg:flex lg:flex-col lg:items-end lg:justify-start",
                    useStageForm && stageFormId ? "lg:pb-2" : "lg:pt-1 lg:pb-3",
                  )}
                >
                  <div
                    className={cn(
                      "mx-auto w-full lg:z-20 lg:mx-0",
                      useStageForm && stageFormId
                        ? "lg:w-full lg:max-w-[min(460px,100%)] xl:max-w-[500px]"
                        : "max-w-[310px] sm:max-w-[320px] lg:w-full lg:max-w-[320px] lg:self-end",
                    )}
                  >
                    {useStageForm && stageFormId ? (
                      <StageMomentForm
                        key={`d-${stageFormId}-${etapaFromQuery}`}
                        idPrefix="d-"
                        formId={stageFormId}
                        etapaLabel={etapaFromQuery || "—"}
                        onSubmit={submitStageForm}
                        status={status}
                      />
                    ) : (
                      <ContactFormCard
                        idPrefix="d-"
                        defaultMessage={defaultMessage}
                        initialStage={initialStage}
                        stages={stages}
                        onSubmit={onSubmit}
                        status={status}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 w-full pb-8 pt-2 text-center lg:mt-10 lg:pb-10">
            <div className="mx-auto w-full max-w-[min(92vw,980px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SOULFUL_BRAND_WORDMARK_SRC}
                alt={contact.footerTagline}
                className="mx-auto h-auto w-full object-contain [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.45))]"
              />
            </div>
            <div className="mx-auto mt-4 max-w-4xl space-y-1">
              {footerLines.map((line) => (
                <p
                  key={line}
                  className="font-sans text-[10px] font-bold uppercase tracking-normal text-[#3b3837] md:text-[11px]"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </SectionShell>
    </section>
  );
}

function ContactSectionWithQuery(props: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [resolved, setResolved] = useState(() => ({
    etapa: props.initialQuery?.etapa?.trim() || "",
    formulario: props.initialQuery?.formulario?.trim() || "",
  }));

  useLayoutEffect(() => {
    const q = resolveMomentoQuery(searchParams, props.initialQuery);
    setResolved(q);
    if (typeof window !== "undefined" && !q.formulario) {
      clearLegacyMomentoStorage();
    }
  }, [
    pathname,
    searchParams.toString(),
    props.initialQuery?.etapa,
    props.initialQuery?.formulario,
  ]);

  const etapa = resolved.etapa;
  const formularioRaw = resolved.formulario;

  const defaultMessage = etapa
    ? `Hola, quería más información sobre la etapa «${etapa}».`
    : "";
  const stageTitles = props.stageOptions?.length ? props.stageOptions : [...DEFAULT_STAGES];
  const initialStage = etapa && stageTitles.includes(etapa) ? etapa : "";

  const stageFormId =
    formularioRaw && STAGE_FORM_IDS.includes(formularioRaw as StageFormId)
      ? (formularioRaw as StageFormId)
      : null;

  /** Si hay `formulario` válido pero falta etapa, intenta inferirla desde los metadatos */
  const etapaResolved =
    etapa ||
    (stageFormId && props.stages?.find((s) => s.formId === stageFormId)?.title) ||
    "";

  return (
    <ContactSectionContent
      key={`${etapa}-${formularioRaw}`}
      {...props}
      defaultMessage={defaultMessage}
      initialStage={initialStage}
      stageFormId={stageFormId}
      etapaFromQuery={etapaResolved}
    />
  );
}

function contactFallbackFromInitial(props: Props) {
  const { etapa, formulario: formularioRaw } = resolveMomentoQuery(
    new URLSearchParams(),
    props.initialQuery,
  );
  const stageFormId =
    formularioRaw && STAGE_FORM_IDS.includes(formularioRaw as StageFormId)
      ? (formularioRaw as StageFormId)
      : null;
  const etapaResolved =
    etapa ||
    (stageFormId && props.stages?.find((s) => s.formId === stageFormId)?.title) ||
    "";
  const defaultMessage = etapa
    ? `Hola, quería más información sobre la etapa «${etapa}».`
    : "";
  const stageTitles = props.stageOptions?.length ? props.stageOptions : [...DEFAULT_STAGES];
  const initialStage = etapa && stageTitles.includes(etapa) ? etapa : "";
  return (
    <ContactSectionContent
      {...props}
      defaultMessage={defaultMessage}
      initialStage={initialStage}
      stageFormId={stageFormId}
      etapaFromQuery={etapaResolved}
    />
  );
}

export function ContactSection(props: Props) {
  return (
    <Suspense fallback={contactFallbackFromInitial(props)}>
      <ContactSectionWithQuery {...props} />
    </Suspense>
  );
}
