ALTER TABLE "insights" ADD COLUMN "is_key" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "insights" ADD COLUMN "key_reason" text;