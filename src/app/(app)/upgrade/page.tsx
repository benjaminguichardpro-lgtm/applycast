import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FOUNDING_PRICE_LABEL, foundingOfferAvailable, nextResetLabel, ordinal, PRO_PRICE_LABEL, proEndsOn } from "@/lib/billing";
import { FREE_MONTHLY_ANALYSES, PRO_MONTHLY_ANALYSES } from "@/lib/quota";
import { getMonthStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { openPortal, startCheckout } from "./actions";

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const [stats, founding] = await Promise.all([getMonthStats(supabase, user.id), foundingOfferAvailable()]);
  const endsOn = stats.isPro ? await proEndsOn(user.id) : null;

  const blocked = stats.left === 0;
  const title = stats.isPro
    ? blocked
      ? `You’ve used your ${PRO_MONTHLY_ANALYSES} analyses this month`
      : stats.isFounding
        ? "You’re on Pro · Founding Member"
        : "You’re on Pro"
    : blocked
      ? `Your ${ordinal(stats.analyses + 1)} analysis needs Pro`
      : `Get ${PRO_MONTHLY_ANALYSES} analyses a month with Pro`;

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted">
            {stats.isPro
              ? `${stats.analyses} of ${PRO_MONTHLY_ANALYSES} analyses used this billing month`
              : `${stats.analyses} of ${FREE_MONTHLY_ANALYSES} free analyses used this month · resets ${nextResetLabel()}`}
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">{title}</h1>
        </div>
        <Link href={blocked ? "/actions" : "/analyze"} className="rounded-full border border-line px-4 py-2 text-sm">
          {stats.isPro ? "Back" : "Not now"}
        </Link>
      </div>

      {welcome && stats.isPro && (
        <p role="status" className="mt-4 rounded-2xl border-2 border-primary bg-chip p-4 text-sm font-semibold">
          ✓ Welcome to Pro. You get {PRO_MONTHLY_ANALYSES} analyses a month.
        </p>
      )}
      {welcome && !stats.isPro && (
        <p role="status" className="mt-4 rounded-2xl bg-chip p-4 text-sm">
          Payment received. Your plan switches to Pro in a few seconds: refresh this page.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-shell bg-card p-6 sm:p-8">
          <div className="rounded-2xl bg-chip p-4 text-sm">
            <p className="font-semibold">✓ Plans, actions and check-ins are never locked.</p>
            <p className="mt-1 text-muted">
              Keep working your {stats.counts.open} open action{stats.counts.open === 1 ? "" : "s"} and your check-ins on the free plan. Only new
              analyses need Pro.
            </p>
          </div>

          <h2 className="mt-6 text-xl font-medium">{stats.month} so far</h2>
          <dl className="mt-3 flex flex-wrap gap-8">
            {(
              [
                [stats.plansValidated, "Plans validated"],
                [`${stats.counts.done}/${stats.actionsValidated}`, "Actions done"],
                [`${stats.doneRate}%`, "Done rate"],
              ] as const
            ).map(([value, label]) => (
              <div key={label}>
                <dd className="text-4xl font-light">{value}</dd>
                <dt className="text-xs text-muted">{label}</dt>
              </div>
            ))}
          </dl>

          <h2 className="mt-6 border-t border-line pt-6 text-xl font-medium">What Pro adds</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              `${PRO_MONTHLY_ANALYSES} video analyses a month (free: ${FREE_MONTHLY_ANALYSES})`,
              "A verdict, adaptations and an action plan on every video",
              "Plans sized to your weekly limit",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span aria-hidden="true" className="text-primary">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <aside className="self-start rounded-shell bg-navy p-6 text-on-navy">
          <h2 className="text-lg font-medium">Applycast Pro</h2>
          <p className="mt-3 text-6xl font-light leading-none">
            {stats.isFounding ? FOUNDING_PRICE_LABEL : PRO_PRICE_LABEL}
            <span className="ml-2 text-base">/ month</span>
            {stats.isFounding && (
              <s className="ml-2 text-base opacity-70">
                <span className="sr-only">Regular price </span>
                {PRO_PRICE_LABEL}
              </s>
            )}
          </p>
          {endsOn && (
            <p role="status" className="mt-4 rounded-2xl bg-white/15 p-3 text-sm font-semibold">
              Subscription cancelled. You keep Pro until {endsOn}, and you won’t be charged again.
            </p>
          )}
          <ul className="mt-4 space-y-1.5 text-sm">
            <li>✓ Cancel anytime</li>
            <li>✓ If you don’t subscribe, your history stays readable</li>
            {!stats.isPro && founding && (
              <li className="font-semibold">★ Founding Member: the first 50 subscribers get 50% off for as long as they stay subscribed</li>
            )}
          </ul>
          {stats.isPro ? (
            <form action={openPortal} className="mt-8">
              <button type="submit" className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy">
                {endsOn ? "Resume or manage subscription" : "Manage subscription"}
              </button>
            </form>
          ) : (
            <form action={startCheckout} className="mt-8">
              <button type="submit" className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy">
                Subscribe
              </button>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}
