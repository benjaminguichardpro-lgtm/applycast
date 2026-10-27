ALTER TABLE "insights" ALTER COLUMN "ts_seconds" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "status" text DEFAULT 'running' NOT NULL;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "step" text;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "error_code" text;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "source" text DEFAULT 'supadata' NOT NULL;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "goal_metric" text;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "goal_snapshot" text;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "constraint_snapshot" text;--> statement-breakpoint
ALTER TABLE "insights" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;