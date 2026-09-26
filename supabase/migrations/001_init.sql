-- MartusAI initial schema (run manually in the Supabase dashboard)

-- analyses table
create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  issue_type text,
  jurisdiction text,
  summary jsonb,
  red_flags jsonb,
  deadlines jsonb,
  draft_response text,
  citations jsonb,
  created_at timestamptz default now()
);
alter table analyses enable row level security;
create policy "users own their analyses"
  on analyses for all using (auth.uid() = user_id);

-- reminders table
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  analysis_id uuid references analyses(id) on delete cascade,
  label text,
  due_date timestamptz,
  sent boolean default false,
  created_at timestamptz default now()
);
alter table reminders enable row level security;
create policy "users own their reminders"
  on reminders for all using (auth.uid() = user_id);

-- outcomes table (fully anonymous, no user_id)
create table if not exists outcomes (
  id uuid primary key default gen_random_uuid(),
  issue_type text,
  jurisdiction text,
  outcome text,
  created_at timestamptz default now()
);
-- no RLS: read is public, insert is public (rate-limit at API)
