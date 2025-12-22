/*
  # Optimize RLS Policies for Better Performance

  This migration updates RLS policies to use `(select auth.uid())` instead of
  `auth.uid()` directly. This prevents re-evaluation of the auth function for
  each row, significantly improving query performance at scale.

  1. Updated Policies
    - roster_uploads: Users can update their own roster uploads
    - tasks: All CRUD policies
    - channels: Authenticated users can create channels
    - chat_messages: Users can send messages
    - user_presence: Insert and update policies
    - message_reads: Users can mark messages as read
*/

-- roster_uploads policy
DROP POLICY IF EXISTS "Users can update their own roster uploads" ON public.roster_uploads;
CREATE POLICY "Users can update their own roster uploads"
  ON public.roster_uploads
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = (select auth.uid()))
  WITH CHECK (uploaded_by = (select auth.uid()));

-- tasks policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR user_id IS NULL)
  WITH CHECK (user_id = (select auth.uid()) OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR user_id IS NULL);

-- channels policy
DROP POLICY IF EXISTS "Authenticated users can create channels" ON public.channels;
CREATE POLICY "Authenticated users can create channels"
  ON public.channels
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

-- chat_messages policy
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

-- user_presence policies
DROP POLICY IF EXISTS "Users can update own presence" ON public.user_presence;
CREATE POLICY "Users can update own presence"
  ON public.user_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own presence status" ON public.user_presence;
CREATE POLICY "Users can update own presence status"
  ON public.user_presence
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- message_reads policy
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_reads;
CREATE POLICY "Users can mark messages as read"
  ON public.message_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));