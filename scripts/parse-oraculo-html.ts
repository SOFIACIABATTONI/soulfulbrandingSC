import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = "assets/oraculo";
const file = readdirSync(dir).find((f) => f.endsWith(".html"))!;
let html = readFileSync(path.join(dir, file), "utf8");

// Image paths in document order (from extract-oraculo-images.ts)
const imageUrls = readFileSync("private-notes/oraculo-exported-images.txt", "utf8")
  .trim()
  .split("\n")
  .filter(Boolean);
let imageIdx = 0;
function nextImage() {
  return imageUrls[imageIdx++] ?? null;
}

html = html.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g, () => {
  const url = nextImage();
  return url ?? "[IMG]";
});

export type OraculoBlock =
  | { kind: "title"; text: string }
  | { kind: "sub_sub_header"; lines: string[]; boldFromLine?: number }
  | { kind: "sub_header"; lines: string[] }
  | { kind: "text"; html: string }
  | { kind: "bulleted_list"; text: string }
  | { kind: "image"; src: string; alt?: string }
  | { kind: "audio" }
  | { kind: "video"; caption: string }
  | { kind: "form" }
  | { kind: "callout_image"; src: string }
  | { kind: "spacer" };

function stripText(fragment: string): string {
  return fragment
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\u200b/g, "")
    .trim();
}

function richHtml(fragment: string): string {
  return fragment
    .replace(/<br\s*\/?>/gi, "<br />")
    .replace(
      /<span[^>]*(?:font-weight:600|notion-enable-hover)[^>]*>([\s\S]*?)<\/span>/gi,
      "<strong>$1</strong>",
    )
    .replace(/<strong>/gi, "<strong>")
    .replace(/<\/strong>/gi, "</strong>")
    .replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '<a href="$1" class="text-inherit underline">$2</a>')
    .replace(/<a\s+href=([^\s>]+)[^>]*>([\s\S]*?)<\/a>/gi, '<a href="$1" class="text-inherit underline">$2</a>')
    .replace(/<(?!\/?(?:strong|br|a)\b)[^>]+>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

const blocks: OraculoBlock[] = [];

// Page title
const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripText(m[1] ?? ""));
if (h1s[0]) blocks.push({ kind: "title", text: h1s[0] });

const re =
  /<div[^>]*data-block-id=[^>]*class="([^"]*notion-selectable[^"]*)"[^>]*>([\s\S]*?)(?=<div[^>]*data-block-id=|<\/body)/gi;

let m: RegExpExecArray | null;
let formAdded = false;

while ((m = re.exec(html)) !== null) {
  const cls = m[1] ?? "";
  const inner = m[2] ?? "";
  const type =
    cls.match(
      /notion-(header|sub_header|sub_sub_header|text|bulleted_list|numbered_list|quote|callout|divider|column_list|column|image|video|audio|embed|bookmark|toggle|sync)/,
    )?.[1] ?? "unknown";

  if (type === "column" || type === "unknown") continue;

  const leaf =
    inner.match(/class=content-editable-leaf[^>]*>([\s\S]*?)<\/div>/i)?.[1] ??
    inner.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1] ??
    "";

  if (type === "audio") {
    blocks.push({ kind: "audio" });
    continue;
  }

  if (type === "video") {
    const caption = stripText(leaf || inner) || "Soulful experience. 2026, Valencia. España.";
    blocks.push({ kind: "video", caption });
    continue;
  }

  if (type === "image" || inner.includes("[IMG]") || inner.includes("/oraculo/notion-export/")) {
    const srcMatch = inner.match(/(\/oraculo\/notion-export\/img-\d+\.[a-z]+)/);
    const src = srcMatch?.[1] ?? nextImage();
    if (src) {
      const alt = stripText(leaf);
      blocks.push({ kind: "image", src, alt: alt || undefined });
    }
    continue;
  }

  if (type === "callout") {
    const srcMatch = inner.match(/(\/oraculo\/notion-export\/img-\d+\.[a-z]+)/);
    if (srcMatch) blocks.push({ kind: "callout_image", src: srcMatch[1]! });
    continue;
  }

  const text = stripText(leaf || inner);
  if (!text) continue;

  if (type === "sub_sub_header") {
    const lines = text.split("\n").filter(Boolean);
    const hasBold = /<strong>|font-weight:600|notion-enable-hover/.test(leaf);
    blocks.push({
      kind: "sub_sub_header",
      lines,
      boldFromLine: hasBold && lines.length > 1 ? 1 : undefined,
    });
    continue;
  }

  if (type === "sub_header") {
    blocks.push({ kind: "sub_header", lines: text.split("\n").filter(Boolean) });
    continue;
  }

  if (type === "bulleted_list") {
    blocks.push({ kind: "bulleted_list", text });
    continue;
  }

  // Form title in Notion
  if (text === "Oráculo Raíz—" || h1s.includes(text) && text.endsWith("—")) {
    blocks.push({ kind: "form" });
    formAdded = true;
    continue;
  }

  blocks.push({ kind: "text", html: richHtml(leaf || inner) || text });

  // Insert form after payment instructions if not yet added
  if (!formAdded && text.startsWith("Adjuntá el comprobante")) {
    blocks.push({ kind: "form" });
    formAdded = true;
  }
}

if (!formAdded) blocks.push({ kind: "form" });

writeFileSync("src/data/oraculo-page-layout.json", JSON.stringify(blocks, null, 2), "utf8");
console.log("Wrote", blocks.length, "layout blocks");
blocks.forEach((b, i) => console.log(i + 1, b.kind, JSON.stringify(b).slice(0, 100)));
