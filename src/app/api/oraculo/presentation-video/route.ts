import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { ReadStream } from "node:fs";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const VIDEO_PATH = path.join(process.cwd(), "assets", "oraculo", "Oraculo-raiz-presentacion.mov");

/** Evita `Controller is already closed` cuando el navegador cancela un rango de video. */
function fileToWebStream(nodeStream: ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: string | Buffer) => {
        try {
          const bytes =
            typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk);
          controller.enqueue(bytes);
        } catch {
          nodeStream.destroy();
        }
      });
      nodeStream.on("end", () => {
        try {
          controller.close();
        } catch {
          /* cliente ya cerró */
        }
      });
      nodeStream.on("error", () => {
        nodeStream.destroy();
        try {
          controller.error(new Error("stream read failed"));
        } catch {
          /* ignore */
        }
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });
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

  let status = 200;
  let start = 0;
  let end = size - 1;
  const baseHeaders: Record<string, string> = {
    "Content-Type": "video/quicktime",
    "Accept-Ranges": "bytes",
  };

  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) {
      return new Response(null, { status: 416 });
    }
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start >= size || end >= size || start > end) {
      return new Response(null, { status: 416 });
    }
    status = 206;
    const chunkSize = end - start + 1;
    baseHeaders["Content-Length"] = String(chunkSize);
    baseHeaders["Content-Range"] = `bytes ${start}-${end}/${size}`;
  } else {
    baseHeaders["Content-Length"] = String(size);
  }

  const nodeStream =
    status === 206
      ? createReadStream(VIDEO_PATH, { start, end })
      : createReadStream(VIDEO_PATH);

  const body = fileToWebStream(nodeStream);

  return new Response(body, { status, headers: baseHeaders });
}
