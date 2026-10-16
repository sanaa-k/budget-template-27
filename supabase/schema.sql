-- Run once in Supabase: SQL Editor > New query > paste > Run.

-- Who is allowed in. Filled by the Gumroad webhook, or by hand for testers.
create table if not exists public.purchasers (
  email text primary key check (email = lower(email)),
  active boolean not null default true,
  source text not null default 'manual',
  sale_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.purchasers enable row level security;  -- no policies: only the server (service role) can read or write

-- True when the signed-in user's email is on the active list.
create or replace function public.is_purchaser() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.purchasers p where p.email = lower(auth.jwt() ->> 'email') and p.active)
$$;
revoke all on function public.is_purchaser() from public, anon;
grant execute on function public.is_purchaser() to authenticated;

-- One budget per user.
create table if not exists public.budgets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.budgets enable row level security;

drop policy if exists "own budget, read" on public.budgets;
drop policy if exists "own budget, insert" on public.budgets;
drop policy if exists "own budget, update" on public.budgets;
create policy "own budget, read" on public.budgets for select to authenticated
  using (user_id = auth.uid() and public.is_purchaser());
create policy "own budget, insert" on public.budgets for insert to authenticated
  with check (user_id = auth.uid() and public.is_purchaser());
create policy "own budget, update" on public.budgets for update to authenticated
  using (user_id = auth.uid() and public.is_purchaser())
  with check (user_id = auth.uid() and public.is_purchaser());

-- Add testers (lowercase emails):
-- insert into public.purchasers (email) values ('brother@example.com') on conflict (email) do update set active = true;
