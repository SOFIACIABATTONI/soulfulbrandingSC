import { slugifyPortfolioTitle } from "@/lib/portfolio-slug";

const SERVICE_SLUG_LABELS: Record<string, string> = {
  "identidad-de-marca": "identidad de marca",
  "estrategia-visual": "estrategia visual",
  "diseno-editorial": "diseño editorial",
};

/** Marcador en PortfolioGalleryItem.fileName para el PDF del manual de marca */
export const PORTFOLIO_MANUAL_FILENAME = "__manual-de-marca__";

export function isPortfolioManualItem(fileName: string): boolean {
  return fileName === PORTFOLIO_MANUAL_FILENAME;
}

type BrandSource = {
  title: string;
  service: string;
  client?: { name: string; company: string } | null;
};

/** Nombre de marca para título y slug (no el nombre interno del servicio ERP). */
export function derivePortfolioBrandName(source: BrandSource): string {
  const company = source.client?.company?.trim();
  if (company) return company;

  const clientName = source.client?.name?.trim();
  if (clientName) return clientName;

  const cleaned = stripServicePrefixFromTitle(source.title, source.service);
  if (cleaned) return cleaned;

  return source.title.trim() || "marca";
}

export function derivePortfolioBrandSlug(source: BrandSource): string {
  return slugifyPortfolioTitle(derivePortfolioBrandName(source));
}

function stripServicePrefixFromTitle(title: string, service: string): string {
  let t = title.trim();
  if (!t) return "";

  const labels = [
    SERVICE_SLUG_LABELS[service],
    service.replace(/-/g, " "),
    "identidad de marca",
    "estrategia visual",
    "diseno editorial",
    "diseño editorial",
  ].filter(Boolean);

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`^${escaped}\\s*[-–—:|·]\\s*`, "i"), "");
    t = t.replace(new RegExp(`^${escaped}\\s*$`, "i"), "");
  }

  return t.trim();
}
