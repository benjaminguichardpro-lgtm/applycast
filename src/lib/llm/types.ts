export type Step = "extract" | "verdict" | "adapt" | "check" | "plan" | "expand";

export type CompleteInput = { model: string; system: string; user: string };

// A provider returns the raw text of the model's reply.
export type Provider = (input: CompleteInput) => Promise<string>;
