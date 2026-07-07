import { createHash } from "crypto";

export function hashContractHtml(html: string): string {
  return createHash("sha256").update(html.trim(), "utf8").digest("hex");
}

export function normalizePersonName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function validateTypedName(typedName: string, expectedName: string): string | null {
  const typed = normalizePersonName(typedName);
  const expected = normalizePersonName(expectedName);

  if (!typed || typed.length < 3) {
    return "Escribí tu nombre completo tal como figura en el contrato.";
  }

  if (typed === expected) return null;

  const expectedParts = expected.split(" ").filter((part) => part.length > 1);
  const typedParts = typed.split(" ").filter(Boolean);

  if (expectedParts.length >= 2) {
    const allPartsPresent = expectedParts.every((part) =>
      typedParts.some((typedPart) => typedPart === part || typedPart.startsWith(part)),
    );
    if (allPartsPresent) return null;
  }

  return `El nombre debe coincidir con el del contrato (${expectedName}).`;
}

const LOCAL_IPS = new Set(["::1", "127.0.0.1", "localhost"]);

export function extractClientIp(req: Request): string {
  const headerValues = [
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip"),
    req.headers.get("cf-connecting-ip"),
  ].filter(Boolean) as string[];

  for (const header of headerValues) {
    const ips = header.split(",").map((part) => part.trim()).filter(Boolean);
    for (const ip of ips) {
      if (!LOCAL_IPS.has(ip)) return ip;
    }
  }

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "";
  return req.headers.get("x-real-ip")?.trim() ?? "";
}

/** Etiqueta legible para admin / PDF cuando la IP es de prueba local. */
export function formatIpForDisplay(ip: string): { value: string; note?: string } {
  if (!ip) return { value: "—" };
  if (ip === "::1" || ip === "127.0.0.1") {
    return {
      value: ip,
      note: "Prueba en tu computadora (localhost). En producción se guarda la IP pública del cliente.",
    };
  }
  return { value: ip };
}

export const CONTENT_HASH_HELP =
  "Huella digital única del texto exacto del contrato en el momento de aceptar. Si alguien cambia una coma del contrato, la huella cambia. Sirve para probar qué versión aceptó el cliente.";

export function extractUserAgent(req: Request): string {
  return (req.headers.get("user-agent") ?? "").slice(0, 512);
}

export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type ContractAcceptanceRecord = {
  id: string;
  projectId: string;
  clientEmail: string;
  typedName: string;
  termsAccepted: boolean;
  ipAddress: string;
  userAgent: string;
  contentHash: string;
  contractHtml: string;
  acceptedAt: Date;
  project: {
    title: string;
    service: string;
    value: number;
  };
  client: {
    name: string;
    email: string;
    company: string;
  };
};
