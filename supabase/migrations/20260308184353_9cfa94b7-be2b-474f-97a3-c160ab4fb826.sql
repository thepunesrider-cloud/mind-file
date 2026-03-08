-- Fix the overly permissive notification insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Only authenticated users or the system can insert notifications for themselves or the cron job
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NOT NULL);