-- Create a table for storing uploaded rosters and their AI analysis
create table if not exists public.roster_uploads (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  file_url text,
  file_size bigint,
  ai_analysis jsonb, -- Stores the JSON data extracted by AI
  raw_text text, -- Stores the text representation sent to AI
  status text default 'pending', -- pending, processing, completed, error
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.roster_uploads enable row level security;

-- Policies for roster_uploads
create policy "Users can view their own roster uploads"
  on public.roster_uploads for select
  using (auth.uid() = uploaded_by);

create policy "Users can insert their own roster uploads"
  on public.roster_uploads for insert
  with check (auth.uid() = uploaded_by);
  
create policy "Users can update their own roster uploads"
  on public.roster_uploads for update
  using (auth.uid() = uploaded_by);

-- Create a storage bucket for roster files if it doesn't exist
insert into storage.buckets (id, name, public)
values ('rosters', 'rosters', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Authenticated users can upload rosters"
  on storage.objects for insert
  with check ( bucket_id = 'rosters' and auth.role() = 'authenticated' );

create policy "Authenticated users can read rosters"
  on storage.objects for select
  using ( bucket_id = 'rosters' and auth.role() = 'authenticated' );
