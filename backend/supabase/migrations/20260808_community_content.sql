-- Chantier 2 PieHUB: contenu persistant, fichiers, interactions et stories.

alter table public.community_posts
  add column if not exists resource_storage_path text,
  add column if not exists resource_url text,
  add column if not exists resource_mime_type text,
  add column if not exists media_urls jsonb not null default '[]'::jsonb,
  add column if not exists is_question boolean not null default false;

create table if not exists public.community_comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id bigint not null references public.community_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (comment_id, user_id)
);

create table if not exists public.community_post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id bigint not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_stories (
  id uuid primary key default gen_random_uuid(),
  author_profile_id text not null references public.community_profiles(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 1000),
  media_storage_path text,
  media_url text,
  media_mime_type text,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '24 hours'),
  check (char_length(trim(content)) > 0 or media_url is not null)
);

create index if not exists community_comment_reactions_comment_idx
  on public.community_comment_reactions(comment_id);
create index if not exists community_post_shares_post_idx
  on public.community_post_shares(post_id, created_at desc);
create index if not exists community_stories_expiry_idx
  on public.community_stories(expires_at desc);

alter table public.community_comment_reactions enable row level security;
alter table public.community_post_shares enable row level security;
alter table public.community_stories enable row level security;

drop policy if exists "community_comment_reactions_read" on public.community_comment_reactions;
create policy "community_comment_reactions_read" on public.community_comment_reactions
for select to anon, authenticated using (true);
drop policy if exists "community_comment_reactions_owner" on public.community_comment_reactions;
create policy "community_comment_reactions_owner" on public.community_comment_reactions
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "community_post_shares_read" on public.community_post_shares;
create policy "community_post_shares_read" on public.community_post_shares
for select to anon, authenticated using (true);
drop policy if exists "community_post_shares_owner" on public.community_post_shares;
create policy "community_post_shares_owner" on public.community_post_shares
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "community_stories_public_read" on public.community_stories;
create policy "community_stories_public_read" on public.community_stories
for select to anon, authenticated using (expires_at > timezone('utc', now()));
drop policy if exists "community_stories_owner" on public.community_stories;
create policy "community_stories_owner" on public.community_stories
for all to authenticated
using (author_user_id = auth.uid() or public.is_admin())
with check (author_user_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-assets',
  'community-assets',
  true,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community_assets_public_read" on storage.objects;
create policy "community_assets_public_read" on storage.objects
for select to anon, authenticated using (bucket_id = 'community-assets');

drop policy if exists "community_assets_insert_own" on storage.objects;
create policy "community_assets_insert_own" on storage.objects
for insert to authenticated with check (
  bucket_id = 'community-assets'
  and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin())
);

drop policy if exists "community_assets_update_own" on storage.objects;
create policy "community_assets_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'community-assets' and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()))
with check (bucket_id = 'community-assets' and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()));

drop policy if exists "community_assets_delete_own" on storage.objects;
create policy "community_assets_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'community-assets' and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()));
