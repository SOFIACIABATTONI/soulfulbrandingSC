import { Resend } from "resend";
import { accessPublicUrl } from "@/lib/access-url";
import { markdownToQuoteHtml, wrapQuoteEmailHtml } from "@/lib/quote-markdown-html";
import {
  PREBRIEF_FIELDS,
  PREBRIEF_INTRO_DIAGNOSTIC,
  PREBRIEF_INTRO_PROCESS,
  PREBRIEF_INTRO_WELCOME,
} from "@/lib/prebrief-content";
import { brandUi } from "@/lib/brand-ui";

export type SendPrebriefEmailPayload = {
  toEmail: string;
  toName: string;
  projectTitle: string;
  token: string;
  personalNote?: string;
};

function emptyResponseBoxHtml(): string {
  return `<div style="margin:0 0 20px;min-height:72px;border:1px solid rgba(19,25,69,0.15);border-radius:8px;background:#FAFAFA;">&nbsp;</div>`;
}

function buildPrebriefQuestionsEmailHtml(): string {
  const parts: string[] = [];
  let qNum = 0;

  for (const field of PREBRIEF_FIELDS) {
    if (field.sectionTitle) {
      parts.push(
        `<h3 style="margin:28px 0 12px;font-family:Georgia,serif;font-size:20px;font-weight:400;font-style:italic;color:${brandUi.text};">${field.sectionTitle.replace(/</g, "&lt;")}</h3>`,
      );
    }
    if (field.sectionIntro) {
      parts.push(markdownToQuoteHtml(field.sectionIntro));
    }
    if (field.id.startsWith("q")) {
      qNum += 1;
      parts.push(
        `<p style="margin:20px 0 6px;font-size:15px;line-height:1.6;color:${brandUi.text};font-weight:600;">${qNum}. ${field.label.replace(/</g, "&lt;")}</p>`,
      );
    } else if (!field.sectionTitle) {
      parts.push(
        `<p style="margin:16px 0 6px;font-size:15px;line-height:1.6;color:${brandUi.text};font-weight:600;">${field.label.replace(/</g, "&lt;")}</p>`,
      );
    } else {
      parts.push(
        `<p style="margin:16px 0 6px;font-size:15px;line-height:1.6;color:${brandUi.text};font-weight:600;">${field.label.replace(/</g, "&lt;")}</p>`,
      );
    }
    if (field.hint) {
      parts.push(
        `<p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:${brandUi.textMuted};font-style:italic;">${field.hint.replace(/</g, "&lt;")}</p>`,
      );
    }
    parts.push(emptyResponseBoxHtml());
  }

  return parts.join("\n");
}

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

  const introHtml = [
    markdownToQuoteHtml(PREBRIEF_INTRO_WELCOME),
    markdownToQuoteHtml(PREBRIEF_INTRO_PROCESS),
    markdownToQuoteHtml(PREBRIEF_INTRO_DIAGNOSTIC),
  ].join("\n");

  const ctaBlock = `<p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:${brandUi.textMuted};">Debajo encontrarás cada pregunta con un espacio para tu respuesta. Para <strong style="color:${brandUi.text};">enviarlas al estudio</strong>, completá el formulario online:</p>`;

  const innerHtml = `${noteBlock}${introHtml}${ctaBlock}${buildPrebriefQuestionsEmailHtml()}<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${brandUi.textMuted};">Cuando termines, enviá tus respuestas desde el enlace. Sofía las recibirá en el ERP del proyecto.</p>`;

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

  const html = wrapQuoteEmailHtml(innerHtml, "", link);

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

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `Pre-brief recibido — ${payload.clientName}`,
    text,
  });

  if (error) {
    console.error("[prebrief] Resend notificación admin:", error);
  }
}
