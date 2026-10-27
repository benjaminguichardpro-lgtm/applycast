// start is in seconds; null for pasted transcripts that carry no timestamps.
export type Segment = { start: number | null; text: string };

export type Transcript = { segments: Segment[]; lang: string | null; source: "supadata" | "pasted" };

export class TranscriptUnavailableError extends Error {
  constructor(message = "Transcript unavailable") {
    super(message);
    this.name = "TranscriptUnavailableError";
  }
}
