import { ANNUAL_FREE_MONTHS, PRO_ANNUAL_PRICE, PRO_PRICE } from "@/lib/billing";
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
              <span className="text-4xl font-semibold"><CountUp value={PRO_PRICE} prefix="$" /></span>
              <span className="text-xs text-muted"> / mo</span>
            </p>
          </div>
          <p className="mt-1 text-right text-xs text-muted">
            Or ${PRO_ANNUAL_PRICE} billed annually - Save {ANNUAL_FREE_MONTHS} month{ANNUAL_FREE_MONTHS === 1 ? "" : "s"}
          </p>
          <ul className="mb-6 mt-6 space-y-3">
            <Item>
              <span><CountUp value={PRO_MONTHLY_ANALYSES} /> analyses per month</span>
            </Item>
            <Item>Cancel anytime</Item>
          </ul>
          <a href={appLink("/upgrade")} className={`${primaryButton} mt-auto !py-3`}><RollLabel>Get Pro</RollLabel></a>
        </div>
      </div>
      <Reassurance />
    </section>
  );
}
