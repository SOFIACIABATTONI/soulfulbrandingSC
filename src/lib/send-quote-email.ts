import { Resend } from "resend";
import { quotePublicUrl } from "@/lib/quote-url";
import type { QuoteContent } from "@/lib/quote-types";
import { normalizeQuoteContent } from "@/lib/quote-types";
import { parseVideoUrl } from "@/lib/quote-video";
import { isBbbDeckFormat } from "@/lib/quote-bbb-deck";
import {
  buildVideoEmailBlock,
  markdownToQuoteHtml,
  wrapQuoteEmailHtml,
} from "@/lib/quote-markdown-html";

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

  const isDeck = isBbbDeckFormat(content.format);

  const text = [
    `Hola ${payload.toName},`,
    "",
    isDeck
      ? "Te comparto la propuesta Born & Be (Born and Be Brand ID) — Método Soulful Branding®."
      : content.body,
    "",
    video ? `Video: ${video.watchUrl}` : "",
    isDeck && content.total != null
      ? `Inversión de referencia: ${content.total.toLocaleString("en-US")} ${content.currency ?? "USD"}`
      : "",
    "",
    "—",
    "Para ver la propuesta completa y responder, usá este enlace:",
    link,
  ]
    .filter(Boolean)
    .join("\n");

  const innerHtml = isDeck
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(19,25,69,0.88);">Te comparto la propuesta <strong style="color:#131945;">Born &amp; Be</strong> — experiencia de identidad verbal y visual con el método Soulful Branding®.</p>
       <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(19,25,69,0.65);">En el enlace vas a ver la presentación completa (12 diapositivas) y podés aprobar, consultar cambios o responder desde ahí.</p>`
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
    subject: isDeck
      ? "Tu propuesta Born & Be — Soulful Branding®"
      : "Tu propuesta — Soulful Branding®",
    text,
    html,
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

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `Presupuesto — ${payload.response} — ${payload.leadName}`,
    text,
  });

  if (error) {
    console.error("[quote] Resend notificación admin:", error);
  }
}
