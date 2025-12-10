-- Allow system/user to insert notifications safely

-- Drop existing policies if present to avoid duplicates
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Permit users to insert their own notifications (client-side inserts)
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Permit server-side triggers/functions to insert notifications for any valid auth user
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = user_id
    )
  );

