-- ============================================================================
-- KrishiMitra Idempotent Migration: Production-Ready Auth & RBAC Hardening
-- Location: server/migrations/20260921_auth_rbac_hardening.sql
-- Run this migration in Supabase SQL Editor.
-- ============================================================================

-- 1. Ensure required extensions
create extension if not exists pgcrypto;

-- 2. Validate / Update profiles table structure
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text not null default '',
  role text not null check (role in ('FARMER','OWNER','ADMIN')),
  state text default '',
  district text default '',
  village text default '',
  bio text default '',
  profile_image text,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure required columns exist if table already exists
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_active') then
    alter table public.profiles add column is_active boolean not null default true;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_verified') then
    alter table public.profiles add column is_verified boolean not null default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'village') then
    alter table public.profiles add column village text default '';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'bio') then
    alter table public.profiles add column bio text default '';
  end if;
end $$;

-- 3. Case-insensitive email unique index and performance indexes
create unique index if not exists profiles_email_lower_idx on public.profiles (lower(trim(email)));
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_is_active_idx on public.profiles(is_active);

-- 4. Guard against unauthorized client-side role or status escalation
-- Even if an authenticated user interacts directly with Supabase via PostgREST,
-- they cannot elevate their role or change is_active / is_verified.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  -- If executed by a normal authenticated user (not service_role)
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    if new.role is distinct from old.role then
      raise exception 'Changing user role is prohibited.';
    end if;
    if new.is_active is distinct from old.is_active then
      raise exception 'Modifying account active status is prohibited.';
    end if;
    if new.is_verified is distinct from old.is_verified then
      raise exception 'Modifying verification status is prohibited.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_prevent_profile_escalation on public.profiles;
create trigger tr_prevent_profile_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_profile_privilege_escalation();

-- 5. Updated_at maintenance trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- 6. Enable Row Level Security on all application tables
alter table public.profiles enable row level security;
alter table if exists public.equipment enable row level security;
alter table if exists public.bookings enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.reviews enable row level security;
alter table if exists public.disputes enable row level security;
alter table if exists public.favorites enable row level security;
alter table if exists public.conversations enable row level security;
alter table if exists public.conversation_participants enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.message_reports enable row level security;

-- 7. Defense-in-depth RLS Policies for Profiles
-- Policy 1: Anyone can view active public profile metadata (needed for listings, equipment details, chat avatars)
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (is_active = true);

-- Policy 2: Users can update their own non-privileged profile data
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 8. Defense-in-depth RLS for Equipment
drop policy if exists "Approved active equipment is publicly visible" on public.equipment;
create policy "Approved active equipment is publicly visible"
  on public.equipment
  for select
  using (approval_status = 'APPROVED' and is_active = true);

drop policy if exists "Owners can view all their own equipment" on public.equipment;
create policy "Owners can view all their own equipment"
  on public.equipment
  for select
  using (auth.uid() = owner_id);

-- Note: The Express backend acts as the authoritative gatekeeper using SUPABASE_SERVICE_ROLE_KEY
-- which bypasses RLS and applies verified RBAC and IDOR checks server-side.
