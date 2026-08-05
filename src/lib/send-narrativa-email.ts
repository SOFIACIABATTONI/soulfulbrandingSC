import { Resend } from "resend";
import { accessPublicUrl } from "@/lib/access-url";
import { markdownToQuoteHtml, wrapQuoteEmailHtml } from "@/lib/quote-markdown-html";
import { brandUi } from "@/lib/brand-ui";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";

export type SendNarrativaEmailPayload = {
  toEmail: string;
  toName: string;
  projectTitle: string;
  token: string;
  personalNote?: string;
};

export async function sendNarrativaEmailToClient(
  payload: SendNarrativaEmailPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[narrativa] RESEND_API_KEY no configurada; email al cliente omitido");
    }
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error("[narrativa] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida");
    return false;
  }

  const link = accessPublicUrl("narrativa", payload.token);
  const noteBlock = payload.personalNote?.trim()
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};font-style:italic;">${payload.personalNote.trim().replace(/</g, "&lt;")}</p>`
    : "";

  const introHtml = markdownToQuoteHtml(
    `Tu **narrativa de marca** para el proyecto *${payload.projectTitle}* está lista para revisar.\n\nIncluye esencia, visión, mensajes clave, tono y propuesta de valor — el mapa estratégico del proceso.`,
  );

  const innerHtml = `${noteBlock}${introHtml}<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${brandUi.textMuted};">Abrí el enlace para ver el documento completo en el portal Soulful Branding®.</p>`;

  const text = [
    `Hola ${payload.toName},`,
    "",
    payload.personalNote?.trim() ?? "",
    "",
    `Tu narrativa de marca para "${payload.projectTitle}" está lista.`,
    "",
    "Ver documento:",
    link,
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapQuoteEmailHtml(innerHtml, "", link, "Ver narrativa de marca →");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: "Tu narrativa de marca — Soulful Branding®",
    text,
    html,
    attachments: await soLogoEmailAttachments(),
  });

  if (error) {
    console.error("[narrativa] Resend al cliente:", error);
    return false;
  }
  return true;
}
