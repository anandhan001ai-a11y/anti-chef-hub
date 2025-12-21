-- Allow anonymous users to insert into roster_uploads
drop policy if exists "Users can insert their own roster uploads" on public.roster_uploads;
create policy "Anon can insert roster uploads"
  on public.roster_uploads for insert
  with check (true);

-- Allow anonymous users to view their uploads (optional, but good for returning data)
drop policy if exists "Users can view their own roster uploads" on public.roster_uploads;
create policy "Anon can view roster uploads"
  on public.roster_uploads for select
  using (true);

-- Allow anonymous uploads to storage
drop policy if exists "Authenticated users can upload rosters" on storage.objects;
create policy "Public can upload rosters"
  on storage.objects for insert
  with check ( bucket_id = 'rosters' );

-- Allow anonymous reads from storage
drop policy if exists "Authenticated users can read rosters" on storage.objects;
create policy "Public can read rosters"
  on storage.objects for select
  using ( bucket_id = 'rosters' );
