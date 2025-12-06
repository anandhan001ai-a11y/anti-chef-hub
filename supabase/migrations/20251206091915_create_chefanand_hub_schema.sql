/*
  # ChefAnand Hub Dashboard Schema

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `due_date` (timestamptz)
      - `priority` (text: 'high', 'medium', 'low')
      - `status` (text: 'todo', 'in-progress', 'completed')
      - `category` (text)
      - `kitchen_section` (text: 'hot', 'cold', 'pastry', 'butchery', 'general')
      - `task_type` (text: 'costing', 'menu', 'audit', 'inventory', 'prep', 'other')
      - `position` (integer, for ordering within status columns)
      - `calendar_date` (date, for calendar integration)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `task_attachments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `file_name` (text)
      - `file_url` (text)
      - `file_type` (text)
      - `uploaded_at` (timestamptz)

    - `task_comments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `comment_text` (text)
      - `created_at` (timestamptz)

    - `calendar_events`
      - `id` (uuid, primary key)
      - `event_name` (text)
      - `event_date` (date)
      - `event_type` (text: 'holiday', 'cultural', 'deadline', 'special')
      - `description` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a single-user demo app)
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  due_date timestamptz,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed')),
  category text DEFAULT '',
  kitchen_section text DEFAULT 'general' CHECK (kitchen_section IN ('hot', 'cold', 'pastry', 'butchery', 'general')),
  task_type text DEFAULT 'other' CHECK (task_type IN ('costing', 'menu', 'audit', 'inventory', 'prep', 'other')),
  position integer DEFAULT 0,
  calendar_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT 'image',
  uploaded_at timestamptz DEFAULT now()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_date date NOT NULL,
  event_type text DEFAULT 'special' CHECK (event_type IN ('holiday', 'cultural', 'deadline', 'special')),
  description text DEFAULT ''
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_date ON tasks(calendar_date);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo app)
CREATE POLICY "Allow public read access on tasks"
  ON tasks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on tasks"
  ON tasks FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on tasks"
  ON tasks FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on tasks"
  ON tasks FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access on task_attachments"
  ON task_attachments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on task_attachments"
  ON task_attachments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public delete on task_attachments"
  ON task_attachments FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access on task_comments"
  ON task_comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on task_comments"
  ON task_comments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public delete on task_comments"
  ON task_comments FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access on calendar_events"
  ON calendar_events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on calendar_events"
  ON calendar_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on calendar_events"
  ON calendar_events FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on calendar_events"
  ON calendar_events FOR DELETE
  TO public
  USING (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample calendar events for important dates
INSERT INTO calendar_events (event_name, event_date, event_type, description) VALUES
  ('Christmas Day', '2025-12-25', 'holiday', 'Christmas celebration preparations'),
  ('New Year', '2026-01-01', 'holiday', 'New Year menu planning'),
  ('Ramadan Prep', '2025-02-28', 'cultural', 'Ramadan menu preparation'),
  ('Diwali', '2025-10-20', 'cultural', 'Diwali special menu'),
  ('Founding Day', '2025-02-22', 'special', 'Saudi Founding Day celebration')
ON CONFLICT DO NOTHING;