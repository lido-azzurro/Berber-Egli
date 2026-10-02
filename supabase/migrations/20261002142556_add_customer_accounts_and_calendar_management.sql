/*
# Add customer accounts, private client data, services, closures, and custom slots

## New tables
- `profiles`: authenticated customer profile data and private barber notes.
- `shop_days_off`: barber-managed closed dates; Wednesday is represented by the app as a recurring closure.
- `shop_extra_slots`: barber-managed extra appointment slots outside the normal schedule.

## Existing table changes
- `bookings.user_id`: nullable owner reference for registered customers; guests remain supported.
- `bookings.service`: expanded to the complete menu.
- `bookings.status`: existing appointment lifecycle remains pending/completed/cancelled.

## Security
- Customer profiles are visible and editable only by their owner; barber access is controlled through the admin profile role.
- Booking details are no longer publicly readable. Anonymous customers use a security-definer function that returns only occupied times for one date.
- Authenticated customers can read only their own booking history. Admins can read and manage all bookings.
- Admin-only tables and mutations use an explicit `profiles.role = 'admin'` check.

## Important notes
1. Existing guest bookings remain intact and continue to work.
2. Existing services not in the new menu are normalized to `Qethje`.
3. The public availability function intentionally returns slot times only, never names or phone numbers.
*/

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.bookings
SET service = 'Qethje'
WHERE service IS NULL OR service NOT IN (
  'Qethje', 'Rruajtje', 'Rruajtje Makinë', 'Lyerje Mjekre', 'Larje Koke',
  'Trajtim me Avull', 'Black Mask', 'Scrub Mask', 'Mask Dylli'
);

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_service_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_service_check CHECK (
  service IN (
    'Qethje', 'Rruajtje', 'Rruajtje Makinë', 'Lyerje Mjekre', 'Larje Koke',
    'Trajtim me Avull', 'Black Mask', 'Scrub Mask', 'Mask Dylli'
  )
);

CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  barber_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_days_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  off_date date NOT NULL UNIQUE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_extra_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL,
  slot_time text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(slot_date, slot_time)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_days_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_extra_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() AND role = 'customer');
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "days_off_select_public" ON public.shop_days_off;
CREATE POLICY "days_off_select_public" ON public.shop_days_off FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "days_off_insert_admin" ON public.shop_days_off;
CREATE POLICY "days_off_insert_admin" ON public.shop_days_off FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "days_off_update_admin" ON public.shop_days_off;
CREATE POLICY "days_off_update_admin" ON public.shop_days_off FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "days_off_delete_admin" ON public.shop_days_off;
CREATE POLICY "days_off_delete_admin" ON public.shop_days_off FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "extra_slots_select_public" ON public.shop_extra_slots;
CREATE POLICY "extra_slots_select_public" ON public.shop_extra_slots FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "extra_slots_insert_admin" ON public.shop_extra_slots;
CREATE POLICY "extra_slots_insert_admin" ON public.shop_extra_slots FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "extra_slots_update_admin" ON public.shop_extra_slots;
CREATE POLICY "extra_slots_update_admin" ON public.shop_extra_slots FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "extra_slots_delete_admin" ON public.shop_extra_slots;
CREATE POLICY "extra_slots_delete_admin" ON public.shop_extra_slots FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "bookings_select_private" ON public.bookings;
CREATE POLICY "bookings_select_private" ON public.bookings FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
DROP POLICY IF EXISTS "bookings_insert_public" ON public.bookings;
CREATE POLICY "bookings_insert_public" ON public.bookings FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS "bookings_update_admin_only" ON public.bookings;
CREATE POLICY "bookings_update_admin_only" ON public.bookings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "bookings_delete_admin_only" ON public.bookings;
CREATE POLICY "bookings_delete_admin_only" ON public.bookings FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE OR REPLACE FUNCTION public.get_booked_slots(p_date date)
RETURNS TABLE(slot_time text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.slot_time FROM public.bookings b
  WHERE b.booking_date = p_date AND b.status <> 'cancelled'
  UNION
  SELECT e.slot_time FROM public.shop_extra_slots e
  WHERE e.slot_date = p_date;
$$;
REVOKE ALL ON FUNCTION public.get_booked_slots(date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(date) TO anon, authenticated;

INSERT INTO public.profiles (id, full_name, phone, role)
SELECT id, 'Berber Egli', '', 'admin' FROM auth.users WHERE email = 'erjolibi@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

INSERT INTO public.profiles (id, full_name, phone, role)
SELECT id, 'Berber Egli', '', 'admin' FROM auth.users WHERE email = 'berberegli@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
