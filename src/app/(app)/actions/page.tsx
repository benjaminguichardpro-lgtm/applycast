import Link from "next/link";
import { redirect } from "next/navigation";
import { EffortGauge } from "@/components/effort-gauge";
import { getCurrentUser } from "@/lib/auth";
import { formatHours, round1 } from "@/lib/effort";
import { getProfile } from "@/lib/profile-db";
import { getMonthStats, monthStart, weekBounds } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { ActionsList, TodayLabel, type ActionRow } from "./actions-list";

type Raw = {
  id: string;
  title: string;
  group: "today" | "week" | "later";
  due_date: string | null;
  status: ActionRow["status"];
  postponed_until: string | null;
  drop_reason: string | null;
  effort_hours: number | string;
  plans: { status: string; validated_at: string | null; analyses: { title: string | null } | null };
};

export default async function ActionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [stats, profile, { data: raw }, { data: duePlans }, { data: checkins }] = await Promise.all([
    getMonthStats(supabase, user.id),
    getProfile(supabase, user.id),
    supabase
      .from("actions")
      .select("id, title, group, due_date, status, postponed_until, drop_reason, effort_hours, plans!inner(status, validated_at, analyses(title))")
      .eq("plans.status", "validated")
      .order("due_date", { ascending: true }),
    supabase
      .from("plans")
      .select("id, validated_at, analyses(title)")
      .eq("status", "validated")
      .lte("checkin_due_at", nowIso)
      .order("checkin_due_at", { ascending: true }),
    supabase.from("checkins").select("plan_id"),
  ]);

  // Finished actions drop off after the month; unfinished ones stay until handled.
  const since = monthStart().toISOString();
  const rows: ActionRow[] = ((raw ?? []) as unknown as Raw[])
    .filter((a) => a.status === "open" || a.status === "postponed" || (a.plans.validated_at ?? "") >= since)
    .map((a) => ({
      id: a.id,
      title: a.title,
      group: a.group,
      dueDate: a.due_date,
      status: a.status,
      postponedUntil: a.postponed_until,
      dropReason: a.drop_reason,
      effort: Number(a.effort_hours),
      from: a.plans.analyses?.title ?? null,
    }));

  // Effort this week: planned time of actions due this week that are still in play, and how much is already done.
  const { start, end } = weekBounds();
  const inWeek = rows.filter(
    (r) => r.dueDate && new Date(r.dueDate) >= start && new Date(r.dueDate) < end && r.status !== "dropped" && r.status !== "postponed",
  );
  const planned = round1(inWeek.reduce((n, r) => n + r.effort, 0));
  const doneHours = round1(inWeek.filter((r) => r.status === "done").reduce((n, r) => n + r.effort, 0));

  const checkedIn = new Set((checkins ?? []).map((c) => c.plan_id as string));
  const due = ((duePlans ?? []) as unknown as { id: string; validated_at: string | null; analyses: { title: string | null } | null }[]).find(
    (p) => !checkedIn.has(p.id),
  );
  const validatedLabel = due?.validated_at
    ? new Date(due.validated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    : null;

  const groups = [
    { key: "today", label: "Today" },
    { key: "week", label: "This week" },
    { key: "later", label: "Later" },
  ] as const;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted">
            <TodayLabel /> · {stats.counts.open} open · {stats.plansValidated} plan{stats.plansValidated === 1 ? "" : "s"} validated
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">My actions</h1>
        </div>
        <Link href="/analyze" className="rounded-full border border-line px-4 py-2 text-sm">
          New analysis
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        {rows.length === 0 ? (
          <div className="rounded-shell border border-dashed border-muted/60 bg-card p-10 text-center">
            <h2 className="text-xl font-medium">No actions yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Analyze a video, pick adaptations and validate a plan: its steps land here.</p>
            <Link href="/analyze" className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white">
              Analyze a video
            </Link>
          </div>
        ) : (
          <ActionsList rows={rows} groups={groups.map((g) => ({ ...g }))} />
        )}

        <aside className="self-start rounded-shell bg-navy p-6 text-on-navy">
          <h2 className="text-lg font-medium">Done rate · {stats.month}</h2>
          <p className="mt-2 text-6xl font-light leading-none">{stats.doneRate}%</p>
          <p className="mt-2 text-xs opacity-80">
            done / validated · {stats.counts.done} of {stats.actionsValidated} actions
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {(
              [
                ["Done", stats.counts.done],
                ["Open", stats.counts.open],
                ["Postponed", stats.counts.postponed],
                ["Dropped", stats.counts.dropped],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-navy-soft px-4 py-3">
                <dt>{label}</dt>
                <dd className="text-lg">{n}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5">
            <EffortGauge hours={planned} limit={profile.weekly_hours_limit} />
            <p className="mt-1 text-xs opacity-80">{formatHours(doneHours)} done this week</p>
          </div>
          {due && (
            <div className="mt-5 rounded-2xl bg-navy-soft p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Day-7 check-in due</p>
              <p className="mt-1 text-sm">
                {due.analyses?.title ? `“${due.analyses.title}”` : "Your plan"}
                {validatedLabel ? ` · validated ${validatedLabel}` : ""}
              </p>
              <Link href={`/actions/checkin/${due.id}`} className="mt-3 block rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-navy">
                Check in
              </Link>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
