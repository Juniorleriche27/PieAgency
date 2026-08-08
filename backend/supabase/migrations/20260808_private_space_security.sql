create table if not exists public.payment_access_claims (
  cart_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  service_slug text not null,
  payment_id text,
  provider text not null,
  claimed_at timestamptz not null default timezone('utc', now())
);

create index if not exists payment_access_claims_user_idx
  on public.payment_access_claims (user_id, claimed_at desc);

alter table public.payment_access_claims enable row level security;

drop policy if exists "Users can read own payment claims" on public.payment_access_claims;
create policy "Users can read own payment claims"
  on public.payment_access_claims for select to authenticated
  using (auth.uid() = user_id);
