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
  return {
    h3: ({ children }) => (
      <h3
        className="font-serif text-2xl italic font-normal mt-8 mb-3 first:mt-0"
        style={{ color: isLight ? brandUi.text : "#F9F3DB" }}
      >
        {children}
      </h3>
    ),
    h2: ({ children }) => (
      <h2
        className="font-serif text-3xl italic font-normal mt-10 mb-4"
        style={{ color: isLight ? brandUi.text : "#F9F3DB" }}
      >
        {children}
      </h2>
    ),
    p: ({ children }) => (
      <p
        className="text-[15px] leading-relaxed mb-4"
        style={{ color: isLight ? brandUi.textMuted : "rgba(249,243,219,0.88)" }}
      >
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold" style={{ color: isLight ? brandUi.text : "#F9F3DB" }}>
        {children}
      </strong>
    ),
    ul: ({ children }) => (
      <ul
        className="list-disc pl-5 mb-5 space-y-2"
        style={{ color: isLight ? brandUi.text : "rgba(249,243,219,0.9)" }}
      >
        {children}
      </ul>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
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
