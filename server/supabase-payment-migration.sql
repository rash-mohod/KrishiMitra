-- KrishiMitra payment migration
-- Run after the existing schema in Supabase SQL Editor.
-- Safe for existing projects: uses IF NOT EXISTS and preserves existing rows.

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
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS operator_included boolean NOT NULL DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS operator_amount numeric(12,2) NOT NULL DEFAULT 0;