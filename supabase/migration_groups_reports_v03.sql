-- ITSINDA RYACU v0.3 migration: group start/close details for an existing starter database.
-- Review first, then run in Supabase SQL Editor. This does not add financial transaction ledgers.
alter table public.savings_groups add column if not exists start_date date not null default current_date;
alter table public.savings_groups add column if not exists monthly_contribution bigint not null default 0 check (monthly_contribution >= 0);
alter table public.savings_groups add column if not exists goal_amount bigint not null default 0 check (goal_amount >= 0);
alter table public.savings_groups add column if not exists member_count integer not null default 1 check (member_count >= 1);
alter table public.savings_groups add column if not exists status text not null default 'active' check (status in ('active','closed'));
alter table public.savings_groups add column if not exists ended_at date;
alter table public.savings_groups add column if not exists closing_note text not null default '';

alter table public.savings_groups enable row level security;
drop policy if exists "groups_update_creator" on public.savings_groups;
create policy "groups_update_creator" on public.savings_groups
for update to authenticated using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

-- Note: This migration does not create a ledger for contributions, expenses, loans,
-- repayments or verified payments. Do not use its group estimates as a financial statement.
