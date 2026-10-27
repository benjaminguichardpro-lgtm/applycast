import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const stageEnum = pgEnum("stage", [
  "Idea",
  "Pre-revenue",
  "<$10k MRR",
  "$10k–100k MRR",
  "$100k+ MRR",
]);
export const verdictEnum = pgEnum("verdict", ["strong", "partial", "low"]);
export const insightKindEnum = pgEnum("insight_kind", ["apply", "against", "na"]);
export const adaptationTargetEnum = pgEnum("adaptation_target", ["business", "profile"]);
export const adaptationCategoryEnum = pgEnum("adaptation_category", ["Habit", "Skill", "Time"]);
export const actionGroupEnum = pgEnum("action_group", ["today", "week", "later"]);
export const actionStatusEnum = pgEnum("action_status", ["open", "done", "postponed", "dropped"]);
export const checkinOutcomeEnum = pgEnum("checkin_outcome", [
  "worked",
  "no_effect",
  "too_early",
  "failed",
]);

// users.id equals auth.users.id (FK and creation trigger live in the custom SQL migration).
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  offer: text("offer"),
  stage: stageEnum("stage"),
  role: text("role"),
  activeGoal: text("active_goal"),
  constraintText: text("constraint_text"),
  weeklyHoursLimit: numeric("weekly_hours_limit").notNull().default("6"),
});

export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: text("video_id").notNull(),
  title: text("title"),
  channel: text("channel"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  duration: integer("duration"),
  transcriptText: text("transcript_text"),
  verdict: verdictEnum("verdict"),
  verdictReason: text("verdict_reason"),
  // Pipeline state: running → done | failed. step is the current UI step while running.
  status: text("status").notNull().default("running"),
  step: text("step"),
  errorCode: text("error_code"),
  source: text("source").notNull().default("supadata"),
  goalMetric: text("goal_metric"),
  // The goal and constraint the verdict was scored against (the profile can change later).
  goalSnapshot: text("goal_snapshot"),
  constraintSnapshot: text("constraint_snapshot"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),
  // Order of the point in the video; ts_seconds is null when a pasted transcript has no timestamps.
  position: integer("position").notNull().default(0),
  tsSeconds: integer("ts_seconds"),
  text: text("text").notNull(),
  kind: insightKindEnum("kind").notNull(),
  tag: text("tag"),
  reason: text("reason"),
  // Longer summary generated on click: { summary, quotes: [{ text, ts }] }.
  detail: jsonb("detail"),
});

export const adaptations = pgTable("adaptations", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),
  insightId: uuid("insight_id")
    .notNull()
    .references(() => insights.id, { onDelete: "cascade" }),
  target: adaptationTargetEnum("target").notNull(),
  category: adaptationCategoryEnum("category"),
  text: text("text").notNull(),
  effortHours: numeric("effort_hours").notNull(),
  // Checkbox state on the Adaptations screen (checked by default).
  selected: boolean("selected").notNull().default(true),
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),
  durationDays: integer("duration_days").notNull(),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  checkinDueAt: timestamp("checkin_due_at", { withTimezone: true }),
  // draft | validated
  status: text("status").notNull().default("draft"),
  // Which adaptations the plan was built from.
  target: adaptationTargetEnum("target"),
  // Set when the day-7 email went out, so the cron never sends it twice.
  checkinEmailedAt: timestamp("checkin_emailed_at", { withTimezone: true }),
});

export const planSteps = pgTable("plan_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  day: integer("day").notNull(),
  text: text("text").notNull(),
  effortHours: numeric("effort_hours").notNull(),
});

export const actions = pgTable("actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  stepId: uuid("step_id").references(() => planSteps.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  group: actionGroupEnum("group").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: actionStatusEnum("status").notNull().default("open"),
  postponedUntil: timestamp("postponed_until", { withTimezone: true }),
  dropReason: text("drop_reason"),
  effortHours: numeric("effort_hours").notNull(),
});

// plan_id is not a FK and user_id is added to §3: check-ins must survive analysis deletion
// (done rate) and stay isolable per user once their plan is gone.
export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").notNull(),
  outcome: checkinOutcomeEnum("outcome").notNull(),
  metricBefore: text("metric_before"),
  metricAfter: text("metric_after"),
  resultLine: text("result_line"),
  // Snapshot of the plan's actions when the check-in was saved: keeps the done rate right if the plan is deleted later.
  actionsTotal: integer("actions_total").notNull().default(0),
  actionsDone: integer("actions_done").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// month is "YYYY-MM".
export const usage = pgTable(
  "usage",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    analysesCount: integer("analyses_count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.month] })],
);
