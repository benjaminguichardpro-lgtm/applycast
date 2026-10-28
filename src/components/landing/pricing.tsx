import { FOUNDING_DISCOUNT_PERCENT, FOUNDING_PRICE_LABEL, PRO_PRICE_LABEL } from "@/lib/billing";
import { FREE_MONTHLY_ANALYSES, PRO_MONTHLY_ANALYSES } from "@/lib/quota";
import { appLink } from "@/lib/site";
import { outlineButton, primaryButton } from "./buttons";

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm text-muted">
      <span className="text-primary" aria-hidden="true">✓</span>
      {children}
    </li>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto mt-28 max-w-[1136px] scroll-mt-8 px-4">
      <h2 className="text-center text-4xl font-semibold tracking-tight">Simple pricing</h2>
      <div className="mx-auto mt-10 grid max-w-[940px] gap-3 rounded-[28px] border border-line/60 bg-card/60 p-3 dark:border-line md:grid-cols-2">
        <div className="flex flex-col rounded-3xl border border-line/60 bg-card p-6 dark:border-line">
          <div className="flex items-baseline justify-between">
            <h3 className="font-medium">Free</h3>
            <p className="text-4xl font-semibold">$0</p>
          </div>
          <ul className="mb-6 mt-6 space-y-3">
            <Item>{FREE_MONTHLY_ANALYSES} analyses per month</Item>
            <Item>Plans, actions and check-ins never locked</Item>
          </ul>
          <a href={appLink("/login")} className={`${outlineButton} mt-auto`}>Try it free</a>
        </div>
        <div className="flex flex-col rounded-3xl border border-line/60 bg-card p-6 dark:border-line">
          <div className="flex items-baseline justify-between">
            <h3 className="font-medium">Pro</h3>
            <p>
              <s className="mr-2 text-muted">{PRO_PRICE_LABEL}</s>
              <span className="text-4xl font-semibold">{FOUNDING_PRICE_LABEL}</span>
              <span className="text-xs text-muted"> / mo</span>
            </p>
          </div>
          <ul className="mb-6 mt-6 space-y-3">
            <Item>{PRO_MONTHLY_ANALYSES} analyses per month</Item>
            <Item>Cancel anytime</Item>
          </ul>
          <p className="mt-5 rounded-2xl bg-field p-3 text-xs text-muted">
            <strong className="text-ink">Founding offer:</strong> the first 50 subscribers pay {FOUNDING_DISCOUNT_PERCENT}% less, for as long as they stay subscribed.
          </p>
          <a href={appLink("/upgrade")} className={`${primaryButton} mt-5 !py-3`}>Claim a Founding spot</a>
        </div>
      </div>
    </section>
  );
}
