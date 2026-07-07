import type { ParsedVideo } from "@/lib/quote-video";
import { resolveSiteUrl } from "@/lib/site-metadata";
import { brandSansStack, brandSerifStack, brandUi } from "@/lib/brand-ui";

/** Convierte markdown simple (###, **, listas) a HTML para correos — estilo sitio (claro). */

const EMAIL_CREAM = "#F9F3DB";

export type BrandEmailLayoutInput = {
  inner: string;
  videoBlock?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  footerNote?: string;
  title?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailBrandHeader(): string {
  return `<p style="margin:0 0 16px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${brandUi.accent};font-weight:600;text-align:center;">Soulful Branding®</p>
<table role="presentation" width="72" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 20px;">
<tr><td style="height:3px;background:${brandUi.accent};border-radius:999px;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>`;
}
function emailHeadStyles(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<style>
  @media only screen and (max-width: 620px) {
    .email-shell { padding: 12px 8px !important; }
    .email-card { border-radius: 10px !important; }
    .email-body { padding: 22px 16px 26px !important; }
    .email-cta { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
  }
</style>
</head>`;
}

function emailCtaBlock(ctaUrl: string, ctaLabel: string): string {
  if (!ctaUrl.trim()) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;"><tr><td align="center">
<a href="${escapeHtml(ctaUrl)}" class="email-cta" style="display:inline-block;background:${brandUi.accent};color:#ffffff;text-decoration:none;padding:15px 32px;font-size:14px;font-weight:600;border-radius:999px;letter-spacing:0.02em;">${escapeHtml(ctaLabel)}</a>
</td></tr></table>`;
}

function emailFooterSiteLink(): string {
  const site = resolveSiteUrl();
  return `<p style="margin:18px 0 0;font-family:${brandSansStack};font-size:11px;line-height:1.5;color:rgba(19,25,69,0.38);text-align:center;">Soulful Branding® · <a href="${escapeHtml(site)}" style="color:rgba(19,25,69,0.45);text-decoration:underline;">sofiaciabattoni.com</a></p>`;
}

/** Layout compartido para todos los correos al cliente (y notificaciones con HTML). */
export function wrapBrandEmailHtml(input: BrandEmailLayoutInput): string {
  const {
    inner,
    videoBlock = "",
    ctaUrl = "",
    ctaLabel = "Continuar →",
    footerNote = "",
    title,
  } = input;

  const titleBlock = title
    ? `<h1 style="margin:0 0 20px;font-family:${brandSerifStack};font-size:24px;font-weight:400;font-style:italic;color:${brandUi.text};line-height:1.3;text-align:center;">${escapeHtml(title)}</h1>`
    : "";

  const footerNoteBlock = footerNote
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.55;color:${brandUi.textFaint};text-align:center;">${escapeHtml(footerNote)}</p>`
    : ctaUrl
      ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.55;color:${brandUi.textFaint};text-align:center;">Este enlace es personal y confidencial.</p>`
      : "";

  return `${emailHeadStyles()}
<body style="margin:0;padding:0;background:${EMAIL_CREAM};-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_CREAM};">
<tr><td align="center" class="email-shell" style="padding:32px 16px;">
<table role="presentation" width="100%" class="email-card" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid rgba(19,25,69,0.08);box-shadow:0 8px 32px rgba(19,25,69,0.06);border-top:4px solid ${brandUi.accent};" cellpadding="0" cellspacing="0">
<tr><td class="email-body" style="font-family:${brandSansStack};padding:32px 28px 36px;">
${emailBrandHeader()}
${titleBlock}
${videoBlock}
<div style="margin-top:4px;">${inner}</div>
${emailCtaBlock(ctaUrl, ctaLabel)}
${footerNoteBlock}
</td></tr>
</table>
${emailFooterSiteLink()}
</td></tr>
</table>
</body>
</html>`;
}

function inlineFormat(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function markdownToQuoteHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const parts: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      parts.push(
        `<h3 style="margin:28px 0 12px;font-family:${brandSerifStack};font-size:22px;font-weight:400;font-style:italic;color:${brandUi.text};line-height:1.3;">${inlineFormat(line.slice(4).trim())}</h3>`,
      );
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      parts.push(
        `<h2 style="margin:32px 0 14px;font-family:${brandSerifStack};font-size:26px;font-weight:400;font-style:italic;color:${brandUi.text};">${inlineFormat(line.slice(3).trim())}</h2>`,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        parts.push(`<ul style="margin:12px 0 20px;padding-left:20px;color:${brandUi.text};">`);
        inList = true;
      }
      parts.push(
        `<li style="margin:8px 0;line-height:1.65;">${inlineFormat(line.slice(2).trim())}</li>`,
      );
      continue;
    }

    closeList();
    parts.push(
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">${inlineFormat(line.trim())}</p>`,
    );
  }

  closeList();
  return parts.join("\n");
}

export function wrapQuoteEmailHtml(
  inner: string,
  videoBlock: string,
  ctaUrl: string,
  ctaLabel = "Ver propuesta y responder",
): string {
  return wrapBrandEmailHtml({ inner, videoBlock, ctaUrl, ctaLabel });
}

/** Envuelve HTML del editor de fases para enviar por mail (misma estética que presupuestos). */
export function wrapPhaseDocumentEmailHtml(title: string, innerHtml: string): string {
  return wrapBrandEmailHtml({ inner: innerHtml, title });
}

/** Notificaciones internas al admin con la misma estética (sin foto hero). */
export function wrapAdminNotificationEmailHtml(title: string, innerHtml: string): string {
  return wrapBrandEmailHtml({
    inner: innerHtml,
    title,
    footerNote: "Soulful ERP — panel de administración",
  });
}

export function buildVideoEmailBlock(video: ParsedVideo | null): string {
  if (!video) return "";

  return `<p style="margin:0 0 24px;"><a href="${escapeHtml(video.watchUrl)}" style="color:${brandUi.accent};font-size:14px;font-weight:600;text-decoration:underline;">Ver video de bienvenida →</a></p>`;
}
