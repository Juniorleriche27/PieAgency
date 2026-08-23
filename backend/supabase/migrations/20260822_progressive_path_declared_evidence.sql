begin;

alter table if exists public.candidate_progressive_path_steps
  add column if not exists declared_evidence jsonb not null default '[]'::jsonb;

alter table if exists public.candidate_progressive_path_steps
  add column if not exists evidence_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'candidate_progressive_path_steps_declared_evidence_array'
  ) then
    alter table public.candidate_progressive_path_steps
      add constraint candidate_progressive_path_steps_declared_evidence_array
      check (jsonb_typeof(declared_evidence) = 'array');
  end if;
end $$;

commit;
