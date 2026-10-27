-- The cron job uses the service role; new Supabase projects do not grant it access to migrated tables by default.
GRANT USAGE ON SCHEMA public TO service_role;
--> statement-breakpoint
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
