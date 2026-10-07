-- Incremental support inquiry system for Farmer/Owner -> Admin support.
-- Uses the existing Supabase profiles/authentication system and does not create a chat channel.

CREATE TABLE IF NOT EXISTS public.support_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id text UNIQUE NOT NULL DEFAULT ('INQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_role text NOT NULL CHECK (user_role IN ('FARMER', 'OWNER')),
  topic text NOT NULL CHECK (topic IN ('EQUIPMENT_AVAILABILITY', 'BOOKING_ISSUE', 'PAYMENT_ISSUE', 'RENTAL_ISSUE', 'ACCOUNT_ISSUE', 'OTHER')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'REPLIED', 'RESOLVED')),
  admin_reply text,
  replied_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_inquiries_user_idx
  ON public.support_inquiries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_inquiries_status_idx
  ON public.support_inquiries(status, created_at DESC);

ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_inquiries_user_select ON public.support_inquiries;
CREATE POLICY support_inquiries_user_select ON public.support_inquiries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS support_inquiries_user_insert ON public.support_inquiries;
CREATE POLICY support_inquiries_user_insert ON public.support_inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin dashboard operations are performed through the existing server-side
-- Supabase service-role client after explicit ADMIN authorization.

DROP TRIGGER IF EXISTS support_inquiries_updated_at ON public.support_inquiries;
CREATE TRIGGER support_inquiries_updated_at
  BEFORE UPDATE ON public.support_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
