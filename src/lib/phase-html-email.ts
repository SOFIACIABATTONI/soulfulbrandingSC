/** Prepara HTML del editor para incrustar en mails (enlaces visibles en clientes de correo). */
export function phaseHtmlForEmail(html: string): string {
  let out = html.trim();
  if (!out) return out;
  out = out.replace(
    /<a\s+/gi,
    '<a style="color:#323FF6;font-weight:600;text-decoration:underline;text-underline-offset:2px;" ',
  );
  return out;
}
