-- ITSINDA RYACU starter schema
-- Run only in a NEW Supabase project or after reviewing the SQL carefully.
-- This creates basic group and savings-goal records. It does not move or hold money.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  preferred_language text not null default 'rw'
    check (preferred_language in ('rw','en','fr','sw')),
  created_at timestamptz not null default now()
);

create table if not exists public.savings_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid not null references auth.users(id),
  start_date date not null default current_date,
  monthly_contribution bigint not null default 0 check (monthly_contribution >= 0),
  goal_amount bigint not null default 0 check (goal_amount >= 0),
  member_count integer not null default 1 check (member_count >= 1),
  status text not null default 'active' check (status in ('active','closed')),
  ended_at date,
  closing_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.savings_groups(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'member'
    check (member_role in ('member','treasurer','leader')),
  joined_at timestamptz not null default now(),
  primary key (group_id, member_id)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null check (goal_type in ('general_savings','mutuelle')),
  title text not null,
  target_amount bigint not null check (target_amount > 0),
  target_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.savings_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.savings_goals enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "groups_select_creator_or_member" on public.savings_groups
for select to authenticated using (
  created_by = (select auth.uid()) or exists (
    select 1 from public.group_members gm
    where gm.group_id = savings_groups.id and gm.member_id = (select auth.uid())
  )
);

create policy "groups_create_as_self" on public.savings_groups
for insert to authenticated with check (created_by = (select auth.uid()));

create policy "groups_update_creator" on public.savings_groups
for update to authenticated using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "members_select_same_group" on public.group_members
for select to authenticated using (
  member_id = (select auth.uid()) or exists (
    select 1 from public.group_members mine
    where mine.group_id = group_members.group_id
      and mine.member_id = (select auth.uid())
  )
);

create policy "member_join_self" on public.group_members
for insert to authenticated with check (member_id = (select auth.uid()));

create policy "savings_goals_select_own" on public.savings_goals
for select to authenticated using (owner_id = (select auth.uid()));

create policy "savings_goals_insert_own" on public.savings_goals
for insert to authenticated with check (owner_id = (select auth.uid()));

create policy "savings_goals_update_own" on public.savings_goals
for update to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

-- IMPORTANT:
-- Do not store national ID numbers in these starter tables.
-- Do not record savings or payments as completed based only on client-side input.
-- Financial ledger, loan approval, payment verification, and Mutuelle integration
-- require separate server-side rules, audit trails, and approved provider integrations.
