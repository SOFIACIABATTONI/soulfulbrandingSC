import { Resend } from "resend";
import { wrapAdminNotificationEmailHtml } from "@/lib/quote-markdown-html";
import { brandUi } from "@/lib/brand-ui";
import { soLogoEmailAttachments } from "@/lib/invoice-logo.server";

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
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[contact] RESEND_API_KEY no configurada; email de notificación omitido",
      );
    }
    return;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error(
      "[contact] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida",
    );
    return;
  }

  const to = (
    process.env.CONTACT_TO_EMAIL?.trim() || "hola@sofiaciabattoni.com"
  ).trim();

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

  const innerHtml = `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Origen:</strong> ${stageTitle.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Formulario:</strong> ${formKey.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Nombre:</strong> ${name.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Email:</strong> <a href="mailto:${email.replace(/"/g, "")}" style="color:${brandUi.accent};text-decoration:underline;">${email.replace(/</g, "&lt;")}</a></p>
<div style="margin:0;padding:16px;border-radius:8px;background:#FAFAFA;border:1px solid rgba(19,25,69,0.1);">
<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${brandUi.textFaint};">Mensaje</p>
<p style="margin:0;font-size:15px;line-height:1.7;color:${brandUi.text};white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</p>
</div>`;

  const html = wrapAdminNotificationEmailHtml(`Contacto web — ${stageTitle}`, innerHtml);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject: `Contacto web — ${stageTitle}`,
    text,
    html,
    attachments: soLogoEmailAttachments(),
  });

  if (error) {
    console.error("[contact] Resend:", error);
  }
}
