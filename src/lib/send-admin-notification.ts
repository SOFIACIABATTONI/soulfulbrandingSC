import { Resend } from "resend";
import { wrapAdminNotificationEmailHtml } from "@/lib/quote-markdown-html";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";
import { resolveSiteUrl } from "@/lib/site-metadata";

export function resolveAdminNotificationEmail(): string {
  return (process.env.CONTACT_TO_EMAIL?.trim() || "hola@sofiaciabattoni.com").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type SendAdminNotificationInput = {
  subject: string;
  headline: string;
  clientName: string;
  clientEmail: string;
  projectTitle?: string;
  projectId?: string;
  adminHash?: string;
  adminPath?: string;
  extraLines?: string[];
  extraHtml?: string;
  replyTo?: string;
  logTag?: string;
};

export async function sendAdminNotificationEmail(
  input: SendAdminNotificationInput,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const logTag = input.logTag ?? "admin-notify";
  if (!apiKey) {
    console.warn(`[${logTag}] RESEND_API_KEY no configurada; notificación omitida`);
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error(`[${logTag}] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida`);
    return false;
  }

  const to = resolveAdminNotificationEmail();
  const base = resolveSiteUrl().replace(/\/$/, "");

  const adminLink = input.adminPath
    ? `${base}${input.adminPath.startsWith("/") ? input.adminPath : `/${input.adminPath}`}`
    : input.projectId
      ? `${base}/admin/proyectos/${input.projectId}${input.adminHash ?? ""}`
      : null;

  const text = [
    input.headline,
    "",
    `Cliente: ${input.clientName}`,
    `Email: ${input.clientEmail}`,
    ...(input.projectTitle ? [`Proyecto: ${input.projectTitle}`] : []),
    ...(input.extraLines ?? []),
    ...(adminLink ? ["", `Ver en el ERP: ${adminLink}`] : []),
  ].join("\n");

  const innerParts = [
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#131945;font-weight:600;">${escapeHtml(input.headline)}</p>`,
    `<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Cliente:</strong> ${escapeHtml(input.clientName)}</p>`,
    `<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Email:</strong> ${escapeHtml(input.clientEmail)}</p>`,
  ];

  if (input.projectTitle) {
    innerParts.push(
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Proyecto:</strong> ${escapeHtml(input.projectTitle)}</p>`,
    );
  }

  if (input.extraHtml) {
    innerParts.push(input.extraHtml);
  }

  if (adminLink) {
    innerParts.push(
      `<p style="margin:0;font-size:14px;line-height:1.6;"><a href="${adminLink.replace(/"/g, "")}" style="color:#323FF6;text-decoration:underline;">Ver en el ERP →</a></p>`,
    );
  }

  const html = wrapAdminNotificationEmailHtml(input.headline, innerParts.join("\n"));

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: input.replyTo?.trim() || input.clientEmail,
    subject: input.subject,
    text,
    html,
    attachments: await soLogoEmailAttachments(),
  });

  if (error) {
    console.error(`[${logTag}] Resend:`, error);
    return false;
  }

  return true;
}
