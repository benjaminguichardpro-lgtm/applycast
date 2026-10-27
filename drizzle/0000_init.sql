CREATE TYPE "public"."action_group" AS ENUM('today', 'week', 'later');--> statement-breakpoint
CREATE TYPE "public"."action_status" AS ENUM('open', 'done', 'postponed', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."adaptation_category" AS ENUM('Habit', 'Skill', 'Time');--> statement-breakpoint
CREATE TYPE "public"."adaptation_target" AS ENUM('business', 'profile');--> statement-breakpoint
CREATE TYPE "public"."checkin_outcome" AS ENUM('worked', 'no_effect', 'too_early', 'failed');--> statement-breakpoint
CREATE TYPE "public"."insight_kind" AS ENUM('apply', 'against', 'na');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('Idea', 'Pre-revenue', '<$10k MRR', '$10k–100k MRR', '$100k+ MRR');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('strong', 'partial', 'low');--> statement-breakpoint
CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"step_id" uuid,
	"title" text NOT NULL,
	"group" "action_group" NOT NULL,
	"due_date" timestamp with time zone,
	"status" "action_status" DEFAULT 'open' NOT NULL,
	"postponed_until" timestamp with time zone,
	"drop_reason" text,
	"effort_hours" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adaptations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"insight_id" uuid NOT NULL,
	"target" "adaptation_target" NOT NULL,
	"category" "adaptation_category",
	"text" text NOT NULL,
	"effort_hours" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"video_id" text NOT NULL,
	"title" text,
	"channel" text,
	"published_at" timestamp with time zone,
	"duration" integer,
	"transcript_text" text,
	"verdict" "verdict",
	"verdict_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"outcome" "checkin_outcome" NOT NULL,
	"metric_before" text,
	"metric_after" text,
	"result_line" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"ts_seconds" integer NOT NULL,
	"text" text NOT NULL,
	"kind" "insight_kind" NOT NULL,
	"tag" text,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "plan_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"day" integer NOT NULL,
	"text" text NOT NULL,
	"effort_hours" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"duration_days" integer NOT NULL,
	"validated_at" timestamp with time zone,
	"checkin_due_at" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"offer" text,
	"stage" "stage",
	"role" text,
	"active_goal" text,
	"constraint_text" text,
	"weekly_hours_limit" numeric DEFAULT '6' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"user_id" uuid NOT NULL,
	"month" text NOT NULL,
	"analyses_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_user_id_month_pk" PRIMARY KEY("user_id","month")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_step_id_plan_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."plan_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptations" ADD CONSTRAINT "adaptations_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptations" ADD CONSTRAINT "adaptations_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_steps" ADD CONSTRAINT "plan_steps_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;