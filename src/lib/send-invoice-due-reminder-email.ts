import { Resend } from "resend";
import { wrapBrandEmailHtml } from "@/lib/quote-markdown-html";
import { brandUi } from "@/lib/brand-ui";
import {
  formatDueDateLabel,
  type InvoiceReminderKind,
} from "@/lib/invoice-due-dates";
import { getInvoiceDocumentTitle } from "@/lib/invoice-utils";
import {
  resolveSoLogoFuchsiaPngBytes,
  SO_LOGO_EMAIL_CID,
} from "@/lib/invoice-logo.server";
import { soLogoFuchsiaUrl } from "@/lib/brand-so-logo";

export type SendInvoiceDueReminderPayload = {
  toEmail: string;
  toName: string;
  invoiceNumber: string;
  invoiceType: "sena" | "final";
  total: number;
  dueAt: Date;
  projectTitle?: string;
  pdfUrl?: string;
  reminderKind: InvoiceReminderKind;
};

function formatMoney(amount: number): string {
  return `€${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} EUR`;
}

function reminderCopy(kind: InvoiceReminderKind, docTitle: string): {
  subject: string;
  headline: string;
  body: string;
} {
  const dueLabel = "la fecha de vencimiento";
  switch (kind) {
    case "7d":
      return {
        subject: `Recordatorio: ${docTitle} vence en 7 días`,
        headline: `Tu ${docTitle.toLowerCase()} vence en una semana`,
        body: `Te escribimos para recordarte que ${dueLabel} de tu ${docTitle.toLowerCase()} es dentro de 7 días.`,
      };
    case "1d":
      return {
        subject: `Recordatorio: ${docTitle} vence mañana`,
        headline: `Tu ${docTitle.toLowerCase()} vence mañana`,
        body: `Mañana es ${dueLabel} de tu ${docTitle.toLowerCase()}. Si ya realizaste el pago, podés ignorar este mensaje.`,
      };
    case "due":
      return {
        subject: `Hoy vence tu ${docTitle.toLowerCase()}`,
        headline: `Hoy es el día de pago de tu ${docTitle.toLowerCase()}`,
        body: `Hoy vence tu ${docTitle.toLowerCase()}. Si ya abonaste, gracias — podés desestimar este correo.`,
      };
  }
}

export async function sendInvoiceDueReminderEmail(
  payload: SendInvoiceDueReminderPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[invoice-reminder] RESEND_API_KEY no configurada; recordatorio omitido");
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error("[invoice-reminder] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida");
    return false;
  }

  const docTitle = getInvoiceDocumentTitle(payload.invoiceType);
  const copy = reminderCopy(payload.reminderKind, docTitle);
  const dueFormatted = formatDueDateLabel(payload.dueAt);
  const projectLine = payload.projectTitle
    ? `<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Proyecto:</strong> ${payload.projectTitle.replace(/</g, "&lt;")}</p>`
    : "";

  const innerHtml = `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">Hola ${payload.toName.replace(/</g, "&lt;")},</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">${copy.body.replace(/</g, "&lt;")}</p>
${projectLine}
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Documento:</strong> ${docTitle.replace(/</g, "&lt;")} · Nº ${payload.invoiceNumber.replace(/</g, "&lt;")}</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Monto:</strong> ${formatMoney(payload.total).replace(/</g, "&lt;")}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Vencimiento:</strong> ${dueFormatted.replace(/</g, "&lt;")}</p>
<p style="margin:0;font-size:14px;line-height:1.7;color:${brandUi.textMuted};">Ante cualquier duda, respondé este correo y te ayudamos.</p>`;

  const logoBytes = await resolveSoLogoFuchsiaPngBytes();
  const logoImageCid = logoBytes ? SO_LOGO_EMAIL_CID : undefined;
  const html = wrapBrandEmailHtml({
    inner: innerHtml,
    ctaUrl: payload.pdfUrl,
    ctaLabel: payload.pdfUrl ? "Ver documento" : undefined,
    cardVariant: "fuchsia-frame",
    logoImageCid,
    logoImageUrl: logoImageCid ? undefined : soLogoFuchsiaUrl(),
    footerNote: "Soulful Branding® — recordatorio de pago",
    title: copy.headline,
  });

  const text = [
    `Hola ${payload.toName},`,
    "",
    copy.body,
    "",
    payload.projectTitle ? `Proyecto: ${payload.projectTitle}` : "",
    `Documento: ${docTitle} · Nº ${payload.invoiceNumber}`,
    `Monto: ${formatMoney(payload.total)}`,
    `Vencimiento: ${dueFormatted}`,
    "",
    payload.pdfUrl ? `Ver documento: ${payload.pdfUrl}` : "",
    "",
    "Ante cualquier duda, respondé este correo.",
  ]
    .filter(Boolean)
    .join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: `${copy.subject} · Soulful Branding®`,
    text,
    html,
    attachments: logoBytes
      ? [
          {
            filename: "sc-so-logo-fuchsia.png",
            content: logoBytes.toString("base64"),
            contentType: "image/png",
            contentId: SO_LOGO_EMAIL_CID,
          },
        ]
      : undefined,
  });

  if (error) {
    console.error("[invoice-reminder] Resend:", error);
    return false;
  }

  return true;
}
