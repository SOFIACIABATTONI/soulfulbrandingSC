import { Resend } from "resend";
import { accessPublicUrl } from "@/lib/access-url";
import { markdownToQuoteHtml, wrapQuoteEmailHtml } from "@/lib/quote-markdown-html";
import type { ContractContent } from "@/lib/contract-types";
import { normalizeContractContent } from "@/lib/contract-types";

export type SendContractEmailPayload = {
  toEmail: string;
  toName: string;
  projectTitle: string;
  token: string;
  personalNote?: string;
};

export async function sendContractEmailToClient(
  payload: SendContractEmailPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[contract] RESEND_API_KEY no configurada; email al cliente omitido");
    }
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error("[contract] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida");
    return false;
  }

  const link = accessPublicUrl("contrato", payload.token);
  const noteBlock = payload.personalNote?.trim()
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:rgba(249,243,219,0.75);font-style:italic;">${payload.personalNote.trim().replace(/</g, "&lt;")}</p>`
    : "";

  const innerHtml = `${noteBlock}<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(249,243,219,0.88);">Te comparto el contrato para el proyecto <strong style="color:#F9F3DB;">${payload.projectTitle.replace(/</g, "&lt;")}</strong>. Podés leerlo y aceptarlo con un click desde el enlace.</p>`;

  const text = [
    `Hola ${payload.toName},`,
    "",
    payload.personalNote?.trim() ?? "",
    "",
    `Te comparto el contrato para el proyecto "${payload.projectTitle}".`,
    "",
    "Para verlo y aceptarlo, usá este enlace:",
    link,
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapQuoteEmailHtml(innerHtml, "", link);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: "Tu contrato — Soulful Branding®",
    text,
    html,
  });

  if (error) {
    console.error("[contract] Resend al cliente:", error);
    return false;
  }
  return true;
}

export async function sendContractAcceptedNotificationToAdmin(payload: {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  projectId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const from = process.env.RESEND_FROM?.trim();
  if (!from) return;

  const to = (process.env.CONTACT_TO_EMAIL?.trim() || "hola@sofiaciabattoni.com").trim();

  const text = [
    "Contrato aceptado (ERP)",
    "",
    `Cliente: ${payload.clientName}`,
    `Email: ${payload.clientEmail}`,
    `Proyecto: ${payload.projectTitle}`,
    `ID proyecto: ${payload.projectId}`,
    "",
    "El estado del proyecto se actualizó. Revisá el admin del ERP.",
  ].join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `Contrato aceptado — ${payload.clientName}`,
    text,
  });

  if (error) {
    console.error("[contract] Resend notificación admin:", error);
  }
}

export function contractBodyToHtml(content: ContractContent | unknown): string {
  const c = normalizeContractContent(content);
  if (c.format === "markdown") {
    return markdownToQuoteHtml(c.body);
  }
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(249,243,219,0.88);white-space:pre-wrap;">${c.body.replace(/</g, "&lt;")}</p>`;
}
