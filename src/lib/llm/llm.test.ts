import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { extractJson, generate, stepConfig } from "./index";

const schema = z.object({ ok: z.boolean() });

function reply(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

beforeEach(() => {
  process.env.LLM_EXTRACT_PROVIDER = "openai";
  process.env.LLM_EXTRACT_MODEL = "test-model";
  process.env.OPENAI_API_KEY = "test-key";
});
afterEach(() => vi.unstubAllGlobals());

describe("extractJson", () => {
  it("finds the object inside prose or code fences", () => {
    expect(extractJson('Sure!\n```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });
});

describe("generate", () => {
  it("returns validated output", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply('{"ok":true}')));
    expect(await generate("extract", { system: "s", user: "u", schema })).toEqual({ ok: true });
  });

  it("retries once when the first reply is invalid", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply('{"ok":"yes"}')).mockResolvedValueOnce(reply('{"ok":true}'));
    vi.stubGlobal("fetch", fetchMock);
    expect(await generate("extract", { system: "s", user: "u", schema })).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after a second invalid reply", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => reply("not json"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(generate("extract", { system: "s", user: "u", schema })).rejects.toThrow(/invalid output twice/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails clearly when a step is not configured", async () => {
    delete process.env.LLM_EXTRACT_MODEL;
    await expect(generate("extract", { system: "s", user: "u", schema })).rejects.toThrow(/LLM_EXTRACT_PROVIDER/);
  });
});

describe("stepConfig", () => {
  it("falls back to the verdict step for later steps", () => {
    process.env.LLM_VERDICT_PROVIDER = "openai";
    process.env.LLM_VERDICT_MODEL = "verdict-model";
    delete process.env.LLM_PLAN_PROVIDER;
    delete process.env.LLM_PLAN_MODEL;
    expect(stepConfig("plan").model).toBe("verdict-model");
  });
  it("uses a step's own settings when present", () => {
    process.env.LLM_PLAN_PROVIDER = "anthropic";
    process.env.LLM_PLAN_MODEL = "own-model";
    expect(stepConfig("plan").model).toBe("own-model");
    delete process.env.LLM_PLAN_PROVIDER;
    delete process.env.LLM_PLAN_MODEL;
  });
});
