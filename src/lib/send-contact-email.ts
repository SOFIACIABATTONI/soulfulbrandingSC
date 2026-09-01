import { wrapAdminNotificationEmailHtml } from "@/lib/quote-markdown-html";
import { brandUi } from "@/lib/brand-ui";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";
import { erpAdminSubject, resolveAdminInboxEmail, sendResendMessage } from "@/lib/resend-mail";

export type ContactEmailPayload = {
  name: string;
  email: string;
  message: string;
  formKey: string;
  stageTitle: string;
};

/**
 * Envía notificación por correo vía Resend. Si falta API key, no hace nada.
 * Los errores se loguean y no se propagan: el mensaje ya está guardado en DB.
 */
export async function sendContactEmailNotification(
  payload: ContactEmailPayload,
): Promise<void> {
  const to = resolveAdminInboxEmail();
  const { name, email, message, formKey, stageTitle } = payload;

  const text = [
    "Nuevo mensaje desde el sitio web",
    "",
    `Origen: ${stageTitle}`,
    `Formulario: ${formKey}`,
    `Nombre: ${name}`,
    `Email del visitante: ${email}`,
    "",
    "Mensaje:",
    message,
  ].join("\n");

  const innerHtml = `<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#444;"><strong>Origen:</strong> ${stageTitle.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#444;"><strong>Formulario:</strong> ${formKey.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#444;"><strong>Nombre:</strong> ${name.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444;"><strong>Email:</strong> <a href="mailto:${email.replace(/"/g, "")}" style="color:${brandUi.blue};text-decoration:underline;">${email.replace(/</g, "&lt;")}</a></p>
<div style="margin:0;padding:14px;border-radius:6px;background:#f7f7f7;border:1px solid #e8e8e8;">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888;">Mensaje</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#131945;white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</p>
</div>`;

  const html = wrapAdminNotificationEmailHtml(`Contacto web — ${stageTitle}`, innerHtml);

  await sendResendMessage({
    to: [to],
    replyTo: email,
    subject: erpAdminSubject(`Contacto web — ${stageTitle}`),
    text,
    html,
    attachments: await soLogoEmailAttachments(),
    logTag: "contact",
    headerRef: "contact",
  });
}
