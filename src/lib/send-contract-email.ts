import { Resend } from "resend";
import { accessPublicUrl } from "@/lib/access-url";
import { resolveContractHtml } from "@/lib/contract-html-templates";
import type { ContractContent } from "@/lib/contract-types";
import { normalizeContractContent } from "@/lib/contract-types";
import { wrapContractEmailHtml } from "@/lib/quote-markdown-html";
import { brandUi } from "@/lib/brand-ui";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";

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
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};font-style:italic;">${payload.personalNote.trim().replace(/</g, "&lt;")}</p>`
    : "";

  const innerHtml = `${noteBlock}<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">Te comparto el contrato para el proyecto <strong style="color:${brandUi.text};">${payload.projectTitle.replace(/</g, "&lt;")}</strong>. Podés leerlo y aceptarlo con un click desde el enlace.</p>`;

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

  const html = wrapContractEmailHtml(innerHtml, link, "Ver contrato y aceptar →");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: "Tu contrato — Soulful Branding®",
    text,
    html,
    attachments: soLogoEmailAttachments(),
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
  typedName: string;
  acceptedAt: Date;
  contentHash: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const from = process.env.RESEND_FROM?.trim();
  if (!from) return;

  const to = (process.env.CONTACT_TO_EMAIL?.trim() || "hola@sofiaciabattoni.com").trim();
  const acceptedLabel = payload.acceptedAt.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const text = [
    "Contrato aceptado (ERP)",
    "",
    `Cliente: ${payload.clientName}`,
    `Nombre declarado: ${payload.typedName}`,
    `Email: ${payload.clientEmail}`,
    `Proyecto: ${payload.projectTitle}`,
    `Aceptado: ${acceptedLabel}`,
    `Huella SHA-256: ${payload.contentHash}`,
    `ID proyecto: ${payload.projectId}`,
    "",
    "Descargá el certificado desde el admin del ERP.",
  ].join("\n");

  const innerHtml = `<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Cliente:</strong> ${payload.clientName.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Nombre declarado:</strong> ${payload.typedName.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Email:</strong> ${payload.clientEmail.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Proyecto:</strong> ${payload.projectTitle.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Aceptado:</strong> ${acceptedLabel.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:rgba(19,25,69,0.45);">Huella SHA-256: ${payload.contentHash.replace(/</g, "&lt;")}</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:rgba(19,25,69,0.45);">ID proyecto: ${payload.projectId.replace(/</g, "&lt;")}</p>`;

  const html = wrapContractEmailHtml(
    innerHtml,
    "",
    "",
    `Contrato aceptado — ${payload.clientName}`,
  );

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `Contrato aceptado — ${payload.clientName}`,
    text,
    html,
    attachments: soLogoEmailAttachments(),
  });

  if (error) {
    console.error("[contract] Resend notificación admin:", error);
  }
}

export async function sendContractAcceptedConfirmationToClient(payload: {
  toEmail: string;
  toName: string;
  projectTitle: string;
  typedName: string;
  acceptedAt: Date;
  contentHash: string;
  pdfBytes: Uint8Array;
  pdfFilename: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[contract] RESEND_API_KEY no configurada; confirmación al cliente omitida");
    }
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error("[contract] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida");
    return false;
  }

  const acceptedLabel = payload.acceptedAt.toLocaleString("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const innerHtml = `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">Hola ${payload.toName.replace(/</g, "&lt;")}, registramos tu aceptación del contrato para <strong style="color:${brandUi.text};">${payload.projectTitle.replace(/</g, "&lt;")}</strong>.</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Nombre declarado:</strong> ${payload.typedName.replace(/</g, "&lt;")}<br /><strong style="color:${brandUi.text};">Fecha:</strong> ${acceptedLabel.replace(/</g, "&lt;")}</p>
<div style="margin:0 0 16px;padding:14px 16px;border:1px solid rgba(240,49,114,0.35);background:#fff7fa;">
<p style="margin:0 0 5px;font-size:12px;line-height:1.5;color:${brandUi.text};font-weight:700;">Huella digital SHA-256</p>
<p style="margin:0;font-family:Consolas,Monaco,monospace;font-size:10px;line-height:1.55;color:${brandUi.textMuted};word-break:break-all;">${payload.contentHash.replace(/</g, "&lt;")}</p>
</div>
<p style="margin:0;font-size:14px;line-height:1.7;color:${brandUi.textMuted};">Adjuntamos un PDF con el registro de aceptación y el texto del contrato.</p>`;

  const text = [
    `Hola ${payload.toName},`,
    "",
    `Registramos tu aceptación del contrato para "${payload.projectTitle}".`,
    `Nombre declarado: ${payload.typedName}`,
    `Fecha: ${acceptedLabel}`,
    `Huella SHA-256: ${payload.contentHash}`,
    "",
    "Adjuntamos el certificado en PDF.",
  ].join("\n");

  const html = wrapContractEmailHtml(
    innerHtml,
    "",
    "",
    "Contrato aceptado",
  );

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: "Contrato aceptado — Soulful Branding®",
    text,
    html,
    attachments: [
      ...soLogoEmailAttachments(),
      {
        filename: payload.pdfFilename,
        content: Buffer.from(payload.pdfBytes).toString("base64"),
        contentType: "application/pdf",
      },
    ],
  });

  if (error) {
    console.error("[contract] Resend confirmación cliente:", error);
    return false;
  }
  return true;
}

export function contractBodyToHtml(content: ContractContent | unknown): string {
  const c = normalizeContractContent(content);
  return resolveContractHtml(c);
}
