/*
  # Add Priority Column and Chat Infrastructure

  ## Changes Made
  
  ### 1. Tasks Table Enhancement
    - Add `priority` column to tasks table with values: low, medium, high
    - Default priority is 'medium'
    
  ### 2. New Chat Tables
    - `messages` - Legacy messages table for backward compatibility
      - id (uuid, primary key)
      - user_name (text)
      - content (text)
      - task_id (uuid, nullable, references tasks)
      - task_title (text, nullable)
      - task_status (text, nullable)
      - task_priority (text, nullable)
      - created_at (timestamptz)
      
    - `chat_messages` - Enhanced chat messages with multi-channel support
      - id (uuid, primary key)
      - channel_id (uuid, nullable)
      - conversation_id (uuid, nullable)
      - sender_id (uuid, references auth.users)
      - sender_name (text)
      - content (text, nullable)
      - message_type (text: text, voice, image, task)
      - media_url (text, nullable)
      - media_duration (integer, nullable)
      - task_id (uuid, nullable)
      - task_title (text, nullable)
      - task_status (text, nullable)
      - reply_to (uuid, nullable)
      - created_at (timestamptz)
      
    - `channels` - Chat channels for team collaboration
      - id (uuid, primary key)
      - name (text, unique)
      - description (text, nullable)
      - icon (text)
      - color (text)
      - created_by (uuid, references auth.users)
      - created_at (timestamptz)
      
    - `user_presence` - Track online/offline status
      - user_id (uuid, primary key, references auth.users)
      - user_name (text)
      - status (text: online, away, offline)
      - last_seen (timestamptz)
      
    - `message_reads` - Read receipts for messages
      - message_id (uuid, references chat_messages)
      - user_id (uuid, references auth.users)
      - read_at (timestamptz)
      - Primary key: (message_id, user_id)
      
  ### 3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to access their data
*/

-- =============================================
-- 1. ADD PRIORITY COLUMN TO TASKS TABLE
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.tasks 
    ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- =============================================
-- 2. CREATE LEGACY MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  content text NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  task_title text,
  task_status text,
  task_priority text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- 3. CREATE CHANNELS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '💬',
  color text NOT NULL DEFAULT 'blue',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view channels"
  ON public.channels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create channels"
  ON public.channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- =============================================
-- 4. CREATE CHAT MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  conversation_id uuid,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  content text,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'task')),
  media_url text,
  media_duration integer,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  task_title text,
  task_status text,
  reply_to uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS chat_messages_channel_idx ON public.chat_messages (channel_id, created_at);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON public.chat_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS chat_messages_sender_idx ON public.chat_messages (sender_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their channels"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- =============================================
-- 5. CREATE USER PRESENCE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view presence"
  ON public.user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own presence"
  ON public.user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence status"
  ON public.user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 6. CREATE MESSAGE READS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.message_reads (
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view read receipts"
  ON public.message_reads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can mark messages as read"
  ON public.message_reads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
