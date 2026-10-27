"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { PointDetail } from "@/lib/pipeline/expand";
import { formatTime, watchUrl } from "@/lib/youtube";
import { expandPoint } from "./actions";

type State = { status: "loading" | "done" | "error"; detail?: PointDetail };

const Ctx = createContext<{ states: Record<string, State>; load: (id: string) => void; videoId: string } | null>(null);

// Shares generated details between the summary and the verdict panel, so a point is generated once.
export function ExpandProvider({ videoId, children }: { videoId: string; children: React.ReactNode }) {
  const [states, setStates] = useState<Record<string, State>>({});
  const started = useRef(new Set<string>());

  const load = useCallback((id: string) => {
    if (started.current.has(id)) return;
    started.current.add(id);
    setStates((s) => ({ ...s, [id]: { status: "loading" } }));
    const fail = () => {
      started.current.delete(id); // lets "Try again" run it anew
      setStates((s) => ({ ...s, [id]: { status: "error" } }));
    };
    expandPoint(id)
      .then((res) => (res.ok ? setStates((s) => ({ ...s, [id]: { status: "done", detail: res.detail } })) : fail()))
      .catch(fail);
  }, []);

  return <Ctx.Provider value={{ states, load, videoId }}>{children}</Ctx.Provider>;
}

export function PointToggle({ id, text, tone }: { id: string; text: string; tone: "light" | "dark" }) {
  const ctx = useContext(Ctx)!;
  const [open, setOpen] = useState(false);
  const state = ctx.states[id];
  const panelId = `detail-${tone}-${id}`;

  function toggle() {
    if (!open && (!state || state.status === "error")) ctx.load(id);
    setOpen(!open);
  }

  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full text-left hover:underline decoration-dotted underline-offset-4"
      >
        {text}
        <span aria-hidden="true" className="ml-1.5 inline-block text-xs opacity-60">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        <div id={panelId} role="region" aria-label="More detail on this point" className={`mt-2 rounded-2xl p-3 text-sm ${tone === "light" ? "bg-field" : "bg-black/20"}`}>
          {(!state || state.status === "loading") && <p className="opacity-70">Reading that part of the video…</p>}
          {state?.status === "error" && (
            <p role="alert">
              Couldn’t expand this point.{" "}
              <button type="button" className="font-semibold underline" onClick={() => ctx.load(id)}>
                Try again
              </button>
            </p>
          )}
          {state?.status === "done" && state.detail && (
            <>
              <p>{state.detail.summary}</p>
              {state.detail.quotes.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {state.detail.quotes.map((q, i) => (
                    <li key={i} className="border-l-2 border-current pl-3 text-xs italic opacity-90">
                      “{q.text}”
                      {q.ts !== null && (
                        <a
                          href={watchUrl(ctx.videoId, q.ts)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open the video at ${formatTime(q.ts)}`}
                          className="ml-2 not-italic font-medium underline"
                        >
                          {formatTime(q.ts)}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
