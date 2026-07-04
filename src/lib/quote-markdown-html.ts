import type { ParsedVideo } from "@/lib/quote-video";
import { brandSansStack, brandSerifStack, brandUi } from "@/lib/brand-ui";

/** Convierte markdown simple (###, **, listas) a HTML para correos — estilo sitio (claro). */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

export function wrapQuoteEmailHtml(inner: string, videoBlock: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:${brandUi.page};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${brandUi.page};">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" style="max-width:600px;background:${brandUi.surface};border-radius:8px;" cellpadding="0" cellspacing="0">
<tr><td style="font-family:${brandSansStack};padding:32px 28px;">
<p style="margin:0 0 8px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${brandUi.accent};">Soulful Branding®</p>
${videoBlock}
<div style="margin-top:8px;">${inner}</div>
<table cellpadding="0" cellspacing="0" style="margin:36px 0 0;"><tr><td>
<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${brandUi.accent};color:#ffffff;text-decoration:none;padding:14px 28px;font-size:14px;font-weight:600;border-radius:4px;">Ver propuesta y responder</a>
</td></tr></table>
<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:${brandUi.textFaint};">Este enlace es personal y confidencial.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildVideoEmailBlock(video: ParsedVideo | null): string {
  if (!video) return "";

  const thumb =
    video.thumbnailUrl &&
    `<a href="${escapeHtml(video.watchUrl)}" style="display:block;margin:0 0 20px;text-decoration:none;"><img src="${escapeHtml(video.thumbnailUrl)}" alt="Ver video" width="560" style="max-width:100%;border-radius:6px;border:1px solid ${brandUi.border};"/></a>`;

  return `${thumb ?? ""}
<p style="margin:0 0 24px;"><a href="${escapeHtml(video.watchUrl)}" style="color:${brandUi.accent};font-size:14px;font-weight:600;text-decoration:underline;">Ver video de bienvenida →</a></p>`;
}
