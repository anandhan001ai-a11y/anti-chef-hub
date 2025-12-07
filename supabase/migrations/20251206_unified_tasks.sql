-- ChefAnand Hub - Unified Tasks Schema
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS cleaning_supplies CASCADE;
DROP TABLE IF EXISTS cleaning_tasks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Create unified tasks table
CREATE TABLE public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  board_type  text NOT NULL CHECK (board_type IN ('todo', 'taskboard', 'cleaning')),
  section_key text,
  sort_index  integer NOT NULL DEFAULT 0,
  due_date    timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX tasks_user_board_idx ON public.tasks (user_id, board_type, section_key);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);
