ALTER TABLE "checkins" ADD COLUMN "actions_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "checkins" ADD COLUMN "actions_done" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "checkin_emailed_at" timestamp with time zone;