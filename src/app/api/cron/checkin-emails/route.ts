import { NextResponse, type NextRequest } from "next/server";
import { checkinEmail, sendEmail } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

// Called daily by Vercel Cron (see vercel.json) with "Authorization: Bearer $CRON_SECRET".
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, analyses!inner(user_id, title)")
    .eq("status", "validated")
    .is("checkin_emailed_at", null)
    .lte("checkin_due_at", new Date().toISOString());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  const failed: string[] = [];
  for (const plan of plans ?? []) {
    const analysis = plan.analyses as unknown as { user_id: string; title: string | null };
    // Skip plans whose check-in was already saved.
    const { count } = await supabase.from("checkins").select("id", { count: "exact", head: true }).eq("plan_id", plan.id);
    if (count) {
      await supabase.from("plans").update({ checkin_emailed_at: new Date().toISOString() }).eq("id", plan.id);
      continue;
    }
    const [{ data: user }, { count: openCount }] = await Promise.all([
      supabase.from("users").select("email").eq("id", analysis.user_id).single(),
      supabase.from("actions").select("id", { count: "exact", head: true }).eq("plan_id", plan.id).in("status", ["open", "postponed"]),
    ]);
    if (!user?.email) continue;
    try {
      await sendEmail({ to: user.email, ...checkinEmail({ title: analysis.title, url: `${base}/actions/checkin/${plan.id}`, openCount: openCount ?? 0 }) });
      await supabase.from("plans").update({ checkin_emailed_at: new Date().toISOString() }).eq("id", plan.id);
      sent++;
    } catch (e) {
      console.error("check-in email failed:", e instanceof Error ? e.message : e);
      failed.push(plan.id);
    }
  }
  return NextResponse.json({ due: plans?.length ?? 0, sent, failed: failed.length });
}
