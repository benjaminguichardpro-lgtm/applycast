import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FREE_MONTHLY_ANALYSES } from "@/lib/quota";
import { getMonthStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { HistoryList, type HistoryRow } from "./history-list";

type Raw = {
  id: string;
  video_id: string;
  title: string | null;
  channel: string | null;
  verdict: "strong" | "partial" | "low";
  created_at: string;
  plans: { status: string; actions: { status: string }[] }[];
};

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const [stats, { data }] = await Promise.all([
    getMonthStats(supabase, user.id),
    supabase
      .from("analyses")
      .select("id, video_id, title, channel, verdict, created_at, plans(status, actions(status))")
      .eq("status", "done")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const rows: HistoryRow[] = ((data ?? []) as unknown as Raw[]).map((a) => {
    const plan = a.plans.find((p) => p.status === "validated");
    return {
      id: a.id,
      videoId: a.video_id,
      title: a.title ?? "Untitled video",
      channel: a.channel,
      verdict: a.verdict,
      createdAt: a.created_at,
      progress: plan ? { done: plan.actions.filter((x) => x.status === "done").length, total: plan.actions.length } : null,
    };
  });

  return (
    <section>
      <p className="text-xs text-muted">
        {stats.month} · {stats.analyses} analys{stats.analyses === 1 ? "is" : "es"}
        {stats.isPro ? "" : ` · ${stats.left} of ${FREE_MONTHLY_ANALYSES} free analyses left`}
      </p>
      <h1 className="mt-2 text-4xl font-medium tracking-tight">History</h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        {rows.length === 0 ? (
          <div className="grid place-items-center rounded-shell border border-dashed border-muted/60 bg-card p-10 text-center">
            <div>
              <h2 className="text-xl font-medium">No analyses yet</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
                Paste a YouTube link and you’ll get a verdict in under a minute. Everything you analyze lands here.
              </p>
              <Link href="/analyze" className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white dark:text-navy">
                Analyze a video
              </Link>
            </div>
          </div>
        ) : (
          <HistoryList rows={rows} />
        )}

        <aside className="self-start rounded-shell bg-navy p-6 text-on-navy">
          <h2 className="text-lg font-medium">{stats.month} in numbers</h2>
          <dl className="mt-4 space-y-2">
            {(
              [
                ["Analyses", stats.analyses],
                ["Plans validated", stats.plansValidated],
                ["Actions validated", stats.actionsValidated],
                ["Done rate", `${stats.doneRate}%`],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-navy-soft px-4 py-3 text-sm">
                <dt>{label}</dt>
                <dd className="text-xl font-light">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs opacity-80">
            By verdict: {stats.byVerdict.strong} strong · {stats.byVerdict.partial} partial · {stats.byVerdict.low} low
          </p>
          <p className="mt-1 text-xs opacity-80">Low matches don’t count toward your free analyses.</p>
          <Link href="/analyze" className="mt-4 block rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-navy">
            Analyze a video
          </Link>
        </aside>
      </div>
    </section>
  );
}
