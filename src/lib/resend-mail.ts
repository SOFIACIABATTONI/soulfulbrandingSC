import { Resend } from "resend";

const DEFAULT_FROM_NAME = "Soulful Branding";
const DEFAULT_FROM_EMAIL = "hola@sofiaciabattoni.com";

export function resolveResendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

/**
 * Remitente con nombre visible (`Soulful Branding <hola@…>`).
 * Gmail reconoce mejor el remitente que un email suelto.
 */
export function resolveResendFrom(): string | null {
  const raw = process.env.RESEND_FROM?.trim();
  if (!raw) return null;

  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return `${match[1].trim()} <${match[2].trim()}>`;
  }

  const name = process.env.RESEND_FROM_NAME?.trim() || DEFAULT_FROM_NAME;
  const email = raw.replace(/^<|>$/g, "").trim() || DEFAULT_FROM_EMAIL;
  return `${name} <${email}>`;
}

export function resolveAdminInboxEmail(): string {
  return (process.env.CONTACT_TO_EMAIL?.trim() || DEFAULT_FROM_EMAIL).trim();
}

/** Prefijo para filtrar avisos del ERP en Gmail (bandeja principal). */
export function erpAdminSubject(subject: string): string {
  const trimmed = subject.trim();
  if (trimmed.startsWith("[ERP]")) return trimmed;
  return `[ERP] ${trimmed}`;
}

export function transactionalResendHeaders(ref?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Auto-Response-Suppress": "OOF, AutoReply",
  };
  if (ref?.trim()) {
    headers["X-Entity-Ref-ID"] = ref.trim().slice(0, 128);
  }
  return headers;
}

export type SendResendMessageInput = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: {
    filename?: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
    contentId?: string;
  }[];
  logTag?: string;
  headerRef?: string;
};

export async function sendResendMessage(input: SendResendMessageInput): Promise<boolean> {
  const apiKey = resolveResendApiKey();
  const logTag = input.logTag ?? "resend";
  if (!apiKey) {
    console.warn(`[${logTag}] RESEND_API_KEY no configurada; email omitido`);
    return false;
  }

  const from = resolveResendFrom();
  if (!from) {
    console.error(`[${logTag}] RESEND_FROM es obligatorio cuando RESEND_API_KEY está definida`);
    return false;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo?.trim() || undefined,
    attachments: input.attachments,
    headers: transactionalResendHeaders(input.headerRef ?? logTag),
  });

  if (error) {
    console.error(`[${logTag}] Resend:`, error);
    return false;
  }
  return true;
}
