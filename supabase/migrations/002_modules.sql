-- 002_modules.sql — schema for the four feature modules
-- (PlainSite, ContractFlow, EvidenceChain, TenantShield).
-- Run manually in the Supabase dashboard SQL editor.

-- ── ContractFlow ─────────────────────────────────────────────
-- Standard clause library the extractor compares against.
create table if not exists contract_templates (
  id uuid primary key default gen_random_uuid(),
  clause_name text not null,
  standard_text text not null,
  risk_level text not null default 'low',  -- low | medium | high
  notes text,
  created_at timestamptz default now()
);
alter table contract_templates enable row level security;
create policy "templates are publicly readable"
  on contract_templates for select using (true);
-- Seeding/updating templates is done by an admin via the service role
-- (or the dashboard); no anon insert/update policy on purpose.

-- ── EvidenceChain ────────────────────────────────────────────
-- Immutable chain-of-custody log. Append-only: no update/delete policy.
create table if not exists evidence_log (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_hash text not null,
  timestamp timestamptz not null default now(),
  uploader_note text
);
alter table evidence_log enable row level security;
create policy "evidence log is publicly readable"
  on evidence_log for select using (true);
create policy "evidence log is publicly insertable"
  on evidence_log for insert with check (true);
-- Intentionally NO update or delete policies: custody records are
-- append-only. Verified entries get a NEW row, never an edit.
