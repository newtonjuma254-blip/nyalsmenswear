DROP POLICY IF EXISTS "anyone can insert analytics events" ON public.analytics_events;
REVOKE INSERT ON public.analytics_events FROM anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;