-- Newer Supabase projects no longer expose new tables to the Data API by default; RLS still limits rows to their owner.
GRANT USAGE ON SCHEMA public TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
