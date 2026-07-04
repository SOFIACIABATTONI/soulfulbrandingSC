import { brandSansStack, brandUi } from "@/lib/brand-ui";

/** Envuelve HTML del editor de fases para enviar por mail (conserva formato). */
export function wrapPhaseDocumentEmailHtml(title: string, innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:${brandUi.page};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${brandUi.page};">
<tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:640px;background:${brandUi.surface};border-radius:8px;" cellpadding="0" cellspacing="0">
<tr><td style="font-family:${brandSansStack};padding:28px 24px;">
<p style="margin:0 0 8px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${brandUi.accent};">Soulful Branding®</p>
<h1 style="margin:0 0 20px;font-size:22px;font-weight:600;color:${brandUi.text};">${title}</h1>
<div style="font-size:15px;line-height:1.7;color:${brandUi.textMuted};">${innerHtml}</div>
</td></tr></table>
</td></tr></table>
</body></html>`;
}
