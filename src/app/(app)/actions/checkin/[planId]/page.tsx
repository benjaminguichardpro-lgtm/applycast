import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CheckinForm } from "./checkin-form";

export default async function CheckinPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(planId)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("id, status, validated_at, analyses(title, goal_metric)")
    .eq("id", planId)
    .maybeSingle();
  if (!plan || plan.status !== "validated") notFound();

  const { count } = await supabase.from("checkins").select("id", { count: "exact", head: true }).eq("plan_id", planId);
  if (count) redirect("/actions");

  const { data: actions } = await supabase
    .from("actions")
    .select("id, title, status")
    .eq("plan_id", planId)
    .order("due_date", { ascending: true });

  const analysis = plan.analyses as unknown as { title: string | null; goal_metric: string | null } | null;
  return (
    <CheckinForm
      planId={planId}
      title={analysis?.title ?? null}
      goalMetric={analysis?.goal_metric ?? null}
      validatedAt={plan.validated_at}
      initialActions={(actions ?? []).map((a) => ({ id: a.id as string, title: a.title as string, status: a.status as "open" | "done" | "postponed" | "dropped" }))}
    />
  );
}
