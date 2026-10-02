import { buildOraculoAccessEmailContent } from "@/lib/oraculo-delivery-email";
import {
  getOraculoDeliveryYoutubeUrl,
  loadOraculoDeliveryFileAttachments,
} from "@/lib/oraculo-delivery-assets";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";
import { resolveResendFrom, sendResendMessage } from "@/lib/resend-mail";

export type SendOraculoAccessEmailPayload = {
  toEmail: string;
  toName: string;
  downloadLink: string;
  youtubeLink?: string | null;
};

export async function sendOraculoAccessEmailToClient(
  payload: SendOraculoAccessEmailPayload,
): Promise<boolean> {
  const youtubeUrl =
    payload.youtubeLink?.trim() || getOraculoDeliveryYoutubeUrl() || null;

  const fileAttachments = await loadOraculoDeliveryFileAttachments();
  const { subject, text, html } = buildOraculoAccessEmailContent(
    payload.downloadLink,
    payload.toName,
    { youtubeUrl, filesAttached: fileAttachments.length > 0 },
  );

  const from = resolveResendFrom();
  if (!from) return false;

  const logoAttachments = await soLogoEmailAttachments();
  const attachments = [
    ...logoAttachments,
    ...fileAttachments.map((f) => ({
      filename: f.filename,
      content: f.content,
      contentType: f.contentType,
    })),
  ];

  return sendResendMessage({
    to: payload.toEmail.trim(),
    subject,
    text,
    html,
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    attachments,
    logTag: "oraculo-access",
    headerRef: "oraculo-access",
  });
}
