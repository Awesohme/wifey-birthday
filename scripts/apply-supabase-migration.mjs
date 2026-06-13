import pg from "pg";

const { Client } = pg;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !password) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD are required."
  );
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const directHost = process.env.SUPABASE_DB_HOST ?? `db.${projectRef}.supabase.co`;
const poolerRegions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ca-central-1",
  "sa-east-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-central-2",
  "eu-north-1",
  "af-south-1",
  "me-central-1",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-southeast-3",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-northeast-3",
];
const candidates = [
  { host: directHost, user: "postgres" },
  ...(process.env.SUPABASE_POOLER_HOST
    ? [
        {
          host: process.env.SUPABASE_POOLER_HOST,
          user: `postgres.${projectRef}`,
        },
      ]
    : ["aws-0", "aws-1"].flatMap((cluster) =>
        poolerRegions.map((region) => ({
          host: `${cluster}-${region}.pooler.supabase.com`,
          user: `postgres.${projectRef}`,
        }))
      )),
];

let client;
let lastError;
for (const candidate of candidates) {
  const nextClient = new Client({
    host: candidate.host,
    port: 5432,
    database: "postgres",
    user: candidate.user,
    password,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await nextClient.connect();
    client = nextClient;
    break;
  } catch (error) {
    lastError = error;
    await nextClient.end().catch(() => {});
  }
}

if (!client) throw lastError;

try {
  await client.query(`
    alter table public.wishes add column if not exists voice_url text;
    alter table public.wishes add column if not exists video_url text;
    alter table public.wishes add column if not exists image_url text;
    alter table public.wishes add column if not exists together_image_url text;
    alter table public.wishes add column if not exists featured_rank integer;

    create index if not exists wishes_featured_rank_idx
      on public.wishes (featured_rank)
      where featured_rank is not null;

    create table if not exists public.site_media (
      id uuid primary key default gen_random_uuid(),
      section text not null check (section in ('film', 'gallery')),
      url text not null,
      storage_path text not null unique,
      alt_text text not null default '',
      caption text,
      year integer check (year is null or year between 1900 and 2100),
      sort_order integer not null default 0,
      created_at timestamptz not null default now()
    );

    alter table public.site_media enable row level security;

    drop policy if exists "site_media_public_read" on public.site_media;
    create policy "site_media_public_read"
      on public.site_media
      for select to anon, authenticated
      using (true);

    insert into storage.buckets (
      id, name, public, file_size_limit, allowed_mime_types
    )
    values (
      'site-media', 'site-media', true, 15728640,
      array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
    )
    on conflict (id) do update set
      public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

    drop policy if exists "site_media_public_read" on storage.objects;
    create policy "site_media_public_read"
      on storage.objects
      for select to anon, authenticated
      using (bucket_id = 'site-media');
  `);
  console.log("Supabase content migration applied.");
} finally {
  await client.end();
}
