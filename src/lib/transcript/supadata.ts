import { TranscriptUnavailableError, type Segment, type Transcript } from "./types";
import { watchUrl } from "../youtube";

const BASE = "https://api.supadata.ai/v1";

type Chunk = { text: string; offset: number; duration: number; lang?: string };
type TranscriptResponse = { content?: Chunk[] | string; lang?: string; jobId?: string; status?: string };

function headers() {
  const key = process.env.SUPADATA_API_KEY;
  if (!key) throw new Error("SUPADATA_API_KEY is not set");
  return { "x-api-key": key };
}

// mode=native: only existing captions, never AI transcription (out of MVP scope, and billed higher).
export async function fetchSupadataTranscript(videoId: string): Promise<Transcript> {
  const params = new URLSearchParams({ url: watchUrl(videoId), text: "false", mode: "native" });
  let res = await fetch(`${BASE}/transcript?${params}`, { headers: headers(), signal: AbortSignal.timeout(45_000) });
  // Supadata rate-limits bursts: wait and retry a few times before giving up.
  for (let attempt = 1; res.status === 429 && attempt <= 3; attempt++) {
    await new Promise((r) => setTimeout(r, 2000 * attempt));
    res = await fetch(`${BASE}/transcript?${params}`, { headers: headers(), signal: AbortSignal.timeout(45_000) });
  }

  if (res.status === 206 || res.status === 404) throw new TranscriptUnavailableError();
  if (!res.ok) throw new Error(`Supadata transcript error ${res.status}`);

  let body = (await res.json()) as TranscriptResponse;
  if (res.status === 202 && body.jobId) body = await pollJob(body.jobId);

  const chunks = Array.isArray(body.content) ? body.content : [];
  const segments: Segment[] = chunks
    .filter((c) => c.text?.trim())
    .map((c) => ({ start: Math.max(0, c.offset / 1000), text: c.text.replace(/\s+/g, " ").trim() }));
  if (segments.length === 0) throw new TranscriptUnavailableError();
  return { segments, lang: body.lang ?? null, source: "supadata" };
}

async function pollJob(jobId: string): Promise<TranscriptResponse> {
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch(`${BASE}/transcript/${jobId}`, { headers: headers(), signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`Supadata job error ${res.status}`);
    const body = (await res.json()) as TranscriptResponse;
    if (body.status === "completed" || body.content) return body;
    if (body.status === "failed") throw new TranscriptUnavailableError();
  }
  throw new Error("Supadata job timed out");
}

export type VideoMeta = {
  title: string | null;
  channel: string | null;
  publishedAt: string | null;
  duration: number | null;
};

// Supadata metadata gives duration and date; falls back to YouTube oEmbed (free) for title and channel.
export async function fetchVideoMeta(videoId: string): Promise<VideoMeta> {
  try {
    const res = await fetch(`${BASE}/metadata?${new URLSearchParams({ url: watchUrl(videoId) })}`, {
      headers: headers(),
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      const m = await res.json();
      return {
        title: m.title ?? null,
        channel: m.author?.displayName ?? m.author?.username ?? null,
        publishedAt: m.createdAt ?? null,
        duration: typeof m.media?.duration === "number" ? Math.round(m.media.duration) : null,
      };
    }
  } catch {}
  return fetchOEmbed(videoId);
}

export async function fetchOEmbed(videoId: string): Promise<VideoMeta> {
  const empty = { title: null, channel: null, publishedAt: null, duration: null };
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?${new URLSearchParams({ url: watchUrl(videoId), format: "json" })}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return empty;
    const m = await res.json();
    return { ...empty, title: m.title ?? null, channel: m.author_name ?? null };
  } catch {
    return empty;
  }
}
