import { Resend } from "resend";
import { accessPublicUrl } from "@/lib/access-url";
import type { PhaseSendConfig } from "@/lib/phase-client-flow";
import { isPermanentAccessPurpose } from "@/lib/access-token";
import { markdownToQuoteHtml, wrapAdminNotificationEmailHtml, wrapPhaseDocumentEmailHtml, wrapQuoteEmailHtml } from "@/lib/quote-markdown-html";
import { stripHtmlToPlainText } from "@/lib/contract-acceptance";
import { brandUi } from "@/lib/brand-ui";

export type SendPhaseDocEmailPayload = {
  config: PhaseSendConfig;
  toEmail: string;
  toName: string;
  projectTitle: string;
  token: string;
  personalNote?: string;
};

export async function sendPhaseDocEmailToClient(
  payload: SendPhaseDocEmailPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[phase-${payload.config.phaseKey}] RESEND_API_KEY no configurada`);
    }
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) return false;

  const link = accessPublicUrl(payload.config.purpose, payload.token);
  const isPermanent = isPermanentAccessPurpose(payload.config.purpose);
  const noteBlock = payload.personalNote?.trim()
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};font-style:italic;">${payload.personalNote.trim().replace(/</g, "&lt;")}</p>`
    : "";

  const introHtml = markdownToQuoteHtml(
    `${payload.config.emailIntro}\n\nProyecto: **${payload.projectTitle}**.`,
  );

  const innerHtml = `${noteBlock}${introHtml}<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${brandUi.textMuted};">${
    isPermanent && payload.config.phaseKey === "manual"
      ? "Guardá este enlace: no vence y podés descargar tu manual en PDF cuando quieras."
      : isPermanent
        ? "Guardá este enlace: no vence y podés ver y descargar tu documento cuando quieras."
        : "Abrí el enlace para ver el documento y confirmar que lo recibiste."
  }</p>`;

  const text = [
    `Hola ${payload.toName},`,
    "",
    payload.personalNote?.trim() ?? "",
    "",
    `${payload.config.title} — "${payload.projectTitle}"`,
    "",
    "Ver documento:",
    link,
    "",
    isPermanent
      ? "Este enlace no vence. Podés descargar el documento desde el portal."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapQuoteEmailHtml(
    innerHtml,
    "",
    link,
    `Ver ${payload.config.portalTitle.toLowerCase()} →`,
  );

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: payload.config.emailSubject,
    text,
    html,
  });

  if (error) {
    console.error(`[phase-${payload.config.phaseKey}] Resend:`, error);
    return false;
  }
  return true;
}

export async function sendPhaseInternalNotesEmail(payload: {
  phaseTitle: string;
  projectTitle: string;
  clientName: string;
  htmlBody: string;
  personalNote?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[phase-notes] RESEND_API_KEY no configurada");
    }
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) return false;

  const to = (process.env.CONTACT_TO_EMAIL?.trim() || "hola@sofiaciabattoni.com").trim();
  const noteBlock = payload.personalNote?.trim()
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};font-style:italic;">${payload.personalNote.trim().replace(/</g, "&lt;")}</p>`
    : "";

  const introHtml = `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">Copia de <strong style="color:${brandUi.text};">${payload.phaseTitle.replace(/</g, "&lt;")}</strong> — proyecto <strong style="color:${brandUi.text};">${payload.projectTitle.replace(/</g, "&lt;")}</strong> (${payload.clientName.replace(/</g, "&lt;")}).</p>`;

  const innerHtml = `${noteBlock}${introHtml}<div class="phase-doc-html">${payload.htmlBody}</div>`;
  const html = wrapPhaseDocumentEmailHtml(payload.phaseTitle, innerHtml);

  const plainNotes = stripHtmlToPlainText(payload.htmlBody);
  const text = [
    payload.phaseTitle,
    `Proyecto: ${payload.projectTitle}`,
    `Cliente: ${payload.clientName}`,
    "",
    payload.personalNote?.trim() ?? "",
    "",
    plainNotes,
  ]
    .filter(Boolean)
    .join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `${payload.phaseTitle} — ${payload.projectTitle}`,
    text,
    html,
  });

  if (error) {
    console.error("[phase-notes] Resend:", error);
    return false;
  }
  return true;
}

export async function sendPhaseResponseNotificationToAdmin(payload: {
  subject: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  projectId: string;
  phaseLabel: string;
  hash: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const from = process.env.RESEND_FROM?.trim();
  if (!from) return;

  const to = (process.env.CONTACT_TO_EMAIL?.trim() || "hola@sofiaciabattoni.com").trim();
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  const adminLink = `${base}/admin/proyectos/${payload.projectId}${payload.hash}`;
  const text = [
    `${payload.phaseLabel} — respuesta del cliente`,
    "",
    `Cliente: ${payload.clientName}`,
    `Email: ${payload.clientEmail}`,
    `Proyecto: ${payload.projectTitle}`,
    "",
    `Ver proyecto: ${adminLink}`,
  ].join("\n");

  const innerHtml = `<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Cliente:</strong> ${payload.clientName.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Email:</strong> ${payload.clientEmail.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Proyecto:</strong> ${payload.projectTitle.replace(/</g, "&lt;")}</p>
<p style="margin:0;font-size:14px;line-height:1.6;"><a href="${adminLink.replace(/"/g, "")}" style="color:#323FF6;text-decoration:underline;">Ver proyecto en el ERP →</a></p>`;

  const html = wrapAdminNotificationEmailHtml(payload.subject, innerHtml);

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: [to],
    subject: `${payload.subject} — ${payload.clientName}`,
    text,
    html,
  });
}

export async function sendNarrativaAckNotificationToAdmin(payload: {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  projectId: string;
}): Promise<void> {
  await sendPhaseResponseNotificationToAdmin({
    subject: "Narrativa recibida",
    phaseLabel: "Narrativa de marca",
    hash: "#fase-narrativa",
    ...payload,
  });
}
