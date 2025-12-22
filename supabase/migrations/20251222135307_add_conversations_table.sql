/*
  # Add Conversations Table for Direct Messages

  This migration creates a conversations table to support direct messaging
  between users.

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `participant_1` (uuid, references auth.users)
      - `participant_2` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `last_message_at` (timestamp) - for sorting by recent activity

  2. Security
    - Enable RLS on conversations table
    - Users can only view/create conversations they are a participant in

  3. Indexes
    - Composite index on (participant_1, participant_2) for efficient lookups
    - Index on last_message_at for sorting
*/

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  CONSTRAINT different_participants CHECK (participant_1 != participant_2),
  CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2)
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    participant_1 = (select auth.uid()) OR participant_2 = (select auth.uid())
  );

CREATE POLICY "Users can create conversations they participate in"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    participant_1 = (select auth.uid()) OR participant_2 = (select auth.uid())
  );

CREATE POLICY "Users can update own conversations"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    participant_1 = (select auth.uid()) OR participant_2 = (select auth.uid())
  )
  WITH CHECK (
    participant_1 = (select auth.uid()) OR participant_2 = (select auth.uid())
  );

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);