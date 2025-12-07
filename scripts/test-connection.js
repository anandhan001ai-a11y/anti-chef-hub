
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qlgwiqruqarstjurdmif.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZ3dpcXJ1cWFyc3RqdXJkbWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTQ2MDMsImV4cCI6MjA4MDU5MDYwM30.NaQEsJYxSqkbDBNlK8L96-Qo_qWLz7D04Ylhw7woyBk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('Testing connection to Supabase...');
    console.log('URL:', supabaseUrl);

    try {
        const { data, error } = await supabase.from('tasks').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            if (error.code === '42P01') { // PostgreSQL undefined_table
                console.error('   (The table "tasks" might not exist yet. Please run the migration SQL in Supabase Dashboard!)');
            }
        } else {
            console.log('✅ Connection Successful!');
            console.log('   Successfully connected to "tasks" table.');
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

testConnection();
