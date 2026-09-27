-- KrishiMitra stability migration
-- Run this once after the existing schema/payment migrations.
-- It adds a database-level guard against overlapping active bookings.

CREATE OR REPLACE FUNCTION public.prevent_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('PENDING','PAYMENT_PENDING','CONFIRMED','ACTIVE') THEN
    -- Serialize booking writes for the same equipment so two concurrent
    -- requests cannot both pass the overlap check.
    PERFORM 1 FROM public.equipment WHERE id = NEW.equipment_id FOR UPDATE;

    IF EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.equipment_id = NEW.equipment_id
        AND b.id <> NEW.id
        AND b.status IN ('PENDING','PAYMENT_PENDING','CONFIRMED','ACTIVE')
        AND NEW.start_date <= b.end_date
        AND NEW.end_date >= b.start_date
    ) THEN
      RAISE EXCEPTION 'Equipment is already booked for the selected dates.'
        USING ERRCODE = '23P01';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_prevent_overlap ON public.bookings;
CREATE TRIGGER bookings_prevent_overlap
BEFORE INSERT OR UPDATE OF equipment_id, start_date, end_date, status
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_booking_overlap();

CREATE INDEX IF NOT EXISTS bookings_active_lookup_idx
ON public.bookings(equipment_id, status, start_date, end_date);
