/** Abre Gmail en el navegador. `mailto:` suele no hacer nada sin app de correo en el sistema. */
export function gmailWebComposeUrl(email: string): string {
  const addr = email.replace(/^mailto:/i, "").trim();
  if (!addr) return "https://mail.google.com/mail/?view=cm&fs=1";
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(addr)}`;
}
