import { wrapAdminNotificationEmailHtml } from "@/lib/quote-markdown-html";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";
import { resolveSiteUrl } from "@/lib/site-metadata";
import {
  erpAdminSubject,
  resolveAdminInboxEmail,
  sendResendMessage,
} from "@/lib/resend-mail";

export function resolveAdminNotificationEmail(): string {
  return resolveAdminInboxEmail();
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
  const logTag = input.logTag ?? "admin-notify";
  const to = resolveAdminInboxEmail();
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
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#333;">${escapeHtml(input.headline)}</p>`,
    `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#444;"><strong>Cliente:</strong> ${escapeHtml(input.clientName)}</p>`,
    `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#444;"><strong>Email:</strong> ${escapeHtml(input.clientEmail)}</p>`,
  ];

  if (input.projectTitle) {
    innerParts.push(
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;"><strong>Proyecto:</strong> ${escapeHtml(input.projectTitle)}</p>`,
    );
  }

  if (input.extraHtml) {
    innerParts.push(input.extraHtml);
  }

  if (adminLink) {
    innerParts.push(
      `<p style="margin:12px 0 0;font-size:14px;line-height:1.6;"><a href="${adminLink.replace(/"/g, "")}" style="color:#323FF6;text-decoration:underline;">Ver en el ERP</a></p>`,
    );
  }

  const html = wrapAdminNotificationEmailHtml(input.headline, innerParts.join("\n"));

  return sendResendMessage({
    to: [to],
    replyTo: input.replyTo?.trim() || input.clientEmail,
    subject: erpAdminSubject(input.subject.replace(/\s*—\s*Soulful Branding®\s*$/i, "")),
    text,
    html,
    attachments: await soLogoEmailAttachments(),
    logTag,
    headerRef: logTag,
  });
}
