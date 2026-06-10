-- Adabekee's Birthday Tree — one-time database setup
-- Run against the project's Supabase database (node pg script or SQL editor).

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  relationship text,
  message_text text,
  media_url text,
  media_type text check (media_type in ('audio', 'image', 'video')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.wishes enable row level security;

-- Anyone with the link can leave a wish, but only as 'pending'
drop policy if exists "wishes_public_insert" on public.wishes;
create policy "wishes_public_insert"
on public.wishes
for insert to anon, authenticated
with check (status = 'pending');

-- The public (her, on the big day) only ever sees approved wishes
drop policy if exists "wishes_public_read_approved" on public.wishes;
create policy "wishes_public_read_approved"
on public.wishes
for select to anon, authenticated
using (status = 'approved');

-- No public update/delete policies: moderation happens via the
-- service-role client in server actions only.

-- Storage bucket for voice notes / photos / videos (25MB cap)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wish-media', 'wish-media', true, 26214400,
  array[
    'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Contributors upload media straight from the browser (bypasses Vercel's
-- 4.5MB serverless body limit); they cannot overwrite or delete.
drop policy if exists "wish_media_public_insert" on storage.objects;
create policy "wish_media_public_insert"
on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'wish-media');

drop policy if exists "wish_media_public_read" on storage.objects;
create policy "wish_media_public_read"
on storage.objects
for select to anon, authenticated
using (bucket_id = 'wish-media');
