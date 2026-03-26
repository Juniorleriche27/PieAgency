create extension if not exists pgcrypto;

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  country text not null,
  study_level text not null,
  target_project text not null,
  message text not null,
  constraint contact_requests_contact_required
    check (email is not null or phone is not null),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists contact_requests_created_at_idx
  on public.contact_requests (created_at desc);

alter table if exists public.contact_requests
  add column if not exists first_name text;

alter table if exists public.contact_requests
  add column if not exists last_name text;

alter table if exists public.contact_requests
  add column if not exists phone_country_code text;

alter table if exists public.contact_requests
  add column if not exists immigration_attempt_count integer not null default 0;

alter table if exists public.contact_requests
  add column if not exists school_type text;

alter table if exists public.contact_requests
  add column if not exists funding_source text;

alter table if exists public.contact_requests
  add column if not exists assistance_preference text;

alter table if exists public.contact_requests
  add column if not exists consultation_date date;

alter table if exists public.contact_requests
  add column if not exists consultation_time time;

alter table if exists public.contact_requests
  add column if not exists referrer_name text;

alter table if exists public.contact_requests
  add column if not exists can_invest boolean;

alter table if exists public.contact_requests
  add column if not exists consent_resources boolean not null default false;

create table if not exists public.partnership_requests (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  organization_type text not null,
  contact_full_name text not null,
  contact_role text not null,
  email text not null,
  phone text not null,
  country text not null,
  website text,
  partnership_scope text not null,
  objectives text not null,
  additional_notes text,
  status text not null default 'new' check (status in ('new', 'review', 'contacted', 'closed')),
  consent_contact boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists partnership_requests_created_at_idx
  on public.partnership_requests (created_at desc);

create index if not exists partnership_requests_status_idx
  on public.partnership_requests (status, created_at desc);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text,
  country text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.student_cases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  public_reference text not null unique,
  target_project text not null,
  status text not null default 'new',
  assigned_counselor text,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  next_action text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.case_steps (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.student_cases (id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'todo',
  position integer not null default 0,
  due_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.student_cases (id) on delete cascade,
  name text not null,
  status text not null default 'missing',
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.student_cases (id) on delete set null,
  title text not null,
  owner text,
  status text not null default 'todo',
  due_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists student_cases_student_id_idx
  on public.student_cases (student_id);

create index if not exists student_cases_status_idx
  on public.student_cases (status);

create index if not exists case_steps_case_id_idx
  on public.case_steps (case_id, position);

create index if not exists case_documents_case_id_idx
  on public.case_documents (case_id);

create index if not exists admin_tasks_case_id_idx
  on public.admin_tasks (case_id);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  country text,
  role text not null default 'student' check (role in ('student', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.student_cases
  add column if not exists student_user_id uuid references auth.users (id) on delete set null;

alter table if exists public.student_cases
  add column if not exists created_by uuid references auth.users (id) on delete set null;

alter table if exists public.case_documents
  add column if not exists storage_path text;

alter table if exists public.case_documents
  add column if not exists uploaded_by uuid references auth.users (id) on delete set null;

alter table if exists public.case_documents
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.student_cases (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  visibility text not null default 'internal' check (visibility in ('internal', 'student')),
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.case_activity_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.student_cases (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  kind text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.case_appointments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.student_cases (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  scheduled_for timestamptz not null,
  channel text not null default 'whatsapp',
  status text not null default 'planned' check (status in ('planned', 'done', 'cancelled')),
  summary text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  case_id uuid references public.student_cases (id) on delete set null,
  page_path text,
  title text,
  source text not null default 'site_chatbot',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'assistant', 'admin')),
  sender_user_id uuid references auth.users (id) on delete set null,
  body text not null,
  model_source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  route_path text not null unique,
  title text not null,
  hero_title text,
  hero_description text,
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  audience text not null default 'public' check (audience in ('public', 'student', 'admin')),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages (id) on delete cascade,
  section_key text not null,
  heading text,
  body text,
  payload jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_profiles (
  id text primary key,
  user_id uuid unique references auth.users (id) on delete set null,
  display_name text not null,
  handle text not null unique,
  country text,
  city text,
  bio text,
  avatar text not null,
  accent_color text not null default '#0D1B38',
  follower_count integer not null default 0 check (follower_count >= 0),
  following_count integer not null default 0 check (following_count >= 0),
  post_count integer not null default 0 check (post_count >= 0),
  tags text[] not null default '{}'::text[],
  is_official boolean not null default false,
  is_ai boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_posts (
  id bigserial primary key,
  seed_key text unique,
  author_profile_id text not null references public.community_profiles (id) on delete restrict,
  author_user_id uuid references auth.users (id) on delete set null,
  post_type text not null default 'text' check (post_type in ('text', 'resource', 'poll')),
  tag text not null default 'temoignage',
  content text not null default '',
  resource_name text,
  resource_type text check (resource_type in ('pdf', 'doc')),
  resource_size text,
  poll_question text,
  poll_options jsonb not null default '[]'::jsonb,
  likes_count integer not null default 0 check (likes_count >= 0),
  shares_count integer not null default 0 check (shares_count >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_comments (
  id bigserial primary key,
  seed_key text unique,
  post_id bigint not null references public.community_posts (id) on delete cascade,
  author_profile_id text not null references public.community_profiles (id) on delete restrict,
  author_user_id uuid references auth.users (id) on delete set null,
  body text not null,
  likes_count integer not null default 0 check (likes_count >= 0),
  is_official boolean not null default false,
  is_ai_generated boolean not null default false,
  ai_source text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id bigint not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction_kind text not null check (reaction_kind in ('like', 'save')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_id, user_id, reaction_kind)
);

create table if not exists public.community_poll_votes (
  id uuid primary key default gen_random_uuid(),
  post_id bigint not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  option_index integer not null check (option_index >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_id, user_id)
);

create table if not exists public.community_follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users (id) on delete cascade,
  target_profile_id text not null references public.community_profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (follower_user_id, target_profile_id)
);

create table if not exists public.community_ai_events (
  id uuid primary key default gen_random_uuid(),
  post_id bigint references public.community_posts (id) on delete set null,
  comment_id bigint references public.community_comments (id) on delete set null,
  conversation_id uuid references public.chat_conversations (id) on delete set null,
  trigger_message text not null,
  decision text not null check (decision in ('replied', 'skipped')),
  reason text not null,
  source text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_role_idx
  on public.profiles (role);

create index if not exists student_cases_student_user_id_idx
  on public.student_cases (student_user_id);

create index if not exists case_notes_case_id_idx
  on public.case_notes (case_id);

create index if not exists case_activity_logs_case_id_idx
  on public.case_activity_logs (case_id);

create index if not exists case_appointments_case_id_idx
  on public.case_appointments (case_id);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);

create index if not exists chat_conversations_user_id_idx
  on public.chat_conversations (user_id, created_at desc);

create index if not exists chat_messages_conversation_id_idx
  on public.chat_messages (conversation_id, created_at);

create index if not exists site_pages_route_path_idx
  on public.site_pages (route_path);

create index if not exists page_sections_page_id_idx
  on public.page_sections (page_id, position);

create index if not exists community_profiles_user_id_idx
  on public.community_profiles (user_id);

create index if not exists community_posts_author_profile_id_idx
  on public.community_posts (author_profile_id, created_at desc);

create index if not exists community_posts_created_at_idx
  on public.community_posts (created_at desc);

create index if not exists community_comments_post_id_idx
  on public.community_comments (post_id, created_at);

create index if not exists community_post_reactions_post_id_idx
  on public.community_post_reactions (post_id, reaction_kind);

create index if not exists community_poll_votes_post_id_idx
  on public.community_poll_votes (post_id);

create index if not exists community_follows_follower_user_id_idx
  on public.community_follows (follower_user_id);

create index if not exists community_ai_events_created_at_idx
  on public.community_ai_events (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_admin(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = coalesce(target_user, auth.uid())
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_student_cases_updated_at on public.student_cases;
create trigger set_student_cases_updated_at
before update on public.student_cases
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_case_documents_updated_at on public.case_documents;
create trigger set_case_documents_updated_at
before update on public.case_documents
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_chat_conversations_updated_at on public.chat_conversations;
create trigger set_chat_conversations_updated_at
before update on public.chat_conversations
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_site_pages_updated_at on public.site_pages;
create trigger set_site_pages_updated_at
before update on public.site_pages
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_community_profiles_updated_at on public.community_profiles;
create trigger set_community_profiles_updated_at
before update on public.community_profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_community_posts_updated_at on public.community_posts;
create trigger set_community_posts_updated_at
before update on public.community_posts
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_community_comments_updated_at on public.community_comments;
create trigger set_community_comments_updated_at
before update on public.community_comments
for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.student_cases enable row level security;
alter table public.case_steps enable row level security;
alter table public.case_documents enable row level security;
alter table public.case_notes enable row level security;
alter table public.case_activity_logs enable row level security;
alter table public.case_appointments enable row level security;
alter table public.admin_tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.site_pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.community_profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_post_reactions enable row level security;
alter table public.community_poll_votes enable row level security;
alter table public.community_follows enable row level security;
alter table public.community_ai_events enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "student_cases_select_own_or_admin" on public.student_cases;
create policy "student_cases_select_own_or_admin"
on public.student_cases
for select
to authenticated
using (student_user_id = auth.uid() or public.is_admin());

drop policy if exists "student_cases_admin_write" on public.student_cases;
create policy "student_cases_admin_write"
on public.student_cases
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "case_steps_select_related" on public.case_steps;
create policy "case_steps_select_related"
on public.case_steps
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.student_cases
    where student_cases.id = case_steps.case_id
      and student_cases.student_user_id = auth.uid()
  )
);

drop policy if exists "case_steps_admin_write" on public.case_steps;
create policy "case_steps_admin_write"
on public.case_steps
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "case_documents_select_related" on public.case_documents;
create policy "case_documents_select_related"
on public.case_documents
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.student_cases
    where student_cases.id = case_documents.case_id
      and student_cases.student_user_id = auth.uid()
  )
);

drop policy if exists "case_documents_admin_write" on public.case_documents;
create policy "case_documents_admin_write"
on public.case_documents
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "case_notes_select_related" on public.case_notes;
create policy "case_notes_select_related"
on public.case_notes
for select
to authenticated
using (
  public.is_admin()
  or (
    visibility = 'student'
    and exists (
      select 1
      from public.student_cases
      where student_cases.id = case_notes.case_id
        and student_cases.student_user_id = auth.uid()
    )
  )
);

drop policy if exists "case_notes_admin_write" on public.case_notes;
create policy "case_notes_admin_write"
on public.case_notes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "case_activity_logs_select_related" on public.case_activity_logs;
create policy "case_activity_logs_select_related"
on public.case_activity_logs
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.student_cases
    where student_cases.id = case_activity_logs.case_id
      and student_cases.student_user_id = auth.uid()
  )
);

drop policy if exists "case_activity_logs_admin_write" on public.case_activity_logs;
create policy "case_activity_logs_admin_write"
on public.case_activity_logs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "case_appointments_select_related" on public.case_appointments;
create policy "case_appointments_select_related"
on public.case_appointments
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.student_cases
    where student_cases.id = case_appointments.case_id
      and student_cases.student_user_id = auth.uid()
  )
);

drop policy if exists "case_appointments_admin_write" on public.case_appointments;
create policy "case_appointments_admin_write"
on public.case_appointments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_tasks_admin_only" on public.admin_tasks;
create policy "admin_tasks_admin_only"
on public.admin_tasks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "notifications_select_own_or_admin" on public.notifications;
create policy "notifications_select_own_or_admin"
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update_own_or_admin" on public.notifications;
create policy "notifications_update_own_or_admin"
on public.notifications
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert"
on public.notifications
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "chat_conversations_select_own_or_admin" on public.chat_conversations;
create policy "chat_conversations_select_own_or_admin"
on public.chat_conversations
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "chat_conversations_insert_own_or_admin" on public.chat_conversations;
create policy "chat_conversations_insert_own_or_admin"
on public.chat_conversations
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "chat_conversations_update_own_or_admin" on public.chat_conversations;
create policy "chat_conversations_update_own_or_admin"
on public.chat_conversations
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "chat_conversations_anon_select" on public.chat_conversations;
create policy "chat_conversations_anon_select"
on public.chat_conversations
for select
to anon
using (user_id is null and source = 'site_chatbot');

drop policy if exists "chat_conversations_anon_insert" on public.chat_conversations;
create policy "chat_conversations_anon_insert"
on public.chat_conversations
for insert
to anon
with check (user_id is null and source = 'site_chatbot');

drop policy if exists "chat_conversations_anon_update" on public.chat_conversations;
create policy "chat_conversations_anon_update"
on public.chat_conversations
for update
to anon
using (user_id is null and source = 'site_chatbot')
with check (user_id is null and source = 'site_chatbot');

drop policy if exists "chat_messages_select_related" on public.chat_messages;
create policy "chat_messages_select_related"
on public.chat_messages
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.chat_conversations
    where chat_conversations.id = chat_messages.conversation_id
      and chat_conversations.user_id = auth.uid()
  )
);

drop policy if exists "chat_messages_insert_related" on public.chat_messages;
create policy "chat_messages_insert_related"
on public.chat_messages
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.chat_conversations
    where chat_conversations.id = chat_messages.conversation_id
      and chat_conversations.user_id = auth.uid()
  )
);

drop policy if exists "chat_messages_anon_insert_related" on public.chat_messages;
create policy "chat_messages_anon_insert_related"
on public.chat_messages
for insert
to anon
with check (sender_user_id is null);

drop policy if exists "site_pages_public_read" on public.site_pages;
create policy "site_pages_public_read"
on public.site_pages
for select
to anon, authenticated
using (is_published = true or public.is_admin());

drop policy if exists "site_pages_admin_write" on public.site_pages;
create policy "site_pages_admin_write"
on public.site_pages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "page_sections_public_read" on public.page_sections;
create policy "page_sections_public_read"
on public.page_sections
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.site_pages
    where site_pages.id = page_sections.page_id
      and (site_pages.is_published = true or public.is_admin())
  )
);

drop policy if exists "page_sections_admin_write" on public.page_sections;
create policy "page_sections_admin_write"
on public.page_sections
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "community_profiles_public_read" on public.community_profiles;
create policy "community_profiles_public_read"
on public.community_profiles
for select
to anon, authenticated
using (true);

drop policy if exists "community_profiles_self_or_admin_write" on public.community_profiles;
create policy "community_profiles_self_or_admin_write"
on public.community_profiles
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "community_posts_public_read" on public.community_posts;
create policy "community_posts_public_read"
on public.community_posts
for select
to anon, authenticated
using (is_archived = false or public.is_admin());

drop policy if exists "community_posts_self_or_admin_write" on public.community_posts;
create policy "community_posts_self_or_admin_write"
on public.community_posts
for all
to authenticated
using (author_user_id = auth.uid() or public.is_admin())
with check (author_user_id = auth.uid() or public.is_admin());

drop policy if exists "community_comments_public_read" on public.community_comments;
create policy "community_comments_public_read"
on public.community_comments
for select
to anon, authenticated
using (true);

drop policy if exists "community_comments_self_or_admin_write" on public.community_comments;
create policy "community_comments_self_or_admin_write"
on public.community_comments
for all
to authenticated
using (author_user_id = auth.uid() or public.is_admin())
with check (author_user_id = auth.uid() or public.is_admin());

drop policy if exists "community_post_reactions_owner" on public.community_post_reactions;
create policy "community_post_reactions_owner"
on public.community_post_reactions
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "community_poll_votes_owner" on public.community_poll_votes;
create policy "community_poll_votes_owner"
on public.community_poll_votes
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "community_follows_owner" on public.community_follows;
create policy "community_follows_owner"
on public.community_follows
for all
to authenticated
using (follower_user_id = auth.uid() or public.is_admin())
with check (follower_user_id = auth.uid() or public.is_admin());

drop policy if exists "community_ai_events_admin_only" on public.community_ai_events;
create policy "community_ai_events_admin_only"
on public.community_ai_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.site_pages (
  slug,
  route_path,
  title,
  hero_title,
  hero_description,
  seo_title,
  seo_description,
  is_published,
  audience
)
values
  (
    'home',
    '/',
    'Accueil',
    'Etudiez en France ou en Belgique avec PieAgency',
    'Page d''accueil PieAgency et presentation des accompagnements.',
    'PieAgency - Accueil',
    'Cabinet d''accompagnement etudiant pour la France et la Belgique.',
    true,
    'public'
  ),
  (
    'campus-france',
    '/campus-france',
    'Campus France',
    'Accompagnement Campus France',
    'Analyse du dossier, choix des formations, lettres et preparation a l''entretien.',
    'PieAgency - Campus France',
    'Accompagnement PieAgency pour la procedure Campus France.',
    true,
    'public'
  ),
  (
    'visa',
    '/visa',
    'Visa',
    'Procedure Visa',
    'Preparation structuree des pieces et points de vigilance pour la procedure visa.',
    'PieAgency - Visa',
    'Preparation du dossier visa avec PieAgency.',
    true,
    'public'
  ),
  (
    'belgique',
    '/belgique',
    'Belgique',
    'Campus Belgique',
    'Accompagnement pour les etudes en Belgique.',
    'PieAgency - Belgique',
    'Preparation du projet d''etudes vers la Belgique.',
    true,
    'public'
  ),
  (
    'paris-saclay',
    '/paris-saclay',
    'Paris-Saclay',
    'Accompagnement Paris-Saclay',
    'Aide ciblee pour les candidatures vers Paris-Saclay.',
    'PieAgency - Paris-Saclay',
    'Accompagnement PieAgency pour les candidatures Paris-Saclay.',
    true,
    'public'
  ),
  (
    'parcoursup',
    '/parcoursup',
    'Parcoursup',
    'Accompagnement Parcoursup',
    'Aide au choix des formations et a la preparation du dossier Parcoursup.',
    'PieAgency - Parcoursup',
    'Orientation et accompagnement Parcoursup avec PieAgency.',
    true,
    'public'
  ),
  (
    'ecoles',
    '/ecoles',
    'Ecoles privees',
    'Accompagnement Ecoles privees France',
    'Preparation des candidatures pour les ecoles privees en France.',
    'PieAgency - Ecoles privees',
    'PieAgency accompagne les candidatures vers les ecoles privees en France.',
    true,
    'public'
  ),
  (
    'communaute',
    '/communaute',
    'PieHUB',
    'PieHUB, la communaute PieAgency',
    'Espace communautaire pour suivre les echanges, les conseils, le chat officiel et les opportunites.',
    'PieAgency - PieHUB',
    'Rejoindre PieHUB, la communaute PieAgency.',
    true,
    'public'
  ),
  (
    'faq',
    '/faq',
    'FAQ',
    'Questions frequentes',
    'Reponses aux questions frequentes sur les services PieAgency.',
    'PieAgency - FAQ',
    'FAQ PieAgency.',
    true,
    'public'
  ),
  (
    'about',
    '/about',
    'A propos',
    'A propos de PieAgency',
    'Vision, approche et presence PieAgency.',
    'PieAgency - A propos',
    'Vision et approche de PieAgency.',
    true,
    'public'
  ),
  (
    'contact',
    '/contact',
    'Contact',
    'Contacter PieAgency',
    'Formulaire de contact et points d''entree WhatsApp PieAgency.',
    'PieAgency - Contact',
    'Contacter PieAgency pour demarrer son accompagnement.',
    true,
    'public'
  ),
  (
    'partenariat',
    '/partenariat',
    'Partenariat',
    'Construisons un partenariat utile avec PieAgency',
    'Universites, ecoles, associations, entreprises et institutions peuvent proposer un partenariat structure avec PieAgency.',
    'PieAgency - Partenariat',
    'Formulaire de partenariat pour les universites et partenaires de PieAgency.',
    true,
    'public'
  ),
  (
    'connexion',
    '/connexion',
    'Connexion',
    'Connexion a la plateforme PieAgency',
    'Acces aux espaces etudiant et admin.',
    'PieAgency - Connexion',
    'Connexion a la plateforme PieAgency.',
    true,
    'public'
  ),
  (
    'espace-etudiant',
    '/espace-etudiant',
    'Espace etudiant',
    'Mon espace etudiant',
    'Tableau de bord personnel pour suivre son dossier.',
    'PieAgency - Espace etudiant',
    'Espace personnel PieAgency pour les etudiants.',
    false,
    'student'
  ),
  (
    'admin',
    '/admin',
    'Admin',
    'Tableau de bord admin',
    'Interface interne de pilotage PieAgency.',
    'PieAgency - Admin',
    'Interface admin PieAgency.',
    false,
    'admin'
  )
on conflict (route_path) do update
set
  slug = excluded.slug,
  title = excluded.title,
  hero_title = excluded.hero_title,
  hero_description = excluded.hero_description,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  is_published = excluded.is_published,
  audience = excluded.audience,
  updated_at = timezone('utc', now());

-- COMMUNITY GROUPS (user-created)
create table if not exists public.community_groups (
  id bigserial primary key,
  name text not null,
  description text not null default '',
  icon text not null default '👥',
  category text not null default 'general',
  created_by_profile_id text references public.community_profiles(id) on delete set null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  member_count integer not null default 1 check (member_count >= 0),
  is_official boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id bigint not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text references public.community_profiles(id) on delete set null,
  role text not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  unique (group_id, user_id)
);

-- COMMUNITY EVENTS CALENDAR (user-created)
create table if not exists public.community_events_calendar (
  id bigserial primary key,
  name text not null,
  description text not null default '',
  event_date date not null,
  event_time text not null default '',
  location_type text not null default 'online',
  location_detail text not null default '',
  created_by_profile_id text references public.community_profiles(id) on delete set null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  attendee_count integer not null default 0 check (attendee_count >= 0),
  is_official boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id bigint not null references public.community_events_calendar(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text references public.community_profiles(id) on delete set null,
  registered_at timestamptz not null default timezone('utc', now()),
  unique (event_id, user_id)
);

-- NOTIFICATIONS
create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index if not exists community_groups_created_at_idx on public.community_groups (created_at desc);
create index if not exists community_group_members_user_id_idx on public.community_group_members (user_id);
create index if not exists community_events_calendar_date_idx on public.community_events_calendar (event_date asc);
create index if not exists community_event_attendees_user_id_idx on public.community_event_attendees (user_id);
create index if not exists community_notifications_user_id_idx on public.community_notifications (user_id, is_read, created_at desc);

-- RLS
alter table public.community_groups enable row level security;
alter table public.community_group_members enable row level security;
alter table public.community_events_calendar enable row level security;
alter table public.community_event_attendees enable row level security;
alter table public.community_notifications enable row level security;

drop policy if exists "community_groups_select" on public.community_groups;
create policy "community_groups_select" on public.community_groups for select to anon, authenticated using (true);

drop policy if exists "community_groups_insert" on public.community_groups;
create policy "community_groups_insert" on public.community_groups for insert to authenticated with check (auth.uid() = created_by_user_id);

drop policy if exists "community_groups_update" on public.community_groups;
create policy "community_groups_update" on public.community_groups for update to authenticated using (auth.uid() = created_by_user_id or public.is_admin());

drop policy if exists "community_group_members_select" on public.community_group_members;
create policy "community_group_members_select" on public.community_group_members for select to anon, authenticated using (true);

drop policy if exists "community_group_members_own" on public.community_group_members;
create policy "community_group_members_own" on public.community_group_members for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "community_events_calendar_select" on public.community_events_calendar;
create policy "community_events_calendar_select" on public.community_events_calendar for select to anon, authenticated using (true);

drop policy if exists "community_events_calendar_insert" on public.community_events_calendar;
create policy "community_events_calendar_insert" on public.community_events_calendar for insert to authenticated with check (auth.uid() = created_by_user_id);

drop policy if exists "community_events_calendar_update" on public.community_events_calendar;
create policy "community_events_calendar_update" on public.community_events_calendar for update to authenticated using (auth.uid() = created_by_user_id or public.is_admin());

drop policy if exists "community_event_attendees_select" on public.community_event_attendees;
create policy "community_event_attendees_select" on public.community_event_attendees for select to anon, authenticated using (true);

drop policy if exists "community_event_attendees_own" on public.community_event_attendees;
create policy "community_event_attendees_own" on public.community_event_attendees for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "community_notifications_own" on public.community_notifications;
create policy "community_notifications_own" on public.community_notifications for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Resource moderation status ──────────────────────────────────────────────
alter table if exists public.community_posts
  add column if not exists moderation_status text not null default 'approved';

-- Les ressources soumises par des non-admins sont "pending"
-- Les posts normaux restent "approved" par défaut

create index if not exists community_posts_moderation_idx
  on public.community_posts (moderation_status, post_type, created_at desc);

-- ── Community Ads ─────────────────────────────────────────────────────────────
create table if not exists public.community_ads (
  id bigserial primary key,
  created_by_profile_id text references public.community_profiles(id) on delete set null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  body text not null default '',
  image_url text,
  cta_label text not null default 'En savoir plus',
  cta_url text not null default '',
  category text not null default 'general',
  moderation_status text not null default 'pending',
  admin_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_ads_status_idx
  on public.community_ads (moderation_status, created_at desc);
create index if not exists community_ads_user_idx
  on public.community_ads (created_by_user_id);

alter table public.community_ads enable row level security;

drop policy if exists "community_ads_select" on public.community_ads;
create policy "community_ads_select"
on public.community_ads for select
to anon, authenticated
using (
  moderation_status = 'approved'
  or auth.uid() = created_by_user_id
  or public.is_admin()
);

drop policy if exists "community_ads_insert" on public.community_ads;
create policy "community_ads_insert"
on public.community_ads for insert
to authenticated
with check (auth.uid() = created_by_user_id);

drop policy if exists "community_ads_update" on public.community_ads;
create policy "community_ads_update"
on public.community_ads for update
to authenticated
using (auth.uid() = created_by_user_id or public.is_admin())
with check (auth.uid() = created_by_user_id or public.is_admin());
