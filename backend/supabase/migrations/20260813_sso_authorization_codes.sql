create table if not exists public.sso_authorization_codes (
  code_hash text primary key,
  client_id text not null,
  redirect_uri text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  country text,
  role text not null check (role in ('student', 'admin')),
  is_active boolean not null default true,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sso_authorization_codes_expires_at_idx
  on public.sso_authorization_codes (expires_at);

alter table public.sso_authorization_codes enable row level security;

create or replace function public.consume_sso_authorization_code(
  p_code_hash text,
  p_client_id text,
  p_redirect_uri text
)
returns table (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  country text,
  role text,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.sso_authorization_codes
  set consumed_at = timezone('utc', now())
  where code_hash = p_code_hash
    and client_id = p_client_id
    and redirect_uri = p_redirect_uri
    and consumed_at is null
    and expires_at > timezone('utc', now())
  returning
    sso_authorization_codes.user_id,
    sso_authorization_codes.email,
    sso_authorization_codes.full_name,
    sso_authorization_codes.phone,
    sso_authorization_codes.country,
    sso_authorization_codes.role,
    sso_authorization_codes.is_active;
end;
$$;

revoke all on function public.consume_sso_authorization_code(text, text, text) from public;
grant execute on function public.consume_sso_authorization_code(text, text, text) to service_role;
