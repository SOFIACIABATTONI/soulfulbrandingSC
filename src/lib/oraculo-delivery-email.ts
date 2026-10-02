import { brandUi } from "@/lib/brand-ui";
import { wrapQuoteEmailHtml } from "@/lib/quote-markdown-html";

export const ORACULO_ACCESS_EMAIL_SUBJECT = "Tu Oráculo Raíz está listo.";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOraculoAccessEmailContent(
  downloadLink: string,
  toName: string,
  options?: { youtubeUrl?: string | null; filesAttached?: boolean },
) {
  const safeLink = escapeHtml(downloadLink.trim());
  const youtube = options?.youtubeUrl?.trim() || null;
  const safeYoutube = youtube ? escapeHtml(youtube) : "";
  const greeting = toName.trim() ? `Hola ${escapeHtml(toName.trim())},` : "Hola,";

  const attachNote = options?.filesAttached
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:${brandUi.textMuted};">Los archivos del pack también van <strong>adjuntos</strong> a este correo.</p>`
    : "";

  const youtubeBlock = youtube
    ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:${brandUi.text};">Sesión en YouTube 🎬</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;"><a href="${safeYoutube}" style="color:${brandUi.blue};text-decoration:underline;word-break:break-all;">${safeYoutube}</a></p>`
    : "";

  const innerHtml = `
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">${greeting}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">Aquí está tu Oráculo Raíz —descargalo, guardalo, y cuando estés lista, empezá a materializarlo. ((((No hay una manera correcta de hacerlo, solo la tuya.))))</p>
<p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:${brandUi.text};">Link de descarga&nbsp; 💖💐🪞🌀</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><a href="${safeLink}" style="color:${brandUi.blue};text-decoration:underline;word-break:break-all;">${safeLink}</a></p>
${attachNote}
${youtubeBlock}
<p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:${brandUi.text};"><strong>Lo que incluye:</strong></p>
<ol style="margin:0 0 20px;padding-left:22px;font-size:14px;line-height:1.65;color:${brandUi.textMuted};">
<li style="margin-bottom:10px;">23 cartas imprimibles en formato PDF (Tamaño de hoja A3, frente y dorso · blanco y negro · listas para intervenir).</li>
<li style="margin-bottom:10px;">Manual de instrucciones para que consigas materializar Oráculo Raíz.</li>
<li style="margin-bottom:10px;">PDF con profundización y exploración del mensaje de las cartas.</li>
<li style="margin-bottom:10px;"><strong>Sesión grabada con tarotista invitada</strong>. Tendrás el honor de experimentar la activación del Oráculo Raíz explorando con nosotras las simbologias y activaciones (matras) de cada carta. Será un lindo momento para que intervenir tu oráculo con la energía de la creación.</li>
</ol>
<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${brandUi.text};"><em>Ahora, algo importante.</em></p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${brandUi.textMuted};">Un pedido del alma.</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};">Este archivo es una obra de autoría propia —canalizada, diseñada y creada con intención. Confío plenamente en que quien llega hasta aquí lo hace desde un lugar consciente.</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};">Como parte de ese pacto, te pido que cuides este material: no lo reenvíes ni lo compartás con quienes no hayan abonado su acceso. Confíar en vos y en nuestro compromiso, es lo que permite que este tipo de creaciones sigan existiendo.</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};">Gracias por ser parte con responsabilidad y amor.</p>
<p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};">—</p>
<p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};">Tu intervención es la activación.</p>
<p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};">Esto ya empezó.</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${brandUi.textMuted};">Hecho está.</p>
<p style="margin:0;font-size:15px;line-height:1.7;color:${brandUi.text};">Con amor,<br />Sofia Ciabattoni.</p>`;

  const text = [
    toName.trim() ? `Hola ${toName.trim()},` : "Hola,",
    "",
    "Aquí está tu Oráculo Raíz —descargalo, guardalo, y cuando estés lista, empezá a materializarlo. ((((No hay una manera correcta de hacerlo, solo la tuya.))))",
    "",
    "Link de descarga 💖💐🪞🌀",
    downloadLink.trim(),
    "",
    ...(options?.filesAttached ? ["Los archivos del pack también van adjuntos a este correo.", ""] : []),
    ...(youtube ? ["Sesión en YouTube:", youtube, ""] : []),
    "Lo que incluye:",
    "",
    "1. 23 cartas imprimibles en formato PDF (Tamaño de hoja A3, frente y dorso · blanco y negro · listas para intervenir).",
    "2. Manual de instrucciones para que consigas materializar Oráculo Raíz.",
    "3. PDF con profundización y exploración del mensaje de las cartas.",
    "4. Sesión grabada con tarotista invitada. Tendrás el honor de experimentar la activación del Oráculo Raíz explorando con nosotras las simbologias y activaciones (matras) de cada carta. Será un lindo momento para que intervenir tu oráculo con la energía de la creación.",
    "",
    "Ahora, algo importante.",
    "",
    "Un pedido del alma.",
    "",
    "Este archivo es una obra de autoría propia —canalizada, diseñada y creada con intención. Confío plenamente en que quien llega hasta aquí lo hace desde un lugar consciente.",
    "",
    "Como parte de ese pacto, te pido que cuides este material: no lo reenvíes ni lo compartás con quienes no hayan abonado su acceso. Confíar en vos y en nuestro compromiso, es lo que permite que este tipo de creaciones sigan existiendo.",
    "",
    "Gracias por ser parte con responsabilidad y amor.",
    "",
    "—",
    "",
    "Tu intervención es la activación.",
    "Esto ya empezó.",
    "Hecho está.",
    "",
    "Con amor,",
    "Sofia Ciabattoni.",
  ].join("\n");

  const html = wrapQuoteEmailHtml(innerHtml, "", downloadLink.trim(), "Descargar Oráculo Raíz →");

  return { subject: ORACULO_ACCESS_EMAIL_SUBJECT, text, html };
}
