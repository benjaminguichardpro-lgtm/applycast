-- RLS: every table is readable/writable only by its owner. Trigger: auth signup creates users + profiles rows.
ALTER TABLE public.users ADD CONSTRAINT users_id_auth_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.adaptations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.plan_steps ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated USING (id = auth.uid());
--> statement-breakpoint
CREATE POLICY profiles_own ON public.profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY analyses_own ON public.analyses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY usage_select_own ON public.usage FOR SELECT TO authenticated USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY checkins_own ON public.checkins FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY insights_own ON public.insights FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY adaptations_own ON public.adaptations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY plans_own ON public.plans FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY plan_steps_own ON public.plan_steps FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.plans p JOIN public.analyses a ON a.id = p.analysis_id WHERE p.id = plan_id AND a.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.plans p JOIN public.analyses a ON a.id = p.analysis_id WHERE p.id = plan_id AND a.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY actions_own ON public.actions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.plans p JOIN public.analyses a ON a.id = p.analysis_id WHERE p.id = plan_id AND a.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.plans p JOIN public.analyses a ON a.id = p.analysis_id WHERE p.id = plan_id AND a.user_id = auth.uid()));
--> statement-breakpoint
CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
