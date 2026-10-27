// Data isolation check (acceptance criterion 10). Creates two throwaway users inside one transaction, gives user A data,
// then tries to read and change it as user B and as an anonymous visitor. Everything is rolled back at the end.
// Run: npm run test:rls   (uses DATABASE_URL from .env.local)
import { randomUUID } from "node:crypto";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (run through `npm run test:rls`).");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
class Rollback extends Error {}
const A = randomUUID();
const B = randomUUID();
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

const TABLES = ["users", "profiles", "analyses", "insights", "adaptations", "plans", "plan_steps", "actions", "checkins", "usage"];

async function actAs(tx, userId) {
  await tx`reset role`;
  await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, role: "authenticated" })}, true)`;
  await tx`select set_config('request.jwt.claim.sub', ${userId}, true)`;
  await tx`set local role authenticated`;
}

async function mustFail(tx, name, fn) {
  try {
    await tx.savepoint(fn);
    check(name, false, "the write was allowed");
  } catch {
    check(name, true);
  }
}

try {
  await sql.begin(async (tx) => {
    await tx`insert into auth.users (id, email) values (${A}, ${`rls-a-${A}@example.test`}), (${B}, ${`rls-b-${B}@example.test`})`;
    await tx`update public.profiles set offer = 'A secret offer' where user_id = ${A}`;
    const [analysis] = await tx`insert into public.analyses (user_id, video_id, status, title) values (${A}, 'AAAAAAAAAAA', 'done', 'A private video') returning id`;
    const [insight] = await tx`insert into public.insights (analysis_id, ts_seconds, text, kind, position) values (${analysis.id}, 10, 'A point', 'apply', 0) returning id`;
    await tx`insert into public.adaptations (analysis_id, insight_id, target, text, effort_hours) values (${analysis.id}, ${insight.id}, 'business', 'A change', 1)`;
    const [plan] = await tx`insert into public.plans (analysis_id, duration_days, status) values (${analysis.id}, 7, 'validated') returning id`;
    const [step] = await tx`insert into public.plan_steps (plan_id, position, day, text, effort_hours) values (${plan.id}, 1, 1, 'A step', 1) returning id`;
    await tx`insert into public.actions (plan_id, step_id, title, "group", status, effort_hours) values (${plan.id}, ${step.id}, 'A action', 'today', 'open', 1)`;
    await tx`insert into public.checkins (user_id, plan_id, outcome) values (${A}, ${plan.id}, 'worked')`;
    await tx`insert into public.usage (user_id, month, analyses_count) values (${A}, '2026-10', 1)`;

    // As user A: own data is visible (sanity check that the test data exists).
    await actAs(tx, A);
    for (const t of TABLES) {
      const [{ n }] = await tx.unsafe(`select count(*)::int as n from public.${t}`);
      check(`A sees their own rows in ${t}`, n >= 1, `${n} rows`);
    }

    // As user B: nothing of A's is visible.
    await actAs(tx, B);
    for (const t of TABLES) {
      const [{ n }] = await tx.unsafe(`select count(*)::int as n from public.${t}`);
      const own = t === "users" || t === "profiles" ? 1 : 0; // B's own row from the signup trigger
      check(`B cannot read A's rows in ${t}`, n === own, `${n} rows visible`);
    }
    const stolen = await tx`update public.profiles set offer = 'hacked' where user_id = ${A} returning user_id`;
    check("B cannot update A's profile", stolen.length === 0);
    const deleted = await tx`delete from public.analyses where id = ${analysis.id} returning id`;
    check("B cannot delete A's analysis", deleted.length === 0);
    const moved = await tx`update public.actions set status = 'done' where plan_id = ${plan.id} returning id`;
    check("B cannot change A's actions", moved.length === 0);
    await mustFail(tx, "B cannot create an analysis for A", (s) => s`insert into public.analyses (user_id, video_id) values (${A}, 'BBBBBBBBBBB')`);
    await mustFail(tx, "B cannot write A's quota", (s) => s`insert into public.usage (user_id, month, analyses_count) values (${A}, '2026-11', 99)`);
    await mustFail(tx, "B cannot make themselves Pro", async (s) => {
      const r = await s`update public.users set plan = 'pro' where id = ${B} returning id`;
      if (r.length === 0) throw new Error("no row updated");
    });

    // Anonymous visitor: no access at all.
    await tx`reset role`;
    await tx`set local role anon`;
    for (const t of TABLES) {
      let visible = 0;
      try {
        await tx.savepoint(async (s) => {
          [{ n: visible }] = await s.unsafe(`select count(*)::int as n from public.${t}`);
        });
      } catch {
        visible = 0; // permission denied is the expected outcome
      }
      check(`anonymous visitor cannot read ${t}`, visible === 0);
    }

    throw new Rollback(); // undo everything, including the two test users
  });
} catch (e) {
  if (!(e instanceof Rollback)) {
    console.error("The check could not run:", e.message);
    await sql.end();
    process.exit(1);
  }
}
await sql.end();

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed. Nothing was kept in your database.`);
process.exit(failed ? 1 : 0);
