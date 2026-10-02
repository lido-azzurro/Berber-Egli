/*
# Fix recursive profile security policies

## Problem
The admin checks inside profile and related-table policies queried `profiles` while PostgreSQL was already evaluating a policy on `profiles`. That caused new account creation to fail with an infinite-recursion error.

## Fix
- Add `public.is_admin()` as a SECURITY DEFINER helper with a fixed search path.
- Replace policy subqueries against `profiles` with this helper.
- Keep ownership checks and admin-only access unchanged.

## Security
- The helper derives the caller from `auth.uid()` and never accepts a user ID parameter.
- Execute access is limited to authenticated users.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bookings_select_private" ON public.bookings;
CREATE POLICY "bookings_select_private" ON public.bookings FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "bookings_update_admin_only" ON public.bookings;
CREATE POLICY "bookings_update_admin_only" ON public.bookings FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "bookings_delete_admin_only" ON public.bookings;
CREATE POLICY "bookings_delete_admin_only" ON public.bookings FOR DELETE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "days_off_insert_admin" ON public.shop_days_off;
CREATE POLICY "days_off_insert_admin" ON public.shop_days_off FOR INSERT TO authenticated
WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "days_off_update_admin" ON public.shop_days_off;
CREATE POLICY "days_off_update_admin" ON public.shop_days_off FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "days_off_delete_admin" ON public.shop_days_off;
CREATE POLICY "days_off_delete_admin" ON public.shop_days_off FOR DELETE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "extra_slots_insert_admin" ON public.shop_extra_slots;
CREATE POLICY "extra_slots_insert_admin" ON public.shop_extra_slots FOR INSERT TO authenticated
WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "extra_slots_update_admin" ON public.shop_extra_slots;
CREATE POLICY "extra_slots_update_admin" ON public.shop_extra_slots FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "extra_slots_delete_admin" ON public.shop_extra_slots;
CREATE POLICY "extra_slots_delete_admin" ON public.shop_extra_slots FOR DELETE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admin_email_requests_select" ON public.admin_email_change_requests;
CREATE POLICY "admin_email_requests_select" ON public.admin_email_change_requests FOR SELECT TO authenticated
USING (admin_id = auth.uid() AND public.is_admin());
DROP POLICY IF EXISTS "admin_email_requests_insert" ON public.admin_email_change_requests;
CREATE POLICY "admin_email_requests_insert" ON public.admin_email_change_requests FOR INSERT TO authenticated
WITH CHECK (admin_id = auth.uid() AND public.is_admin());
DROP POLICY IF EXISTS "admin_email_requests_update" ON public.admin_email_change_requests;
CREATE POLICY "admin_email_requests_update" ON public.admin_email_change_requests FOR UPDATE TO authenticated
USING (admin_id = auth.uid() AND public.is_admin()) WITH CHECK (admin_id = auth.uid() AND public.is_admin());
DROP POLICY IF EXISTS "admin_email_requests_delete" ON public.admin_email_change_requests;
CREATE POLICY "admin_email_requests_delete" ON public.admin_email_change_requests FOR DELETE TO authenticated
USING (admin_id = auth.uid() AND public.is_admin());
