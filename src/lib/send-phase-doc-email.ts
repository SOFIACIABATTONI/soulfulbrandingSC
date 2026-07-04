import { Resend } from "resend";
import { accessPublicUrl } from "@/lib/access-url";
import type { PhaseSendConfig } from "@/lib/phase-client-flow";
import { markdownToQuoteHtml, wrapQuoteEmailHtml } from "@/lib/quote-markdown-html";
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
  const noteBlock = payload.personalNote?.trim()
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};font-style:italic;">${payload.personalNote.trim().replace(/</g, "&lt;")}</p>`
    : "";

  const introHtml = markdownToQuoteHtml(
    `${payload.config.emailIntro}\n\nProyecto: **${payload.projectTitle}**.`,
  );

  const innerHtml = `${noteBlock}${introHtml}<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${brandUi.textMuted};">Abrí el enlace para ver el documento y confirmar que lo recibiste.</p>`;

  const text = [
    `Hola ${payload.toName},`,
    "",
    payload.personalNote?.trim() ?? "",
    "",
    `${payload.config.title} — "${payload.projectTitle}"`,
    "",
    "Ver documento:",
    link,
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapQuoteEmailHtml(
    innerHtml,
    `Ver ${payload.config.portalTitle.toLowerCase()} →`,
    link,
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

  const text = [
    `${payload.phaseLabel} — respuesta del cliente`,
    "",
    `Cliente: ${payload.clientName}`,
    `Email: ${payload.clientEmail}`,
    `Proyecto: ${payload.projectTitle}`,
    "",
    `Ver proyecto: ${base}/admin/proyectos/${payload.projectId}${payload.hash}`,
  ].join("\n");

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: [to],
    subject: `${payload.subject} — ${payload.clientName}`,
    text,
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
