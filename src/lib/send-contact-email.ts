import { Resend } from "resend";

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

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject: `Contacto web — ${stageTitle}`,
    text,
  });

  if (error) {
    console.error("[contact] Resend:", error);
  }
}
