import type { z } from "zod";
import { anthropic } from "./anthropic";
import { openai } from "./openai";
import type { Provider, Step } from "./types";

export type { Step } from "./types";

const PROVIDERS: Record<string, Provider> = { openai, anthropic };

// Provider and model come from env per step: LLM_<STEP>_PROVIDER and LLM_<STEP>_MODEL.
// Steps after the verdict fall back to the verdict step's settings when their own are not set.
export function stepConfig(step: Step) {
  const read = (s: string) => ({
    provider: process.env[`LLM_${s.toUpperCase()}_PROVIDER`],
    model: process.env[`LLM_${s.toUpperCase()}_MODEL`],
  });
  let { provider, model } = read(step);
  if ((!provider || !model) && step !== "extract" && step !== "verdict") ({ provider, model } = read("verdict"));
  if (!provider || !model) throw new Error(`LLM_${step.toUpperCase()}_PROVIDER and LLM_${step.toUpperCase()}_MODEL must be set`);
  const impl = PROVIDERS[provider];
  if (!impl) throw new Error(`Unknown LLM provider "${provider}" for step ${step}`);
  return { impl, model };
}

// Models sometimes wrap JSON in prose or code fences; take the outermost object.
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in reply");
  return JSON.parse(text.slice(start, end + 1));
}

// llm.generate(step, input): JSON output validated by a zod schema, one retry if invalid.
export async function generate<S extends z.ZodType>(
  step: Step,
  input: { system: string; user: string; schema: S },
): Promise<z.infer<S>> {
  const { impl, model } = stepConfig(step);
  let user = input.user;
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const reply = await impl({ model, system: input.system, user });
    try {
      const parsed = input.schema.safeParse(extractJson(reply));
      if (parsed.success) return parsed.data;
      lastError = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    } catch (e) {
      lastError = e instanceof Error ? e.message : "invalid JSON";
    }
    user = `${input.user}\n\nYour previous reply was invalid (${lastError}). Reply again with only the JSON object, matching the required format exactly.`;
  }
  throw new Error(`LLM step "${step}" returned invalid output twice: ${lastError}`);
}
