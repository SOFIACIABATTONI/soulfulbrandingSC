import { brandUi } from "@/lib/brand-ui";
import { parseOraculoReceiptUrl } from "@/lib/oraculo-order-parse";
import { wrapAdminNotificationEmailHtml } from "@/lib/quote-markdown-html";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";
import { isLocalDevUploadUrl, readLocalDevUpload } from "@/lib/local-dev-upload-store";
import { erpAdminSubject, resolveAdminInboxEmail, sendResendMessage } from "@/lib/resend-mail";

const MAX_ATTACH_BYTES = 5 * 1024 * 1024;

export type OraculoOrderAdminEmailPayload = {
  name: string;
  email: string;
  message: string;
  contactMessageId: string;
};

async function fetchReceiptAttachment(receiptUrl: string) {
  try {
    if (isLocalDevUploadUrl(receiptUrl)) {
      const m = /^\/api\/admin\/dev-upload\/([^/]+)\/(.+)$/.exec(receiptUrl);
      if (!m) return undefined;
      const local = await readLocalDevUpload(m[1], m[2]);
      if (!local || local.buf.length > MAX_ATTACH_BYTES) return undefined;
      return {
        filename: local.fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "comprobante",
        content: local.buf,
        contentType: "application/octet-stream",
      };
    }

    const res = await fetch(receiptUrl, { signal: AbortSignal.timeout(25_000) });
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_ATTACH_BYTES) return undefined;
    const rawName = receiptUrl.split("/").pop()?.split("?")[0] || "comprobante";
    const filename = rawName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "comprobante";
    const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
    return { filename, content: buf, contentType };
  } catch (e) {
    console.warn("[oraculo-admin] receipt attach failed", e);
    return undefined;
  }
}

export async function sendOraculoOrderAdminNotification(
  payload: OraculoOrderAdminEmailPayload,
): Promise<void> {
  const to = resolveAdminInboxEmail();
  const { name, email, message, contactMessageId } = payload;
  const receiptUrl = parseOraculoReceiptUrl(message);

  const adminPath = `/admin/leads?tab=mensajes`;
  const text = [
    "Nuevo pedido Oráculo Raíz con comprobante",
    "",
    `Nombre: ${name}`,
    `Email del cliente: ${email}`,
    receiptUrl ? `Comprobante: ${receiptUrl}` : "",
    "",
    "Mensaje completo:",
    message,
    "",
    `Revisá en el ERP: ${adminPath}`,
  ]
    .filter(Boolean)
    .join("\n");

  const receiptBlock = receiptUrl
    ? `<p style="margin:0 0 16px;"><a href="${receiptUrl.replace(/"/g, "")}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:${brandUi.accent};color:#fff;font-size:14px;font-weight:600;text-decoration:none;">Ver comprobante de pago →</a></p>
<p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:#666;">Si el adjunto no se ve, usá el enlace. Desde <strong>Mensajes recibidos</strong> podés enviar el mail de acceso al material cuando confirmes el pago.</p>`
    : `<p style="margin:0 0 14px;font-size:13px;color:#b45309;">No se detectó URL de comprobante en el mensaje.</p>`;

  const innerHtml = `<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#444;"><strong>Oráculo Raíz — nueva compra</strong></p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#444;"><strong>Nombre:</strong> ${name.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444;"><strong>Email:</strong> <a href="mailto:${email.replace(/"/g, "")}" style="color:${brandUi.blue};text-decoration:underline;">${email.replace(/</g, "&lt;")}</a></p>
${receiptBlock}
<div style="margin:0;padding:14px;border-radius:6px;background:#f7f7f7;border:1px solid #e8e8e8;">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888;">Detalle</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#131945;white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</p>
</div>
<p style="margin:16px 0 0;font-size:12px;color:#888;">ID mensaje: ${contactMessageId.replace(/</g, "&lt;")}</p>`;

  const html = wrapAdminNotificationEmailHtml("Oráculo Raíz — comprobante", innerHtml);

  const logoAttachments = await soLogoEmailAttachments();
  const receiptAttachment = receiptUrl ? await fetchReceiptAttachment(receiptUrl) : undefined;
  const attachments = [
    ...logoAttachments,
    ...(receiptAttachment
      ? [
          {
            filename: receiptAttachment.filename,
            content: receiptAttachment.content,
            contentType: receiptAttachment.contentType,
          },
        ]
      : []),
  ];

  await sendResendMessage({
    to: [to],
    replyTo: email,
    subject: erpAdminSubject(`Oráculo Raíz — comprobante — ${name}`),
    text,
    html,
    attachments,
    logTag: "oraculo-order-admin",
    headerRef: `oraculo-order-${contactMessageId}`,
  });
}
