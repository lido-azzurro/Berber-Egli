/*
# Tighten booking and profile permissions

## Security fixes
1. Remove the original public booking SELECT policy so guests cannot read names, phones, notes, or account IDs.
2. Remove the original broad authenticated UPDATE/DELETE policies so any signed-in customer cannot alter or remove bookings.
3. Prevent customers from changing their own profile role from `customer` to `admin`.
4. Keep the public slot availability function as the only guest availability surface.
*/

DROP POLICY IF EXISTS "anon_select_bookings" ON public.bookings;
DROP POLICY IF EXISTS "auth_update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "auth_delete_bookings" ON public.bookings;

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() AND role = 'customer')
WITH CHECK (id = auth.uid() AND role = 'customer');

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
