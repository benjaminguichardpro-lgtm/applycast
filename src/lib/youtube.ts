const ID = /^[A-Za-z0-9_-]{11}$/;

// Accepts watch, youtu.be, shorts, embed and live URLs; returns the 11-char video id or null.
export function parseVideoId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const [, kind, rest] = url.pathname.split("/");
      if (["shorts", "embed", "live", "v"].includes(kind)) id = rest ?? null;
    }
  }
  return id && ID.test(id) ? id : null;
}

export function watchUrl(videoId: string, seconds?: number | null) {
  const base = `https://www.youtube.com/watch?v=${videoId}`;
  return seconds ? `${base}&t=${Math.floor(seconds)}` : base;
}

export function thumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${String(m).padStart(2, "0")}:${sec}`;
}
