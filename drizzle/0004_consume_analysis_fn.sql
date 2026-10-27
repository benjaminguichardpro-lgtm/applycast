-- Counts one analysis against the caller's monthly quota. usage has no write policy, so this is the only write path.
CREATE FUNCTION public.consume_analysis() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.usage (user_id, month, analyses_count)
  VALUES (auth.uid(), to_char(now(), 'YYYY-MM'), 1)
  ON CONFLICT (user_id, month) DO UPDATE SET analyses_count = public.usage.analyses_count + 1;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.consume_analysis() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.consume_analysis() TO authenticated;
