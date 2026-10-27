import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile-db";
import { createClient } from "@/lib/supabase/server";
import { AdaptationsView, GenerateAdaptations } from "./adaptations-view";

// Generating adaptations is a synchronous action started from this page.
export const maxDuration = 120;

export default async function AdaptationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: a } = await supabase.from("analyses").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!a) notFound();
  if (a.status !== "done" || a.verdict === "low") redirect(`/analyze/${id}`);

  const [{ data: insights }, { data: adaptations }, profile] = await Promise.all([
    supabase.from("insights").select("id, ts_seconds, text, kind, tag, reason").eq("analysis_id", id).order("position", { ascending: true }),
    supabase.from("adaptations").select("id, insight_id, target, category, text, effort_hours, selected").eq("analysis_id", id),
    getProfile(supabase, user.id),
  ]);

  const points = insights ?? [];
  if (!adaptations || adaptations.length === 0) {
    return <GenerateAdaptations analysisId={id} />;
  }

  const byInsight = new Map(points.map((p) => [p.id, p]));
  const items = adaptations
    .filter((x) => byInsight.has(x.insight_id))
    .map((x) => ({
      id: x.id as string,
      target: x.target as "business" | "profile",
      category: x.category as "Habit" | "Skill" | "Time" | null,
      text: x.text as string,
      effort: Number(x.effort_hours),
      selected: x.selected as boolean,
      from: { ts: byInsight.get(x.insight_id)!.ts_seconds as number | null, text: byInsight.get(x.insight_id)!.text as string, position: points.findIndex((p) => p.id === x.insight_id) },
    }))
    .sort((p, q) => p.from.position - q.from.position);

  const leftOut = points
    .filter((p) => p.kind !== "apply")
    .map((p) => ({ ts: p.ts_seconds as number | null, text: p.text as string, kind: p.kind as "against" | "na", tag: p.tag as string | null, reason: p.reason as string | null }));

  return (
    <AdaptationsView
      analysisId={id}
      items={items}
      leftOut={leftOut}
      goalMetric={a.goal_metric}
      limit={profile.weekly_hours_limit}
      context={{ offer: profile.offer, stage: profile.stage, role: profile.role }}
    />
  );
}
