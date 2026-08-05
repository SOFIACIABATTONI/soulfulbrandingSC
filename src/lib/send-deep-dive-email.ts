import { Resend } from "resend";
import { brandUi } from "@/lib/brand-ui";
import { DEEP_DIVE_CALENDAR_URL } from "@/lib/deep-dive-calendar";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";
import { wrapQuoteEmailHtml } from "@/lib/quote-markdown-html";

export type SendDeepDiveEmailPayload = {
  toEmail: string;
  toName: string;
  projectTitle: string;
  personalNote?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendDeepDiveEmailToClient(
  payload: SendDeepDiveEmailPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[deep-dive] RESEND_API_KEY no configurada; email omitido");
    }
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error("[deep-dive] RESEND_FROM es obligatorio");
    return false;
  }

  const noteBlock = payload.personalNote?.trim()
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};font-style:italic;">${escapeHtml(payload.personalNote.trim())}</p>`
    : "";
  const innerHtml = `${noteBlock}
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">Llegó el momento de profundizar en la narrativa y preparar el próximo paso de <strong style="color:${brandUi.text};">${escapeHtml(payload.projectTitle)}</strong>.</p>
<p style="margin:0;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">Elegí en el calendario el horario que mejor te resulte para nuestra sesión Deep Dive.</p>`;

  const text = [
    `Hola ${payload.toName},`,
    "",
    payload.personalNote?.trim() ?? "",
    "",
    `Agendá la sesión Deep Dive para el proyecto "${payload.projectTitle}":`,
    DEEP_DIVE_CALENDAR_URL,
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapQuoteEmailHtml(
    innerHtml,
    "",
    DEEP_DIVE_CALENDAR_URL,
    "Agendar sesión Deep Dive →",
  );

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: "Agendá tu sesión Deep Dive — Soulful Branding®",
    text,
    html,
    attachments: soLogoEmailAttachments(),
  });

  if (error) {
    console.error("[deep-dive] Resend:", error);
    return false;
  }
  return true;
}
