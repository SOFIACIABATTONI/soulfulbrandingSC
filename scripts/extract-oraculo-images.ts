import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = "assets/oraculo";
const file = readdirSync(dir).find((f) => f.endsWith(".html"))!;
const html = readFileSync(path.join(dir, file), "utf8");

const outDir = path.join("public", "oraculo", "notion-export");
mkdirSync(outDir, { recursive: true });

let i = 0;
const urls: string[] = [];
const stripped = html.replace(
  /data:(image\/[a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g,
  (_m, mime: string, b64: string) => {
    const ext = mime.includes("png") ? "png" : mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : mime.includes("gif") ? "gif" : "bin";
    const name = `img-${String(i).padStart(2, "0")}.${ext}`;
    writeFileSync(path.join(outDir, name), Buffer.from(b64, "base64"));
    urls.push(`/oraculo/notion-export/${name}`);
    i++;
    return urls[urls.length - 1]!;
  },
);

writeFileSync("private-notes/oraculo-exported-images.txt", urls.join("\n"), "utf8");
console.log("Exported", urls.length, "images");
urls.forEach((u, idx) => console.log(idx, u));
