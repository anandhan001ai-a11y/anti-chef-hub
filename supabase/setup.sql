-- ChefAnand Hub Database Schema
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/qlgwiqruqarstjurdmif/sql/new

-- Tasks Table
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

-- Cleaning Tasks Table
CREATE TABLE IF NOT EXISTS cleaning_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  completed boolean DEFAULT false,
  section text DEFAULT 'shift' CHECK (section IN ('shift', 'endOfDay', 'weekly', 'monthly')),
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cleaning Supplies Table
CREATE TABLE IF NOT EXISTS cleaning_supplies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_supplies ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public access on tasks" ON tasks FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access on cleaning_tasks" ON cleaning_tasks FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access on cleaning_supplies" ON cleaning_supplies FOR ALL TO public USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO tasks (title, description, priority, status, category, kitchen_section, task_type, position) VALUES
  ('Review Menu Costs', 'Analyze food costs for the new seasonal menu.', 'high', 'todo', 'Management', 'general', 'costing', 1),
  ('Order Produce', 'Place orders for vegetables and fruits for the week.', 'medium', 'in-progress', 'Inventory', 'cold', 'inventory', 2);

INSERT INTO cleaning_tasks (text, section, position, completed) VALUES
  ('Wipe down and sanitize tables', 'shift', 1, false),
  ('Clean and sanitize bathrooms', 'shift', 2, false),
  ('Deep clean oven', 'weekly', 1, false),
  ('Defrost freezer', 'monthly', 1, false);

INSERT INTO cleaning_supplies (name, position) VALUES
  ('Bleach', 1),
  ('Sponges', 2),
  ('Glass Cleaner', 3),
  ('Mop and Bucket', 4);
