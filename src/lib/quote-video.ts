export type ParsedVideo = {
  provider: "youtube" | "vimeo";
  id: string;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl?: string;
};

export function parseVideoUrl(raw: string | undefined | null): ParsedVideo | null {
  const url = raw?.trim();
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      if (!id) return null;
      return youtube(id);
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const embed = u.pathname.match(/^\/embed\/([^/]+)/);
      if (embed) return youtube(embed[1]);
      const v = u.searchParams.get("v");
      if (v) return youtube(v);
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[parts.length - 1];
      if (!id || !/^\d+$/.test(id)) return null;
      return {
        provider: "vimeo",
        id,
        watchUrl: `https://vimeo.com/${id}`,
        embedUrl: `https://player.vimeo.com/video/${id}`,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function youtube(id: string): ParsedVideo {
  return {
    provider: "youtube",
    id,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube.com/embed/${id}`,
    thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  };
}
