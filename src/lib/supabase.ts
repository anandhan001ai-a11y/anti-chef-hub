import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Task = {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'completed';
  category: string;
  kitchen_section: 'hot' | 'cold' | 'pastry' | 'butchery' | 'general';
  task_type: 'costing' | 'menu' | 'audit' | 'inventory' | 'prep' | 'other';
  position: number;
  calendar_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskAttachment = {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  comment_text: string;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  event_name: string;
  event_date: string;
  event_type: 'holiday' | 'cultural' | 'deadline' | 'special';
  description: string;
};
