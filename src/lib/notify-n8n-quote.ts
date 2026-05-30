import { createHmac } from "crypto";

export type N8nQuoteEvent = {
  event: "quote.responded";
  quoteId: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  status: string;
  clientResponse: string;
  clientComment: string;
  respondedAt: string;
};

/**
 * Notificación saliente al webhook de n8n (fire-and-forget).
 * n8n no es fuente de verdad; solo automatizaciones extra.
 */
export async function notifyN8nQuoteEvent(payload: N8nQuoteEvent): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL?.trim();
  if (!url) return;

  const secret = process.env.N8N_WEBHOOK_SECRET?.trim() || "";
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret) {
    const sig = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    headers["X-Soulful-Signature"] = `sha256=${sig}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error("[quote] n8n webhook HTTP", res.status);
    }
  } catch (e) {
    console.error("[quote] n8n webhook error", e);
  }
}
