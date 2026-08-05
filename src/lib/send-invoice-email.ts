import { Resend } from "resend";
import {
  buildInvoicePdf,
  invoiceDocumentTitle,
  invoicePdfFilename,
  type InvoicePdfRecord,
} from "@/lib/invoice-pdf";
import { invoicePublicPdfUrl } from "@/lib/invoice-public-url";
import { soLogoFuchsiaUrl } from "@/lib/brand-so-logo";
import {
  resolveSoLogoFuchsiaPngBytes,
  SO_LOGO_EMAIL_CID,
} from "@/lib/invoice-logo.server";
import { wrapBrandEmailHtml } from "@/lib/quote-markdown-html";
import { brandUi } from "@/lib/brand-ui";

export type SendInvoiceEmailPayload = {
  toEmail: string;
  toName: string;
  invoice: InvoicePdfRecord;
  publicToken: string;
  personalNote?: string;
};

function formatMoney(amount: number): string {
  return `€${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} EUR`;
}

function buildInvoiceEmailInner(payload: SendInvoiceEmailPayload): string {
  const { invoice, personalNote } = payload;
  const projectTitle = invoice.project?.title ?? "tu proyecto";
  const isSena = invoice.type === "sena";
  const noteBlock = personalNote?.trim()
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};font-style:italic;">${personalNote.trim().replace(/</g, "&lt;")}</p>`
    : "";

  const intro = isSena
    ? "Con este pago registramos la seña acordada y damos inicio al proceso de trabajo."
    : "Con este pago registramos el saldo final del proyecto.";

  return `${noteBlock}
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">${intro}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">Te comparto el ${isSena ? "recibo de seña" : "comprobante de factura final"} para el proyecto <strong style="color:${brandUi.text};">${projectTitle.replace(/</g, "&lt;")}</strong>.</p>
<p style="margin:0;font-size:14px;line-height:1.7;color:${brandUi.textMuted};"><strong style="color:${brandUi.text};">Monto:</strong> ${formatMoney(invoice.total).replace(/</g, "&lt;")}<br /><strong style="color:${brandUi.text};">Nº:</strong> ${invoice.number.replace(/</g, "&lt;")}</p>`;
}

function invoiceEmailCtaLabel(type: "sena" | "final"): string {
  return type === "sena" ? "Ver recibo" : "Ver factura";
}

/** Tarjeta de correo con borde fucsia y logo SÓ — misma estética que el PDF del recibo. */
export function wrapInvoiceEmailHtml(
  inner: string,
  pdfUrl: string,
  type: "sena" | "final",
  logoImageCid?: string,
): string {
  return wrapBrandEmailHtml({
    inner,
    ctaUrl: pdfUrl,
    ctaLabel: invoiceEmailCtaLabel(type),
    cardVariant: "fuchsia-frame",
    logoImageCid,
    logoImageUrl: logoImageCid ? undefined : soLogoFuchsiaUrl(),
    footerNote: "Este documento es personal y confidencial.",
  });
}

export async function sendInvoiceEmailToClient(
  payload: SendInvoiceEmailPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[invoice] RESEND_API_KEY no configurada; email al cliente omitido");
    }
    return false;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    console.error("[invoice] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida");
    return false;
  }

  const pdfBytes = await buildInvoicePdf(payload.invoice);
  const filename = invoicePdfFilename(payload.invoice);
  const docTitle = invoiceDocumentTitle(payload.invoice);
  const projectTitle = payload.invoice.project?.title ?? "proyecto";
  const isSena = payload.invoice.type === "sena";

  const pdfPublicUrl = invoicePublicPdfUrl(payload.publicToken);
  const innerHtml = buildInvoiceEmailInner(payload);
  const logoBytes = await resolveSoLogoFuchsiaPngBytes();
  const logoImageCid = logoBytes ? SO_LOGO_EMAIL_CID : undefined;
  const html = wrapInvoiceEmailHtml(
    innerHtml,
    pdfPublicUrl,
    payload.invoice.type,
    logoImageCid,
  );

  const text = [
    `Hola ${payload.toName},`,
    "",
    payload.personalNote?.trim() ?? "",
    "",
    isSena
      ? "Registramos la seña acordada y damos inicio al proceso de trabajo."
      : "Registramos el saldo final del proyecto.",
    "",
    `Proyecto: ${projectTitle}`,
    `Monto: ${formatMoney(payload.invoice.total)}`,
    `Nº: ${payload.invoice.number}`,
    "",
    `Ver recibo: ${pdfPublicUrl}`,
    "",
    `También adjuntamos el PDF del ${isSena ? "recibo de seña" : "comprobante"}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [payload.toEmail],
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
    subject: `${docTitle} — ${projectTitle} · Soulful Branding®`,
    text,
    html,
    attachments: [
      ...(logoBytes
        ? [
            {
              filename: "sc-so-logo-fuchsia.png",
              content: logoBytes.toString("base64"),
              contentType: "image/png",
              contentId: SO_LOGO_EMAIL_CID,
            },
          ]
        : []),
      {
        filename,
        content: Buffer.from(pdfBytes).toString("base64"),
      },
    ],
  });

  if (error) {
    console.error("[invoice] Resend al cliente:", error);
    return false;
  }
  return true;
}
