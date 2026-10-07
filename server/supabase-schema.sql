-- KrishiMitra simple Supabase schema. Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text not null,
  role text not null check (role in ('FARMER','OWNER','ADMIN')),
  state text default '', district text default '', village text default '', bio text default '',
  profile_image text, is_verified boolean not null default false, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles(role);

create table if not exists public.categories (
  id text primary key, name text not null unique, slug text not null unique, description text default '', icon_name text default 'Tractor', image_url text default '', item_count integer default 0, average_rate_per_day numeric(12,2) default 0
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null, category_id text references public.categories(id) on delete set null, category_name text default '', description text default '',
  brand text default '', model text default '', manufacturing_year integer, horsepower numeric, fuel_type text,
  condition text not null default 'GOOD' check(condition in ('EXCELLENT','GOOD','FAIR')),
  specifications jsonb not null default '{}'::jsonb, image_urls text[] not null default '{}',
  price_per_hour numeric(12,2) not null default 0, daily_rate numeric(12,2) not null check(daily_rate>=0), price_per_week numeric(12,2) not null default 0,
  security_deposit numeric(12,2) not null default 0, operator_available boolean not null default false, operator_cost_per_day numeric(12,2) not null default 0,
  location text not null, district text not null, state text not null, pincode text not null,
  availability_status text not null default 'AVAILABLE' check(availability_status in ('AVAILABLE','MAINTENANCE','INACTIVE')),
  approval_status text not null default 'PENDING' check(approval_status in ('PENDING','APPROVED','REJECTED')),
  rejection_reason text, rating numeric(3,2) not null default 0, review_count integer not null default 0, total_rentals integer not null default 0,
  is_featured boolean not null default false, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists equipment_owner_idx on public.equipment(owner_id);
create index if not exists equipment_search_idx on public.equipment(approval_status,is_active,availability_status);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(), booking_code text unique not null default ('KM-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  equipment_id uuid not null references public.equipment(id) on delete restrict, farmer_id uuid not null references public.profiles(id) on delete restrict,
  start_date date not null, end_date date not null, total_days integer not null check(total_days>0), daily_rate numeric(12,2) not null check(daily_rate>=0),
  total_amount numeric(12,2) not null check(total_amount>=0), status text not null default 'PENDING' check(status in ('PENDING','PAYMENT_PENDING','CONFIRMED','ACTIVE','COMPLETED','REJECTED','CANCELLED','EXPIRED','STOPPED')),
  farmer_note text, owner_note text, rejection_reason text, cancellation_reason text, stopped_by text check(stopped_by is null or stopped_by in ('FARMER','OWNER')), stop_reason text, stop_message text, stopped_at timestamptz, pickup_address text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(end_date >= start_date)
);
create index if not exists bookings_equipment_dates_idx on public.bookings(equipment_id,start_date,end_date,status);
create index if not exists bookings_farmer_idx on public.bookings(farmer_id,created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, type text not null default 'SYSTEM', title text not null, message text not null, related_booking_id uuid references public.bookings(id) on delete set null, link text, is_read boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id,is_read,created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, booking_code text, equipment_id uuid not null references public.equipment(id) on delete cascade, equipment_name text,
  reviewer_id uuid not null references public.profiles(id) on delete cascade, reviewer_name text, reviewer_role text, reviewee_id uuid references public.profiles(id) on delete cascade, reviewee_name text, rating integer not null check(rating between 1 and 5), comment text not null, created_at timestamptz not null default now(), unique(booking_id,reviewer_id)
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, booking_code text, raised_by uuid not null references public.profiles(id) on delete cascade, raised_by_name text, raised_by_role text, against_id uuid references public.profiles(id) on delete set null, against_name text, reason text not null, description text not null, status text not null default 'OPEN' check(status in ('OPEN','UNDER_REVIEW','RESOLVED','DISMISSED')), admin_response text, created_at timestamptz not null default now(), resolved_at timestamptz
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, equipment_id uuid not null references public.equipment(id) on delete cascade, created_at timestamptz not null default now(), unique(user_id,equipment_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(), type text not null default 'DIRECT', context_type text default 'NONE', context_id uuid, equipment_id uuid references public.equipment(id) on delete set null, equipment_name text, equipment_image text, booking_id uuid references public.bookings(id) on delete set null, booking_code text, topic text, last_message text, last_message_sender_id uuid references public.profiles(id) on delete set null, last_message_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, is_archived boolean not null default false, is_muted boolean not null default false, joined_at timestamptz not null default now(), unique(conversation_id,user_id)
);
create index if not exists conversation_participants_user_idx on public.conversation_participants(user_id,conversation_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, sender_id uuid not null references public.profiles(id) on delete cascade, message_type text not null default 'TEXT', content text not null, reply_to_message_id uuid references public.messages(id) on delete set null, attachment_url text, attachment_type text, attachment_name text, attachment_size bigint, is_read boolean not null default false, read_at timestamptz, edited_at timestamptz, deleted_at timestamptz, reactions jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages(conversation_id,created_at);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(), message_id uuid not null references public.messages(id) on delete cascade, conversation_id uuid not null references public.conversations(id) on delete cascade, reported_by uuid not null references public.profiles(id) on delete cascade, reason text not null, description text, status text not null default 'PENDING', created_at timestamptz not null default now()
);

-- Keep updated_at simple.
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists profiles_updated_at on public.profiles; create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists equipment_updated_at on public.equipment; create trigger equipment_updated_at before update on public.equipment for each row execute function public.set_updated_at();
drop trigger if exists bookings_updated_at on public.bookings; create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
drop trigger if exists conversations_updated_at on public.conversations; create trigger conversations_updated_at before update on public.conversations for each row execute function public.set_updated_at();

-- Storage bucket for equipment images. Uploads are performed by the backend using the service role.
insert into storage.buckets (id,name,public) values ('equipment-images','equipment-images',true) on conflict (id) do nothing;

-- Basic categories.
insert into public.categories(id,name,slug,description,icon_name) values
('cat-tractors','Tractors','tractors','Farm tractors','Tractor'),('cat-rotavators','Rotavators','rotavators','Rotavators and tillers','Tractor'),('cat-harvesters','Harvesters','harvesters','Harvesting machinery','Wheat'),('cat-seeders','Seeders','seeders','Seed drills and planters','Sprout'),('cat-sprayers','Sprayers','sprayers','Crop spraying equipment','Droplets'),('cat-trailers','Trailers','trailers','Farm trailers','Truck')
on conflict(id) do nothing;

-- Recommended RLS posture: the Express backend uses the service role and performs authorization itself.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to the browser.
alter table public.profiles enable row level security;
alter table public.equipment enable row level security;
alter table public.bookings enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_reports enable row level security;
alter table public.support_inquiries enable row level security;

-- Revised booking advance + Razorpay payment model.
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS booking_amount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_booking_amount_non_negative;
ALTER TABLE public.equipment ADD CONSTRAINT equipment_booking_amount_non_negative CHECK (booking_amount >= 0);

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('PENDING','PAYMENT_PENDING','CONFIRMED','ACTIVE','COMPLETED','REJECTED','CANCELLED','EXPIRED','STOPPED'));

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  total_rental_amount numeric(12,2) not null default 0,
  booking_amount numeric(12,2) not null default 0,
  platform_fee numeric(12,2) not null default 0,
  online_payment_amount numeric(12,2) not null default 0,
  remaining_rental_amount numeric(12,2) not null default 0,
  payment_status text not null default 'PENDING' check(payment_status in ('PENDING','ORDER_CREATED','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED','VERIFICATION_FAILED')),
  remaining_payment_status text not null default 'PENDING' check(remaining_payment_status in ('PENDING','PAID','NOT_REQUIRED')),
  remaining_payment_method text check(remaining_payment_method is null or remaining_payment_method in ('CASH','UPI','RAZORPAY')),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  razorpay_status text,
  gateway_error text,
  remaining_payment_note text,
  rental_completed_at timestamptz,
  owner_payment_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS payments_farmer_idx ON public.payments(farmer_id,created_at desc);
CREATE INDEX IF NOT EXISTS payments_owner_idx ON public.payments(owner_id,created_at desc);
CREATE INDEX IF NOT EXISTS payments_order_idx ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS payments_payment_idx ON public.payments(razorpay_payment_id);
DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS operator_included boolean NOT NULL DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS operator_amount numeric(12,2) NOT NULL DEFAULT 0;
