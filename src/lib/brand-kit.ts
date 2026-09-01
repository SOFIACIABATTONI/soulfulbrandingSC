export type BrandKitCardKey =
  | "logotipo"
  | "logo-secundario"
  | "monograma"
  | "trama"
  | "recursos-graficos"
  | "tipografias"
  | "paleta-colores"
  | "sugerencias-uso"
  | "direccion-creativa"
  | "manual-marca"
  | "brand-sheet"
  | "kit-canva"
  | `custom-${string}`;

export const CUSTOM_BRAND_KIT_KEY_PREFIX = "custom-" as const;

export function isCustomBrandKitCardKey(key: string): key is `custom-${string}` {
  return key.startsWith(CUSTOM_BRAND_KIT_KEY_PREFIX);
}

export const PALETTE_CARD_KEY = "paleta-colores" as const satisfies BrandKitCardKey;

export type BrandKitColor = {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
};

export type BrandKitAssetFile = {
  id: string;
  url: string;
  fileName: string;
  mime: string;
};

export type BrandKitFileGroup = {
  id: string;
  label: string;
  files: BrandKitAssetFile[];
};

export type BrandKitCard = {
  id: string;
  key: BrandKitCardKey;
  title: string;
  driveUrl: string;
  sourceUrl: string;
  notes: string;
  fileGroups: BrandKitFileGroup[];
  colors: BrandKitColor[];
};

export type BrandKit = {
  version: 2;
  cards: BrandKitCard[];
};

/** Cards fijas de la identidad visual (referencia Notion Brand ID). */
export const BRAND_KIT_CARD_CATALOG: Array<{
  key: Exclude<BrandKitCardKey, `custom-${string}`>;
  title: string;
  kind: "files" | "palette" | "fonts" | "trama" | "link";
  defaultGroups: string[];
}> = [
  { key: "logotipo", title: "Logotipo", kind: "files", defaultGroups: ["Presentación", "Editables SVG", "Versión PNG"] },
  { key: "logo-secundario", title: "Logo secundario", kind: "files", defaultGroups: ["Presentación", "Editables SVG", "Versión PNG"] },
  { key: "monograma", title: "Monograma", kind: "files", defaultGroups: ["Presentación", "Editables SVG", "Versión PNG"] },
  {
    key: "trama",
    title: "Trama",
    kind: "trama",
    defaultGroups: ["Presentación", "Editables SVG", "Versión PNG"],
  },
  { key: "recursos-graficos", title: "Recursos gráficos", kind: "files", defaultGroups: ["Presentación", "Archivos"] },
  { key: "tipografias", title: "Tipografías", kind: "fonts", defaultGroups: ["Presentación", "Archivos de fuente"] },
  {
    key: "paleta-colores",
    title: "Paleta de colores",
    kind: "palette",
    defaultGroups: ["Presentación", "Referencia visual"],
  },
  { key: "sugerencias-uso", title: "Sugerencias de uso", kind: "files", defaultGroups: ["Presentación", "Archivos"] },
  { key: "direccion-creativa", title: "Dirección creativa", kind: "files", defaultGroups: ["Presentación", "Archivos"] },
  { key: "manual-marca", title: "Manual de marca completo", kind: "files", defaultGroups: ["Presentación", "PDF / presentación"] },
  {
    key: "brand-sheet",
    title: "Brand Sheet",
    kind: "files",
    defaultGroups: ["Presentación", "Archivo brand sheet"],
  },
  { key: "kit-canva", title: "Kit de marca → Canva", kind: "link", defaultGroups: ["Presentación"] },
];

export function isCatalogBrandKitCardKey(key: string): key is Exclude<BrandKitCardKey, `custom-${string}`> {
  return BRAND_KIT_CARD_CATALOG.some((c) => c.key === key);
}

/** Solo preview en admin/portal — no se incluye en ZIP, HTML ni descargas al cliente. */
export const BRAND_KIT_PRESENTATION_GROUP = "Presentación";

export function isBrandKitPresentationGroup(label: string): boolean {
  return label === BRAND_KIT_PRESENTATION_GROUP;
}

export function deliverableCardFiles(card: BrandKitCard): BrandKitAssetFile[] {
  return card.fileGroups
    .filter((g) => !isBrandKitPresentationGroup(g.label))
    .flatMap((g) => g.files.filter((f) => f.url.trim()));
}

export function deliverableFileGroups(card: BrandKitCard): BrandKitFileGroup[] {
  return card.fileGroups.filter((g) => !isBrandKitPresentationGroup(g.label));
}

export function createBrandKitId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeHex(hex: string): string {
  const v = hex.trim();
  if (!v) return "";
  return v.startsWith("#") ? v.toUpperCase() : `#${v.toUpperCase()}`;
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(normalizeHex(hex));
}

export function hexToRgb(hex: string): string {
  const h = normalizeHex(hex).slice(1);
  if (h.length !== 6) return "";
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "";
  return `${r}, ${g}, ${b}`;
}

/** Aproximación CMYK desde hex (referencia pantalla; no sustituye valores de imprenta). */
export function hexToCmyk(hex: string): string {
  const h = normalizeHex(hex).slice(1);
  if (h.length !== 6) return "";
  const r = Number.parseInt(h.slice(0, 2), 16) / 255;
  const g = Number.parseInt(h.slice(2, 4), 16) / 255;
  const b = Number.parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some((n) => Number.isNaN(n))) return "";
  const k = 1 - Math.max(r, g, b);
  if (k >= 1 - 1e-6) return "0, 0, 0, 100";
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return `${Math.round(c * 100)}, ${Math.round(m * 100)}, ${Math.round(y * 100)}, ${Math.round(k * 100)}`;
}

const BRAND_KIT_COLOR_SEP = /[—\-–—:·|,|\\/]/;

function expandHexDigits(hexDigits: string): string {
  if (hexDigits.length === 3) {
    return hexDigits
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return hexDigits;
}

function colorFromMatch(hexDigits: string, rawName: string | undefined, fallbackName: () => string): BrandKitColor | null {
  const hex = normalizeHex(`#${expandHexDigits(hexDigits)}`);
  if (!isValidHex(hex)) return null;
  const name = rawName?.replace(BRAND_KIT_COLOR_SEP, " ").trim() || fallbackName();
  return {
    id: createBrandKitId(),
    name,
    hex,
    rgb: hexToRgb(hex),
    cmyk: hexToCmyk(hex),
  };
}

function parseColorLine(line: string, fallbackName: () => string): BrandKitColor | null {
  // Importante: {6} antes que {3} — si no, #3A1E66 se lee como #3A1 + "E66 …"
  const hexCapture = "([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})";
  const sep = "(?:[—\\-–—:·|,|\\\\/]\\s*)?";
  const patterns: RegExp[] = [
    new RegExp(`^#${hexCapture}\\s*${sep}(.*)?$`),
    new RegExp(`^(?:hex|color)\\s*[:#]?\\s*#?${hexCapture}\\s*${sep}(.*)?$`, "i"),
    new RegExp(`^#?${hexCapture}\\s+${sep}(.+)$`),
    new RegExp(`^#?${hexCapture}$`),
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) return colorFromMatch(match[1], match[2], fallbackName);
  }

  const inline = line.match(/#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/);
  if (inline) {
    const name = line
      .replace(/#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/, "")
      .replace(/^[\s—\-–—:·|,|\\/]+/, "")
      .trim();
    return colorFromMatch(inline[1], name, fallbackName);
  }

  return null;
}

function isIgnorablePaletteLine(line: string): boolean {
  if (!line) return true;
  if (line.startsWith("//")) return true;
  if (/^#\s*[a-zA-Z]/.test(line) && !/^#[0-9A-Fa-f]{3,6}\b/.test(line)) return true;
  return false;
}

export type BrandKitColorsParseResult = {
  colors: BrandKitColor[];
  skippedLines: string[];
};

/** Parsea texto pegado con una línea por color: `#E1ADFF — lila claro` */
export function parseBrandKitColorsFromText(text: string): BrandKitColorsParseResult {
  const normalized = text.replace(/^\uFEFF/, "");
  const colors: BrandKitColor[] = [];
  const skippedLines: string[] = [];
  let unnamedIndex = 0;

  for (const line of normalized.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || isIgnorablePaletteLine(trimmed)) continue;

    const parsed = parseColorLine(trimmed, () => `Color ${++unnamedIndex}`);
    if (parsed) {
      colors.push(parsed);
    } else {
      skippedLines.push(trimmed);
    }
  }

  return { colors, skippedLines };
}

export function parseBrandKitColorsText(text: string): BrandKitColor[] {
  return parseBrandKitColorsFromText(text).colors;
}

/** Exporta paleta al formato entregable (.txt en el ZIP del cliente). */
export function buildPaletteColorsTxt(colors: BrandKitColor[]): string {
  const valid = colors.filter((c) => isValidHex(c.hex));
  if (valid.length === 0) return "";

  return valid
    .map((c) => {
      const hex = normalizeHex(c.hex);
      const lines = [`${hex} — ${c.name.trim() || "Color"}`];
      if (c.rgb.trim()) lines.push(`RGB: ${c.rgb.trim()}`);
      const cmyk = c.cmyk.trim() || hexToCmyk(hex);
      if (cmyk) lines.push(`CMYK: ${cmyk}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function emptyFileGroup(label: string): BrandKitFileGroup {
  return { id: createBrandKitId(), label, files: [] };
}

export function createDefaultBrandKitCard(key: Exclude<BrandKitCardKey, `custom-${string}`>): BrandKitCard {
  const def = BRAND_KIT_CARD_CATALOG.find((c) => c.key === key)!;
  return {
    id: createBrandKitId(),
    key,
    title: def.title,
    driveUrl: "",
    sourceUrl: "",
    notes: "",
    fileGroups: def.defaultGroups.map(emptyFileGroup),
    colors: [],
  };
}

export function createCustomBrandKitCard(title: string): BrandKitCard {
  const key = `${CUSTOM_BRAND_KIT_KEY_PREFIX}${createBrandKitId()}` as BrandKitCardKey;
  return ensurePresentationGroup({
    id: createBrandKitId(),
    key,
    title: title.trim() || "Nueva sección",
    driveUrl: "",
    sourceUrl: "",
    notes: "",
    fileGroups: ["Presentación", "Archivos"].map(emptyFileGroup),
    colors: [],
  });
}

export function getPresentationFileGroup(card: BrandKitCard): BrandKitFileGroup {
  const existing = card.fileGroups.find((g) => g.label === BRAND_KIT_PRESENTATION_GROUP);
  if (existing) return existing;
  return emptyFileGroup(BRAND_KIT_PRESENTATION_GROUP);
}

export function setCardCoverFiles(card: BrandKitCard, files: BrandKitAssetFile[]): BrandKitCard {
  const hasPresentation = card.fileGroups.some((g) => g.label === BRAND_KIT_PRESENTATION_GROUP);
  const fileGroups = hasPresentation
    ? card.fileGroups.map((g) =>
        g.label === BRAND_KIT_PRESENTATION_GROUP ? { ...g, files } : g,
      )
    : [{ ...emptyFileGroup(BRAND_KIT_PRESENTATION_GROUP), files }, ...card.fileGroups];
  return ensurePresentationGroup({ ...card, fileGroups });
}

export function emptyBrandKit(): BrandKit {
  return {
    version: 2,
    cards: BRAND_KIT_CARD_CATALOG.map((c) => createDefaultBrandKitCard(c.key)),
  };
}

function parseAssetFile(raw: Record<string, unknown>): BrandKitAssetFile {
  return {
    id: String(raw.id ?? createBrandKitId()),
    url: String(raw.url ?? ""),
    fileName: String(raw.fileName ?? ""),
    mime: String(raw.mime ?? ""),
  };
}

function parseFileGroup(raw: Record<string, unknown>): BrandKitFileGroup {
  return {
    id: String(raw.id ?? createBrandKitId()),
    label: String(raw.label ?? "Archivos"),
    files: Array.isArray(raw.files)
      ? raw.files
          .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
          .map(parseAssetFile)
      : [],
  };
}

function parseColor(raw: Record<string, unknown>): BrandKitColor {
  const hex = normalizeHex(String(raw.hex ?? ""));
  return {
    id: String(raw.id ?? createBrandKitId()),
    name: String(raw.name ?? ""),
    hex,
    rgb: String(raw.rgb ?? hexToRgb(hex)),
    cmyk: String(raw.cmyk ?? ""),
  };
}

function ensurePresentationGroup(card: BrandKitCard): BrandKitCard {
  const idx = card.fileGroups.findIndex((g) => g.label === "Presentación");
  if (idx === 0) return card;
  if (idx > 0) {
    const presentation = card.fileGroups[idx];
    return {
      ...card,
      fileGroups: [presentation, ...card.fileGroups.filter((_, i) => i !== idx)],
    };
  }
  return { ...card, fileGroups: [emptyFileGroup("Presentación"), ...card.fileGroups] };
}

function parseCard(raw: Record<string, unknown>): BrandKitCard | null {
  const key = String(raw.key ?? "");
  const isCustom = isCustomBrandKitCardKey(key);
  const isCatalog = isCatalogBrandKitCardKey(key);
  if (!isCustom && !isCatalog) return null;

  const def = getBrandKitCardDef(key);
  const fileGroups = Array.isArray(raw.fileGroups)
    ? raw.fileGroups
        .filter((g): g is Record<string, unknown> => !!g && typeof g === "object")
        .map(parseFileGroup)
    : def.defaultGroups.map(emptyFileGroup);

  return ensurePresentationGroup({
    id: String(raw.id ?? createBrandKitId()),
    key: key as BrandKitCardKey,
    title: String(raw.title ?? def.title),
    driveUrl: String(raw.driveUrl ?? ""),
    sourceUrl: String(raw.sourceUrl ?? ""),
    notes: String(raw.notes ?? ""),
    fileGroups: fileGroups.length > 0 ? fileGroups : def.defaultGroups.map(emptyFileGroup),
    colors: Array.isArray(raw.colors)
      ? raw.colors
          .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
          .map(parseColor)
      : [],
  });
}

function migrateLegacyBrandKit(raw: Record<string, unknown>): BrandKit {
  const kit = emptyBrandKit();
  const byKey = new Map(kit.cards.map((c) => [c.key, c]));

  const legacyColors = Array.isArray(raw.colors) ? raw.colors : [];
  if (legacyColors.length > 0) {
    const paletteCard = byKey.get(PALETTE_CARD_KEY)!;
    paletteCard.colors = legacyColors
      .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
      .map((c) =>
        parseColor({
          ...c,
          cmyk: c.cmyk ?? "",
          rgb: c.rgb ?? hexToRgb(String(c.hex ?? "")),
        }),
      );
  }

  const legacyFonts = Array.isArray(raw.fonts) ? raw.fonts : [];
  if (legacyFonts.length > 0) {
    const tipografias = byKey.get("tipografias")!;
    const group = tipografias.fileGroups[0] ?? emptyFileGroup("Archivos de fuente");
    group.files = legacyFonts
      .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
      .filter((f) => String(f.fileUrl ?? "").trim())
      .map((f) =>
        parseAssetFile({
          id: f.id,
          url: f.fileUrl,
          fileName: f.fileName ?? f.name,
          mime: "",
        }),
      );
    const firstSource = legacyFonts.find(
      (f): f is Record<string, unknown> =>
        !!f && typeof f === "object" && Boolean(String(f.sourceUrl ?? "").trim()),
    );
    if (firstSource) tipografias.sourceUrl = String(firstSource.sourceUrl ?? "");
    tipografias.fileGroups = [group];
  }

  const legacyFiles = Array.isArray(raw.files) ? raw.files : [];
  for (const f of legacyFiles) {
    if (!f || typeof f !== "object") continue;
    const kind = String((f as Record<string, unknown>).kind ?? "other");
    const targetKey: BrandKitCardKey =
      kind === "logo" ? "logotipo" : kind === "pdf" ? "manual-marca" : "recursos-graficos";
    const card = byKey.get(targetKey)!;
    const group = card.fileGroups[0] ?? emptyFileGroup("Archivos");
    group.files.push(
      parseAssetFile({
        id: (f as Record<string, unknown>).id,
        url: (f as Record<string, unknown>).url,
        fileName: (f as Record<string, unknown>).fileName ?? (f as Record<string, unknown>).name,
        mime: (f as Record<string, unknown>).mime,
      }),
    );
    if (card.fileGroups.length === 0) card.fileGroups = [group];
  }

  return { version: 2, cards: kit.cards };
}

function consolidatePaletteColors(cards: BrandKitCard[]): BrandKitCard[] {
  const palette = cards.find((c) => c.key === PALETTE_CARD_KEY);
  const brandSheet = cards.find((c) => c.key === "brand-sheet");
  if (!palette) return cards;

  const paletteHasColors = palette.colors.some((c) => c.name.trim() || isValidHex(c.hex));
  if (paletteHasColors) return cards;

  const donor =
    brandSheet?.colors.some((c) => c.name.trim() || isValidHex(c.hex)) ? brandSheet : null;
  if (!donor) return cards;

  return cards.map((c) =>
    c.key === PALETTE_CARD_KEY ? { ...c, colors: donor.colors.map((color) => ({ ...color })) } : c,
  );
}

export function getPaletteCard(kit: BrandKit): BrandKitCard {
  return kit.cards.find((c) => c.key === PALETTE_CARD_KEY) ?? createDefaultBrandKitCard(PALETTE_CARD_KEY);
}

export function parseBrandKit(raw: unknown): BrandKit {
  if (typeof raw === "string") {
    if (!raw.trim()) return emptyBrandKit();
    try {
      return parseBrandKit(JSON.parse(raw) as unknown);
    } catch {
      return emptyBrandKit();
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyBrandKit();
  const o = raw as Record<string, unknown>;

  if (o.version === 2 && Array.isArray(o.cards)) {
    const parsed = o.cards
      .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
      .map(parseCard)
      .filter((c): c is BrandKitCard => c != null);
    const byKey = new Map(parsed.map((c) => [c.key, c]));
    const catalogCards = consolidatePaletteColors(
      BRAND_KIT_CARD_CATALOG.map((def) => byKey.get(def.key) ?? createDefaultBrandKitCard(def.key)),
    );
    const customCards = parsed.filter((c) => isCustomBrandKitCardKey(c.key));
    return { version: 2, cards: [...catalogCards, ...customCards] };
  }

  if ("colors" in o || "fonts" in o || "files" in o) {
    return migrateLegacyBrandKit(o);
  }

  return emptyBrandKit();
}

export function serializeBrandKit(kit: BrandKit): string {
  return JSON.stringify(kit);
}

export function brandKitFromPhaseData(phaseData: Record<string, string> | undefined): BrandKit {
  return parseBrandKit(phaseData?.brandKit ?? "");
}

export function cardHasContent(card: BrandKitCard): boolean {
  if (card.driveUrl.trim() || card.sourceUrl.trim() || card.notes.trim()) return true;
  if (card.colors.some((c) => c.name.trim() || c.hex.trim())) return true;
  return card.fileGroups.some((g) => g.files.some((f) => f.url.trim()));
}

export function brandKitHasContent(kit: BrandKit): boolean {
  return kit.cards.some(cardHasContent);
}

export function cardPreviewColor(card: BrandKitCard): string | null {
  const first = card.colors.find((c) => isValidHex(c.hex));
  return first ? normalizeHex(first.hex) : null;
}

/** Fondo de preview en la galería: imagen, franja de paleta o color único. */
export function cardPreviewBackground(card: BrandKitCard): {
  type: "image" | "palette" | "color" | "empty";
  value: string;
} {
  const img = cardPreviewImage(card);
  if (img) return { type: "image", value: img };

  const palette = card.colors.filter((c) => isValidHex(c.hex)).map((c) => normalizeHex(c.hex));
  if (palette.length >= 2) {
    const stops = palette
      .map((hex, i) => `${hex} ${Math.round((i / (palette.length - 1)) * 100)}%`)
      .join(", ");
    return { type: "palette", value: `linear-gradient(90deg, ${stops})` };
  }
  if (palette.length === 1) return { type: "color", value: palette[0] };
  return { type: "empty", value: "" };
}

export function cardColorCount(card: BrandKitCard): number {
  return card.colors.filter((c) => isValidHex(c.hex)).length;
}

export function cardCoverImage(card: BrandKitCard): string | null {
  const presentation = card.fileGroups.find((g) => g.label === BRAND_KIT_PRESENTATION_GROUP);
  if (!presentation) return null;
  for (const file of presentation.files) {
    if (!file.url.trim()) continue;
    if (isImageAssetFile(file)) return file.url;
  }
  return null;
}

/** Imagen de portada explícita (grupo Presentación). */
export function cardPreviewImage(card: BrandKitCard): string | null {
  const explicit = cardCoverImage(card);
  if (explicit) return explicit;
  for (const group of card.fileGroups) {
    for (const file of group.files) {
      if (!file.url.trim()) continue;
      if (isImageAssetFile(file)) return file.url;
    }
  }
  return null;
}

export function isImageAssetFile(file: BrandKitAssetFile): boolean {
  if ((file.mime ?? "").startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(file.fileName);
}

export function getBrandKitCardDef(key: string): {
  key: string;
  title: string;
  kind: "files" | "palette" | "fonts" | "trama" | "link" | "custom";
  defaultGroups: string[];
} {
  const catalog = BRAND_KIT_CARD_CATALOG.find((c) => c.key === key);
  if (catalog) return catalog;
  return {
    key,
    title: "Nueva sección",
    kind: "custom",
    defaultGroups: ["Presentación", "Archivos"],
  };
}

export function cardDownloadableSquares(card: BrandKitCard): BrandKitAssetFile[] {
  if (card.key !== "trama") return deliverableCardFiles(card);
  const preferred = ["Versión PNG", "Editables SVG"];
  const files: BrandKitAssetFile[] = [];
  for (const label of preferred) {
    const group = card.fileGroups.find((g) => g.label === label);
    if (group) files.push(...group.files.filter((f) => f.url.trim() && isImageAssetFile(f)));
  }
  if (files.length > 0) return files;
  return deliverableCardFiles(card).filter(isImageAssetFile);
}

export function allCardFiles(card: BrandKitCard): BrandKitAssetFile[] {
  return card.fileGroups.flatMap((g) => g.files.filter((f) => f.url.trim()));
}

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

export function buildBrandKitHtmlSection(kit: BrandKit): string {
  if (!brandKitHasContent(kit)) return "";

  const parts: string[] = ['<section class="brand-kit">', "<h2>Brand ID — recursos descargables</h2>"];

  for (const card of kit.cards) {
    if (!cardHasContent(card)) continue;
    parts.push(`<h3>${esc(card.title)}</h3>`);

    if (card.driveUrl.trim()) {
      parts.push(`<p><a href="${esc(card.driveUrl.trim())}">Carpeta en Drive</a></p>`);
    }
    if (card.sourceUrl.trim()) {
      parts.push(`<p><a href="${esc(card.sourceUrl.trim())}">Ver fuente online</a></p>`);
    }

    if (card.colors.length > 0) {
      parts.push(
        '<table><tbody><tr><th>Muestra</th><th>Nombre</th><th>Hex</th><th>RGB</th><th>CMYK</th></tr>',
      );
      for (const c of card.colors) {
        const hex = normalizeHex(c.hex);
        const swatch = isValidHex(hex)
          ? `<span style="display:inline-block;width:28px;height:28px;border-radius:6px;border:1px solid rgba(19,25,69,0.15);background:${hex};"></span>`
          : "—";
        parts.push(
          `<tr><td>${swatch}</td><td>${esc(c.name || "—")}</td><td><code>${esc(hex || "—")}</code></td><td>${esc(c.rgb || "—")}</td><td>${esc(c.cmyk || "—")}</td></tr>`,
        );
      }
      parts.push("</tbody></table>");
    }

    for (const group of deliverableFileGroups(card)) {
      const files = group.files.filter((f) => f.url.trim());
      if (files.length === 0) continue;
      parts.push(`<p><strong>${esc(group.label)}</strong></p><ul>`);
      for (const f of files) {
        parts.push(
          `<li><a href="${esc(f.url.trim())}" download>${esc(f.fileName.trim() || "Descargar")}</a></li>`,
        );
      }
      parts.push("</ul>");
    }

    if (card.notes.trim()) {
      parts.push(`<p><em>${esc(card.notes.trim())}</em></p>`);
    }
  }

  parts.push("</section>");
  return parts.join("\n");
}
