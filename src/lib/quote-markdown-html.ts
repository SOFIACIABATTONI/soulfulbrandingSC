import type { ParsedVideo } from "@/lib/quote-video";
import { resolveSiteUrl } from "@/lib/site-metadata";
import { brandSansStack, brandSerifStack, brandUi } from "@/lib/brand-ui";
import { SO_LOGO_EMAIL_CID } from "@/lib/brand-so-logo";

/** Convierte markdown simple (###, **, listas) a HTML para correos — estilo sitio (claro). */

const EMAIL_CREAM = "#FFFFFF";

export type BrandEmailLayoutInput = {
  inner: string;
  videoBlock?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  footerNote?: string;
  title?: string;
  /** Borde fucsia completo + logo SÓ; contrato usa una composición compacta propia. */
  cardVariant?: "default" | "fuchsia-frame" | "contract-frame";
  logoMark?: string;
  /** URL absoluta del logo SÓ (PNG/SVG) en mails. */
  logoImageUrl?: string;
  /** Content-ID del logo adjunto inline (`cid:…` en el HTML). */
  logoImageCid?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailBrandHeader(
  logoMark?: string,
  logoImageUrl?: string,
  logoImageCid?: string,
  compact = false,
): string {
  const width = compact ? 42 : 80;
  const height = compact ? 38 : 72;
  const marginBottom = compact ? 24 : 36;
  const paddingTop = compact ? 6 : 16;
  if (logoImageCid?.trim()) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 ${marginBottom}px;">
<tr><td align="center" style="padding-top:${paddingTop}px;">
<img src="cid:${escapeHtml(logoImageCid.trim())}" width="${width}" height="${height}" alt="Soulful Branding" style="display:block;border:0;outline:none;height:auto;max-width:${width}px;" />
</td></tr>
</table>`;
  }
  if (logoImageUrl?.trim()) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 ${marginBottom}px;">
<tr><td align="center" style="padding-top:${paddingTop}px;">
<img src="${escapeHtml(logoImageUrl.trim())}" width="${width}" height="${height}" alt="Soulful Branding" style="display:block;border:0;outline:none;height:auto;max-width:${width}px;" />
</td></tr>
</table>`;
  }
  if (logoMark?.trim()) {
    return `<p style="margin:8px 0 28px;font-family:${brandSansStack};font-size:42px;font-weight:700;color:${brandUi.accent};text-align:center;line-height:1;">${escapeHtml(logoMark.trim())}</p>`;
  }
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
    .email-gutter { width: 24px !important; }
    .email-content { padding: 40px 0 44px !important; }
    .email-contract-gutter { width: 20px !important; }
    .email-contract-content { padding: 28px 0 30px !important; }
    .email-cta { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
  }
</style>
</head>`;
}

function emailCtaBlock(ctaUrl: string, ctaLabel: string): string {
  if (!ctaLabel.trim() || !ctaUrl.trim()) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0 0;"><tr><td align="center">
<a href="${escapeHtml(ctaUrl)}" class="email-cta" style="display:inline-block;background:${brandUi.accent};color:#ffffff;text-decoration:none;padding:15px 32px;font-size:14px;font-weight:600;border-radius:999px;letter-spacing:0.02em;">${escapeHtml(ctaLabel)}</a>
</td></tr></table>`;
}

function emailFooterSiteLink(): string {
  const site = resolveSiteUrl();
  const isLocal = /localhost|127\.0\.0\.1/i.test(site);
  const href = isLocal ? "https://www.sofiaciabattoni.com" : site;
  const label = "sofiaciabattoni.com";
  return `<p style="margin:18px 0 0;font-family:${brandSansStack};font-size:11px;line-height:1.5;color:rgba(19,25,69,0.38);text-align:center;">Soulful Branding® · <a href="${escapeHtml(href)}" style="color:rgba(19,25,69,0.45);text-decoration:underline;">${label}</a></p>`;
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
    cardVariant = "default",
    logoMark,
    logoImageUrl,
    logoImageCid,
  } = input;

  const isFuchsiaFrame = cardVariant === "fuchsia-frame";
  const isContractFrame = cardVariant === "contract-frame";
  const isFramed = isFuchsiaFrame || isContractFrame;
  const bodyPadding = isContractFrame ? "32px 0 32px" : isFuchsiaFrame ? "48px 0" : "32px 28px 36px";
  const bodyClass = isContractFrame
    ? "email-contract-content"
    : isFuchsiaFrame
      ? "email-content"
      : "email-body";
  const gutterWidth = isContractFrame ? 32 : 44;
  const gutterClass = isContractFrame ? "email-contract-gutter" : "email-gutter";
  const horizontalGutter = isFramed
    ? `<td class="${gutterClass}" width="${gutterWidth}" style="width:${gutterWidth}px;font-size:0;line-height:0;">&nbsp;</td>`
    : "";

  const cardBorderStyle =
    isFuchsiaFrame
      ? `border:2px solid ${brandUi.accent};box-shadow:0 8px 32px rgba(240,49,114,0.08);`
      : isContractFrame
        ? `border:1px solid ${brandUi.accent};box-shadow:0 6px 24px rgba(240,49,114,0.05);`
      : `border:1px solid rgba(19,25,69,0.08);box-shadow:0 8px 32px rgba(19,25,69,0.06);border-top:4px solid ${brandUi.accent};`;
  const cardMaxWidth = isContractFrame ? 520 : 560;

  const titleBlock = title
    ? `<h1 style="margin:0 0 20px;font-family:${brandSerifStack};font-size:24px;font-weight:400;font-style:italic;color:${brandUi.text};line-height:1.3;text-align:center;">${escapeHtml(title)}</h1>`
    : "";

  const footerNoteBlock = footerNote
    ? `<p style="margin:32px 0 4px;font-size:12px;line-height:1.55;color:${brandUi.textFaint};text-align:center;">${escapeHtml(footerNote)}</p>`
    : ctaUrl
      ? `<p style="margin:32px 0 4px;font-size:12px;line-height:1.55;color:${brandUi.textFaint};text-align:center;">Este enlace es personal y confidencial.</p>`
      : "";

  return `${emailHeadStyles()}
<body style="margin:0;padding:0;background:${EMAIL_CREAM};-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_CREAM};">
<tr><td align="center" class="email-shell" style="padding:32px 16px;">
<table role="presentation" width="100%" class="email-card" style="max-width:${cardMaxWidth}px;background:#FFFFFF;border-radius:12px;overflow:hidden;${cardBorderStyle}" cellpadding="0" cellspacing="0">
<tr><td style="padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
${horizontalGutter}
<td class="${bodyClass}" style="font-family:${brandSansStack};padding:${bodyPadding};">
${emailBrandHeader(logoMark, logoImageUrl, logoImageCid, isContractFrame)}
${titleBlock}
${videoBlock}
<div style="margin-top:8px;">${inner}</div>
${emailCtaBlock(ctaUrl, ctaLabel)}
${footerNoteBlock}
</td>
${horizontalGutter}
</tr>
</table>
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
  return wrapBrandEmailHtml({
    inner,
    videoBlock,
    ctaUrl,
    ctaLabel,
    cardVariant: "fuchsia-frame",
    logoImageCid: SO_LOGO_EMAIL_CID,
  });
}

/** Variante compacta reservada para contratos. */
export function wrapContractEmailHtml(
  inner: string,
  ctaUrl = "",
  ctaLabel = "",
  title?: string,
): string {
  return wrapBrandEmailHtml({
    inner,
    ctaUrl,
    ctaLabel,
    title,
    cardVariant: "contract-frame",
    logoImageCid: SO_LOGO_EMAIL_CID,
  });
}

/** Envuelve HTML del editor de fases para enviar por mail (misma estética que presupuestos). */
export function wrapPhaseDocumentEmailHtml(title: string, innerHtml: string): string {
  return wrapBrandEmailHtml({
    inner: innerHtml,
    title,
    cardVariant: "fuchsia-frame",
    logoImageCid: SO_LOGO_EMAIL_CID,
  });
}

/** Notificaciones internas al admin con la misma estética (sin foto hero). */
export function wrapAdminNotificationEmailHtml(title: string, innerHtml: string): string {
  return wrapBrandEmailHtml({
    inner: innerHtml,
    title,
    cardVariant: "fuchsia-frame",
    logoImageCid: SO_LOGO_EMAIL_CID,
    footerNote: "Soulful ERP — panel de administración",
  });
}

export function buildVideoEmailBlock(video: ParsedVideo | null): string {
  if (!video) return "";

  return `<p style="margin:0 0 24px;"><a href="${escapeHtml(video.watchUrl)}" style="color:${brandUi.accent};font-size:14px;font-weight:600;text-decoration:underline;">Ver video de bienvenida →</a></p>`;
}
