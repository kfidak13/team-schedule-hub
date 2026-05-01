-- ────────────────────────────────────────────────────────────────────
-- Webb Athletics — Authentication Setup
-- Run this file in your Supabase SQL editor (Dashboard → SQL Editor)
-- ────────────────────────────────────────────────────────────────────

-- 1) Profiles table — links to auth.users, stores role + display info
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  display_name text,
  role        text not null default 'viewer'
              check (role in ('admin','stats_admin','coach','student','viewer')),
  sport       text,
  gender      text check (gender in ('boys','girls')),
  level       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_email_idx on public.profiles(email);

-- 2) RLS — anyone authenticated can read all profiles (so coach names show)
--    Users can update their own profile EXCEPT the role column
--    Only admins can change roles
alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by anyone" on public.profiles;
create policy "Profiles are readable by anyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Prevent self-promotion: role can only be changed if it stays the same
    and role = (select role from public.profiles where id = auth.uid())
  );

drop policy if exists "Admins update any profile" on public.profiles;
create policy "Admins update any profile"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admins delete profiles" on public.profiles;
create policy "Admins delete profiles"
  on public.profiles for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 3) Trigger — auto-create a profile on auth signup
--    Bootstrap super-admin: kfidak@webb.org gets admin role automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case
      when new.email = 'kfidak@webb.org' then 'admin'
      else 'viewer'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4) updated_at trigger
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- 5) Helpful view: list all profiles (for the admin dashboard)
--    No special grants needed — RLS handles it.
