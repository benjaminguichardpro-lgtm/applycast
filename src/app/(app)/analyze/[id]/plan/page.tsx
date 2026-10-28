import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile-db";
import { createClient } from "@/lib/supabase/server";
import { PlanView } from "./plan-view";

// Regenerating the plan is a synchronous action started from this page.
export const maxDuration = 120;

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: analysis } = await supabase.from("analyses").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!analysis) notFound();

  // A validated plan wins over a leftover draft; archived plans (replaced by a redo) are history.
  const { data: plans } = await supabase
    .from("plans")
    .select("id, duration_days, status, validated_at, checkin_due_at")
    .eq("analysis_id", id)
    .order("status", { ascending: false });
  const plan = plans?.find((p) => p.status === "validated") ?? plans?.find((p) => p.status === "draft");
  if (!plan) redirect(`/analyze/${id}/adaptations`);

  const [{ data: steps }, profile] = await Promise.all([
    supabase.from("plan_steps").select("id, day, text, effort_hours").eq("plan_id", plan.id).order("position", { ascending: true }),
    getProfile(supabase, user.id),
  ]);

  const stepList = (steps ?? []).map((s) => ({ id: s.id as string, day: s.day as number, text: s.text as string, effort: Number(s.effort_hours) }));
  return (
    <PlanView
      key={`${plan.id}-${plan.status}-${plan.duration_days}-${stepList.map((s) => s.id).join()}`}
      analysisId={id}
      planId={plan.id}
      validated={plan.status === "validated"}
      validatedAt={plan.validated_at}
      checkinDueAt={plan.checkin_due_at}
      durationDays={plan.duration_days}
      steps={stepList}
      limit={profile.weekly_hours_limit}
    />
  );
}
