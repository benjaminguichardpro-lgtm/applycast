import { FOUNDING_DISCOUNT_PERCENT, FOUNDING_PRICE_LABEL, PRO_PRICE_LABEL } from "@/lib/billing";
import { FREE_MONTHLY_ANALYSES, PRO_MONTHLY_ANALYSES } from "@/lib/quota";
import { appLink } from "@/lib/site";
import { CountUp } from "./count-up";
import { Reassurance } from "./reassurance";
import { reveal } from "./reveal";
import { outlineButton, primaryButton } from "./buttons";
import { RollLabel } from "./roll-label";

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm text-muted">
      <span className="text-primary" aria-hidden="true">✓</span>
      {children}
    </li>
  );
}

// "$9.50" -> 9.5 with 2 decimals, so the count-up lands exactly on the label.
const foundingPrice = Number(FOUNDING_PRICE_LABEL.slice(1));
const foundingDecimals = FOUNDING_PRICE_LABEL.split(".")[1]?.length ?? 0;

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto mt-28 max-w-[1136px] scroll-mt-8 px-4">
      <h2 {...reveal()} className="text-center text-4xl font-semibold tracking-tight">Simple pricing</h2>
      <div className="mx-auto mt-10 grid max-w-[940px] gap-3 rounded-[28px] border border-line/60 bg-card/60 p-3 dark:border-line md:grid-cols-2">
        <div {...reveal(1, "left")} className="flex flex-col rounded-3xl border border-line/60 bg-card p-6 dark:border-line">
          <div className="flex items-baseline justify-between">
            <h3 className="font-medium">Free</h3>
            <p className="text-4xl font-semibold">$0</p>
          </div>
          <ul className="mb-6 mt-6 space-y-3">
            <Item>
              <span><CountUp value={FREE_MONTHLY_ANALYSES} /> analyses per month</span>
            </Item>
            <Item>Plans, actions and check-ins never locked</Item>
          </ul>
          <a href={appLink("/login")} className={`${outlineButton} mt-auto`}><RollLabel>Try it free</RollLabel></a>
        </div>
        <div {...reveal(2, "right")} className="glow-border flex flex-col rounded-3xl border border-line/60 bg-card p-6 dark:border-line">
          <div className="flex items-baseline justify-between">
            <h3 className="font-medium">Pro</h3>
            <p>
              <s className="mr-2 text-muted">{PRO_PRICE_LABEL}</s>
              <span className="text-4xl font-semibold"><CountUp value={foundingPrice} decimals={foundingDecimals} prefix="$" /></span>
              <span className="text-xs text-muted"> / mo</span>
            </p>
          </div>
          <ul className="mb-6 mt-6 space-y-3">
            <Item>
              <span><CountUp value={PRO_MONTHLY_ANALYSES} /> analyses per month</span>
            </Item>
            <Item>Cancel anytime</Item>
          </ul>
          <p className="mt-5 rounded-2xl bg-field p-3 text-xs text-muted">
            <strong className="text-ink">Founding offer:</strong> the first 50 subscribers pay {FOUNDING_DISCOUNT_PERCENT}% less, for as long as they stay subscribed.
          </p>
          <a href={appLink("/upgrade")} className={`${primaryButton} mt-5 !py-3`}><RollLabel>Claim a Founding spot</RollLabel></a>
        </div>
      </div>
      <Reassurance />
    </section>
  );
}
