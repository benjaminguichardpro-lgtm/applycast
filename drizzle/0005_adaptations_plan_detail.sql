ALTER TABLE "adaptations" ADD COLUMN "selected" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "insights" ADD COLUMN "detail" jsonb;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "target" "adaptation_target";