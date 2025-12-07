import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qlgwiqruqarstjurdmif.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZ3dpcXJ1cWFyc3RqdXJkbWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTQ2MDMsImV4cCI6MjA4MDU5MDYwM30.NaQEsJYxSqkbDBNlK8L96-Qo_qWLz7D04Ylhw7woyBk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
