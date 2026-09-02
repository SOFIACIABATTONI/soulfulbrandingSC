import type { OraculoBlock } from "./oraculo-page-layout-types";
import raw from "@/data/oraculo-page-layout.json";

export type { OraculoBlock } from "./oraculo-page-layout-types";

/** Corrige rutas y bloques mal clasificados al exportar desde Notion. */
export function getOraculoPageLayout(paymentLink?: string): OraculoBlock[] {
  const blocks = structuredClone(raw) as OraculoBlock[];
  const out: OraculoBlock[] = [];

  for (const b of blocks) {
    if (b.kind === "image" && b.src.includes("img-07.gif")) {
      out.push({ kind: "image", src: "/oraculo/notion-export/img-00.png" });
      out.push({ kind: "image", src: "/oraculo/notion-export/img-01.gif" });
      continue;
    }
    if (b.kind === "image" && b.src.includes("img-08.bin")) continue;

    if (b.kind === "image" && b.src.includes("img-11.bin")) {
      out.push({ kind: "image", src: "/oraculo/salpicado-cartas.gif", alt: "" });
      continue;
    }

    if (b.kind === "image" && b.src.includes("img-17.bin")) {
      out.push({ kind: "image", src: "/oraculo/notion-export/img-03.jpg", alt: "" });
      continue;
    }

    if (b.kind === "image" && b.alt?.startsWith("Una vez realizado")) {
      out.push({ kind: "text", html: "Una vez realizado el pago, completá el formulario a continuación." });
      continue;
    }
    if (b.kind === "image" && b.alt?.startsWith("Recibirás el acceso")) {
      out.push({ kind: "text", html: "Recibirás el acceso en las próximas 24 horas, directamente en tu correo." });
      continue;
    }
    if (b.kind === "image" && b.alt?.startsWith("Adjuntá el comprobante")) {
      out.push({
        kind: "text",
        html: "Adjuntá el comprobante —ese es el único paso que nos separa de que esto sea tuyo.",
      });
      out.push({ kind: "form" });
      continue;
    }

    if (b.kind === "image" && b.alt === "Método Soulful Branding") {
      out.push({
        kind: "image",
        src: "/oraculo/notion-export/img-10.png",
        alt: "Método Soulful Branding",
        href: "/creative-studio",
      });
      continue;
    }

    if (b.kind === "image" && b.alt?.startsWith("Mi nombre es Sofia")) {
      out.push({
        kind: "text",
        html:
          "Mi nombre es Sofia Ciabattoni. Creadora de Soulful Branding y fundadora del primer creative studio argentino especializado en identidad, energía y estrategia.",
      });
      continue;
    }

    if (b.kind === "image" && b.src.endsWith(".bin")) continue;
    if (b.kind === "form") continue;

    if (b.kind === "text" && b.html.includes("Transferencia")) {
      out.push({
        kind: "text",
        html: paymentLink
          ? `<strong>Transferencia</strong>: <a href="${paymentLink}" class="underline" target="_blank" rel="noopener noreferrer">link de pago</a>`
          : "<strong>Transferencia</strong>: link de pago",
      });
      continue;
    }

    out.push(b);
  }

  return out;
}
