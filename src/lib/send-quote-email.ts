import { Resend } from "resend";
import { quotePublicUrl } from "@/lib/quote-url";
import type { QuoteContent } from "@/lib/quote-types";
import { normalizeQuoteContent } from "@/lib/quote-types";
import { parseVideoUrl } from "@/lib/quote-video";
import { isBbbDeckFormat } from "@/lib/quote-bbb-deck";
import { isQuotePdfFormat } from "@/lib/quote-proposal-pdfs";
import { getQuoteProposalTemplate, resolveProposalIdFromContent } from "@/lib/quote-proposal-templates";
import {
  buildVideoEmailBlock,
  markdownToQuoteHtml,
  wrapAdminNotificationEmailHtml,
  wrapQuoteEmailHtml,
} from "@/lib/quote-markdown-html";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";

export type SendQuoteEmailPayload = {
  toEmail: string;
  toName: string;
  content: QuoteContent | unknown;
  token: string;
};

export async function sendQuoteEmailToClient(payload: SendQuoteEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[quote] RESEND_API_KEY no configurada; email al cliente omitido");
    }
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error("[quote] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida");
    return false;
  }

  const content = normalizeQuoteContent(payload.content);
  const link = quotePublicUrl(payload.token);
  const video = parseVideoUrl(content.videoUrl);
  const proposal = getQuoteProposalTemplate(resolveProposalIdFromContent(content));

  const isDeck = isBbbDeckFormat(content.format);
  const isPdf = isQuotePdfFormat(content.format);

  const text = [
    `Hola ${payload.toName},`,
    "",
    isPdf
      ? `Te comparto la propuesta ${proposal.label} (PDF) — Método Soulful Branding®.`
      : isDeck
        ? `Te comparto la propuesta ${proposal.label} — Método Soulful Branding®.`
        : content.body,
    "",
    video ? `Video: ${video.watchUrl}` : "",
    isDeck && content.total != null
      ? `Inversión de referencia: €${content.total.toLocaleString("en-US")} ${content.currency ?? "EUR"}`
      : "",
    "",
    "—",
    "Para ver la propuesta completa y responder, usá este enlace:",
    link,
  ]
    .filter(Boolean)
    .join("\n");

  const innerHtml = isPdf
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(19,25,69,0.88);">Te comparto la propuesta <strong style="color:#131945;">${proposal.label.replace(/&/g, "&amp;")}</strong> en PDF.</p>
       <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(19,25,69,0.65);">En el enlace vas a ver el documento completo y podés aprobar, consultar cambios o responder desde ahí.</p>`
    : isDeck
      ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(19,25,69,0.88);">Te comparto la propuesta <strong style="color:#131945;">${proposal.label.replace(/&/g, "&amp;")}</strong> — experiencia con el método Soulful Branding®.</p>
       <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(19,25,69,0.65);">En el enlace vas a ver la presentación completa y podés aprobar, consultar cambios o responder desde ahí.</p>`
      : content.format === "markdown"
      ? markdownToQuoteHtml(content.body)
      : `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(19,25,69,0.88);white-space:pre-wrap;">${content.body.replace(/</g, "&lt;")}</p>`;

  const html = wrapQuoteEmailHtml(
    innerHtml,
    buildVideoEmailBlock(video),
    link,
  );

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: `Tu propuesta ${proposal.label} — Soulful Branding®`,
    text,
    html,
    attachments: soLogoEmailAttachments(),
  });

  if (error) {
    console.error("[quote] Resend al cliente:", error);
    return false;
  }
  return true;
}

export async function sendQuoteResponseNotificationToAdmin(payload: {
  leadName: string;
  leadEmail: string;
  response: string;
  comment: string;
  quoteId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const from = process.env.RESEND_FROM?.trim();
  if (!from) return;

  const to = (process.env.CONTACT_TO_EMAIL?.trim() || "hola@sofiaciabattoni.com").trim();

  const text = [
    "Respuesta a presupuesto (ERP)",
    "",
    `Lead: ${payload.leadName}`,
    `Email: ${payload.leadEmail}`,
    `Respuesta: ${payload.response}`,
    payload.comment ? `Comentario: ${payload.comment}` : "",
    `ID presupuesto: ${payload.quoteId}`,
    "",
    "Revisá el lead en el admin del ERP.",
  ]
    .filter(Boolean)
    .join("\n");

  const innerHtml = `<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Lead:</strong> ${payload.leadName.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Email:</strong> ${payload.leadEmail.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Respuesta:</strong> ${payload.response.replace(/</g, "&lt;")}</p>
${payload.comment ? `<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Comentario:</strong> ${payload.comment.replace(/</g, "&lt;")}</p>` : ""}
<p style="margin:0;font-size:14px;line-height:1.6;color:rgba(19,25,69,0.45);">ID presupuesto: ${payload.quoteId.replace(/</g, "&lt;")}</p>`;

  const html = wrapAdminNotificationEmailHtml(
    `Presupuesto — ${payload.response}`,
    innerHtml,
  );

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `Presupuesto — ${payload.response} — ${payload.leadName}`,
    text,
    html,
    attachments: soLogoEmailAttachments(),
  });

  if (error) {
    console.error("[quote] Resend notificación admin:", error);
  }
}
