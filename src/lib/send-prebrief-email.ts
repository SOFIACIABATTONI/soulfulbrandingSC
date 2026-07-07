import { Resend } from "resend";
import { accessPublicUrl } from "@/lib/access-url";
import { prebriefHtmlForEmail } from "@/lib/prebrief-html-templates";
import { wrapAdminNotificationEmailHtml, wrapQuoteEmailHtml } from "@/lib/quote-markdown-html";
import { brandUi } from "@/lib/brand-ui";

export type SendPrebriefEmailPayload = {
  toEmail: string;
  toName: string;
  projectTitle: string;
  token: string;
  emailWelcome: string;
  personalNote?: string;
};

export async function sendPrebriefEmailToClient(
  payload: SendPrebriefEmailPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[prebrief] RESEND_API_KEY no configurada; email al cliente omitido");
    }
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error("[prebrief] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida");
    return false;
  }

  const link = accessPublicUrl("pre-brief", payload.token);
  const noteBlock = payload.personalNote?.trim()
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};font-style:italic;">${payload.personalNote.trim().replace(/</g, "&lt;")}</p>`
    : "";

  const welcomeHtml = prebriefHtmlForEmail(payload.emailWelcome);
  const ctaIntro = `<p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">El cuestionario completo está en el enlace. Podés responder con calma y enviarlo cuando esté listo.</p>`;

  const innerHtml = `${noteBlock}${welcomeHtml}${ctaIntro}`;

  const text = [
    `Hola ${payload.toName},`,
    "",
    payload.personalNote?.trim() ?? "",
    "",
    `Tu pre-brief para el proyecto "${payload.projectTitle}" está listo.`,
    "",
    "Completá y enviá tus respuestas en:",
    link,
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapQuoteEmailHtml(innerHtml, "", link, "Completar pre-brief →");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: "Tu pre-brief — Soulful Branding®",
    text,
    html,
  });

  if (error) {
    console.error("[prebrief] Resend al cliente:", error);
    return false;
  }
  return true;
}

export async function sendPrebriefSubmittedNotificationToAdmin(payload: {
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
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  const text = [
    "Pre-brief recibido (ERP)",
    "",
    `Cliente: ${payload.clientName}`,
    `Email: ${payload.clientEmail}`,
    `Proyecto: ${payload.projectTitle}`,
    "",
    `Ver respuestas: ${base}/admin/proyectos/${payload.projectId}#fase-prebrief`,
  ].join("\n");

  const adminLink = `${base}/admin/proyectos/${payload.projectId}#fase-prebrief`;
  const innerHtml = `<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Cliente:</strong> ${payload.clientName.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Email:</strong> ${payload.clientEmail.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Proyecto:</strong> ${payload.projectTitle.replace(/</g, "&lt;")}</p>
<p style="margin:0;font-size:14px;line-height:1.6;"><a href="${adminLink.replace(/"/g, "")}" style="color:#323FF6;text-decoration:underline;">Ver respuestas en el ERP →</a></p>`;

  const html = wrapAdminNotificationEmailHtml(
    `Pre-brief recibido — ${payload.clientName}`,
    innerHtml,
  );

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `Pre-brief recibido — ${payload.clientName}`,
    text,
    html,
  });

  if (error) {
    console.error("[prebrief] Resend notificación admin:", error);
  }
}
