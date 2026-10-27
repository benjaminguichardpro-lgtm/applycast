import { fetchSupadataTranscript } from "./supadata";
import type { Transcript } from "./types";

export { TranscriptUnavailableError } from "./types";
export type { Segment, Transcript } from "./types";

// Single entry point for transcripts; swap the provider here.
export async function getTranscript(videoId: string): Promise<Transcript> {
  return fetchSupadataTranscript(videoId);
}
