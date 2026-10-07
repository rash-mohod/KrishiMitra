-- KrishiMitra booking/rental lifecycle migration
-- Run after the existing schema and payment migrations.
-- Safe for existing projects: preserves existing rows and uses additive nullable columns.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stopped_by text,
  ADD COLUMN IF NOT EXISTS stop_reason text,
  ADD COLUMN IF NOT EXISTS stop_message text,
  ADD COLUMN IF NOT EXISTS stopped_at timestamptz;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check CHECK (
    status IN (
      'PENDING',
      'PAYMENT_PENDING',
      'CONFIRMED',
      'ACTIVE',
      'COMPLETED',
      'REJECTED',
      'CANCELLED',
      'EXPIRED',
      'STOPPED'
    )
  );

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_stopped_by_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_stopped_by_check CHECK (
    stopped_by IS NULL OR stopped_by IN ('FARMER', 'OWNER')
  );

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_remaining_payment_method_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_remaining_payment_method_check CHECK (
    remaining_payment_method IS NULL OR remaining_payment_method IN ('CASH', 'UPI', 'RAZORPAY')
  );

CREATE INDEX IF NOT EXISTS bookings_status_start_date_idx
  ON public.bookings(status, start_date);

CREATE INDEX IF NOT EXISTS bookings_status_end_date_idx
  ON public.bookings(status, end_date);

CREATE INDEX IF NOT EXISTS bookings_stopped_at_idx
  ON public.bookings(stopped_at);
