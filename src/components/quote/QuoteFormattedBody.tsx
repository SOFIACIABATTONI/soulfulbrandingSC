"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuoteBBBDeck } from "@/components/quote/QuoteBBBDeck";
import { isBbbDeckFormat } from "@/lib/quote-bbb-deck";
import type { QuoteContentFormat } from "@/lib/quote-types";
import { parseVideoUrl } from "@/lib/quote-video";
import { brandUi } from "@/lib/brand-ui";

function markdownComponents(theme: "light" | "dark"): Components {
  const isLight = theme === "light";
  const headingColor = isLight ? brandUi.text : "#F9F3DB";
  const bodyColor = isLight ? brandUi.textMuted : "rgba(249,243,219,0.88)";

  return {
    h1: ({ children }) => (
      <h1
        className="font-serif text-3xl italic font-normal mt-0 mb-5"
        style={{ color: headingColor }}
      >
        {children}
      </h1>
    ),
    h3: ({ children }) => (
      <h3
        className="font-serif text-2xl italic font-normal mt-8 mb-3 first:mt-0"
        style={{ color: headingColor }}
      >
        {children}
      </h3>
    ),
    h2: ({ children }) => (
      <h2
        className="font-serif text-2xl italic font-normal mt-8 mb-3"
        style={{ color: headingColor }}
      >
        {children}
      </h2>
    ),
    p: ({ children }) => (
      <p className="text-[15px] leading-relaxed mb-4" style={{ color: bodyColor }}>
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold" style={{ color: headingColor }}>
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em
        className="not-italic rounded px-1.5 py-0.5 text-[14px]"
        style={{
          color: brandUi.accent,
          background: isLight ? brandUi.accentSoft : "rgba(240,49,114,0.15)",
        }}
      >
        {children}
      </em>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-5 mb-5 space-y-2" style={{ color: headingColor }}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-5 mb-5 space-y-2" style={{ color: headingColor }}>
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed mb-1 [&>input[type=checkbox]]:mr-2 [&>input[type=checkbox]]:accent-[#F03172]">
        {children}
      </li>
    ),
    input: ({ checked, ...rest }) => (
      <input type="checkbox" checked={checked ?? false} readOnly {...rest} />
    ),
    table: ({ children }) => (
      <div className="mb-6 overflow-x-auto rounded-xl border" style={{ borderColor: brandUi.border }}>
        <table className="w-full text-sm text-left">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead style={{ background: isLight ? brandUi.navySoft : "rgba(249,243,219,0.08)" }}>
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th
        className="px-3 py-2 font-medium text-xs uppercase tracking-wide"
        style={{ color: headingColor }}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 border-t align-top" style={{ borderColor: brandUi.border, color: bodyColor }}>
        {children}
      </td>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="underline"
        style={{ color: brandUi.accent }}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    ),
  };
}

type Props = {
  body: string;
  format?: QuoteContentFormat;
  videoUrl?: string | null;
  total?: number;
  currency?: string;
  /** light = sitio web / portales; dark = legacy email preview */
  theme?: "light" | "dark";
};

export function QuoteVideoEmbed({
  videoUrl,
  theme = "light",
}: {
  videoUrl?: string | null;
  theme?: "light" | "dark";
}) {
  const video = parseVideoUrl(videoUrl);
  if (!video) return null;

  return (
    <div
      className="mb-8 rounded overflow-hidden border"
      style={{ borderColor: theme === "light" ? brandUi.border : "rgba(249,243,219,0.12)" }}
    >
      <div className="relative w-full aspect-video bg-neutral-100">
        <iframe
          src={video.embedUrl}
          title="Video de bienvenida"
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p
        className="text-center py-2 text-[10px] uppercase tracking-widest"
        style={{ color: theme === "light" ? brandUi.textFaint : "rgba(249,243,219,0.4)" }}
      >
        Video de bienvenida
      </p>
    </div>
  );
}

export function QuoteFormattedBody({
  body,
  format,
  videoUrl,
  total,
  currency,
  theme = "light",
}: Props) {
  if (isBbbDeckFormat(format)) {
    return (
      <div>
        <QuoteVideoEmbed videoUrl={videoUrl} theme={theme} />
        <QuoteBBBDeck />
      </div>
    );
  }

  const isLight = theme === "light";

  return (
    <div>
      <QuoteVideoEmbed videoUrl={videoUrl} theme={theme} />
      <div className={isLight ? "quote-markdown-light" : "quote-markdown-dark"}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(theme)}>
          {body}
        </ReactMarkdown>
      </div>
      {total != null && (
        <p
          className="mt-8 pt-6 border-t text-sm font-medium"
          style={{
            borderColor: isLight ? brandUi.border : "rgba(249,243,219,0.15)",
            color: isLight ? brandUi.text : "#F9F3DB",
          }}
        >
          Inversión: ${total.toLocaleString("es-AR")} {currency ?? "USD"}
        </p>
      )}
    </div>
  );
}
