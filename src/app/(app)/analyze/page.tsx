import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, isProfileComplete } from "@/lib/profile-db";
import { FREE_MONTHLY_ANALYSES } from "@/lib/quota";
import { getMonthStats } from "@/lib/stats";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AnalyzeFlow } from "./analyze-flow";

// The pipeline runs after the response (see actions.ts); allow it to finish.
export const maxDuration = 120;

export default async function AnalyzePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const [profile, stats] = await Promise.all([getProfile(supabase, user.id), getMonthStats(supabase, user.id)]);
  const month = stats.month;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted">
            {month} · {stats.isPro ? "Unlimited analyses" : `${stats.left} of ${FREE_MONTHLY_ANALYSES} free analyses left`}
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">Paste a video, leave with a plan</h1>
          {!stats.isPro && stats.left === 1 && (
            <p className="mt-2 text-sm text-muted">
              That’s your last free analysis this month.{" "}
              <Link href="/upgrade" className="font-semibold text-primary underline">
                See Pro
              </Link>
            </p>
          )}
        </div>
        <dl className="flex gap-8 text-right">
          {(
            [
              [stats.analyses, `Analyses in ${month}`],
              [stats.plansValidated, "Plans validated"],
              [`${stats.doneRate}%`, "Done rate"],
            ] as const
          ).map(([value, label]) => (
            <div key={label}>
              <dd className="text-4xl font-light">{value}</dd>
              <dt className="text-xs text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-6 max-w-3xl">
        <AnalyzeFlow profileReady={isProfileComplete(profile)} />
      </div>
    </section>
  );
}
