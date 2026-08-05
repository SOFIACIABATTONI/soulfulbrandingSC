import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { tmpdir } from "os";

const ROOT = path.join(tmpdir(), "soulful-branding-admin-uploads");

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Guarda fuera del repo (no dispara Fast Refresh de Next en dev). */
export async function saveLocalDevUpload(
  subdir: string,
  fileName: string,
  buf: Buffer,
): Promise<string> {
  const folder = safeSegment(subdir);
  const dir = path.join(ROOT, folder);
  await mkdir(dir, { recursive: true });
  const base = safeSegment(path.basename(fileName)) || "file.bin";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${base}`;
  await writeFile(path.join(dir, id), buf);
  return `/api/admin/dev-upload/${folder}/${encodeURIComponent(id)}`;
}

/** Igual que arriba pero URL pública (portfolio / sitio, sin login). */
export async function savePublicDevUpload(
  subdir: string,
  fileName: string,
  buf: Buffer,
): Promise<string> {
  const folder = safeSegment(subdir);
  const dir = path.join(ROOT, folder);
  await mkdir(dir, { recursive: true });
  const base = safeSegment(path.basename(fileName)) || "file.bin";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${base}`;
  await writeFile(path.join(dir, id), buf);
  return `/api/public/dev-media/${folder}/${encodeURIComponent(id)}`;
}

export async function readLocalDevUpload(
  subdir: string,
  id: string,
): Promise<{ buf: Buffer; fileName: string } | null> {
  const folder = safeSegment(subdir);
  const safeId = path.basename(decodeURIComponent(id));
  const filePath = path.join(ROOT, folder, safeId);
  if (!filePath.startsWith(path.join(ROOT, folder))) return null;
  try {
    const buf = await readFile(filePath);
    return { buf, fileName: safeId };
  } catch {
    return null;
  }
}

export function isLocalDevUploadUrl(url: string): boolean {
  return url.startsWith("/api/admin/dev-upload/");
}
