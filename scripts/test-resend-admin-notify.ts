/**
 * Prueba de envío Resend → hola@sofiaciabattoni.com (mismas env vars que el ERP).
 *
 * Lee `.env` de la raíz. No importa código Next (evita server-only).
 *
 * Uso:
 *   npx tsx scripts/test-resend-admin-notify.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { Resend } from "resend";

function loadEnvFile(): void {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) {
    console.error("No se encontró .env en la raíz del proyecto.");
    process.exit(1);
  }
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main(): Promise<void> {
  loadEnvFile();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const to = (
    process.env.CONTACT_TO_EMAIL?.trim() || "hola@sofiaciabattoni.com"
  ).trim();

  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("RESEND_FROM");

  if (missing.length) {
    console.error(`Faltan en .env: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`Enviando mail de prueba a ${to} desde ${from}...`);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: from!,
    to: [to],
    subject: "[TEST ERP] Notificaciones a Sofía — Soulful Branding®",
    text: [
      "Prueba de notificación ERP (puedes ignorar este mail).",
      "",
      "Si lo recibiste, Resend y CONTACT_TO_EMAIL están bien en este entorno.",
      "Siguiente paso: las mismas 3 variables en Vercel → Production + redeploy.",
    ].join("\n"),
    html: `<p>Prueba de notificación ERP (<strong>puedes ignorar este mail</strong>).</p>
<p>Si lo recibiste, <code>RESEND_*</code> y <code>CONTACT_TO_EMAIL</code> están bien en este entorno.</p>
<p>Siguiente paso: las mismas variables en <strong>Vercel → Production</strong> y redeploy de <code>master</code>.</p>`,
  });

  if (error) {
    console.error("Resend error:", error);
    process.exit(1);
  }

  console.log("OK — id:", data?.id);
  console.log("Revisá bandeja y spam de", to);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
