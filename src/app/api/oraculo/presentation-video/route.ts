import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const VIDEO_PATH = path.join(process.cwd(), "assets", "oraculo", "Oraculo-raiz-presentacion.mov");

function streamResponse(stream: Readable, headers: Record<string, string>, status = 200) {
  return new Response(Readable.toWeb(stream) as ReadableStream, { status, headers });
}

export async function GET(req: NextRequest) {
  let fileStat;
  try {
    fileStat = await stat(VIDEO_PATH);
  } catch {
    return new Response("Video no encontrado", { status: 404 });
  }

  const size = fileStat.size;
  const range = req.headers.get("range");

  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) {
      return new Response(null, { status: 416 });
    }
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start >= size || end >= size || start > end) {
      return new Response(null, { status: 416 });
    }
    const chunkSize = end - start + 1;
    return streamResponse(createReadStream(VIDEO_PATH, { start, end }), {
      "Content-Type": "video/quicktime",
      "Content-Length": String(chunkSize),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
    }, 206);
  }

  return streamResponse(createReadStream(VIDEO_PATH), {
    "Content-Type": "video/quicktime",
    "Content-Length": String(size),
    "Accept-Ranges": "bytes",
  });
}
