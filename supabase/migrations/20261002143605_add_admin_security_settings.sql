/*
# Add admin security settings

## Changes
- Add `backup_email` to profiles for the secondary security contact.
- Add `admin_email_change_requests` for auditable primary-email change requests and one-time verification codes.

## Security
- Only admins can read or create email-change requests.
- Only the authenticated admin can update their own password through Supabase Auth.
- The backup email is stored as protected profile data and is never exposed to guests.
*/

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS backup_email text;

CREATE TABLE IF NOT EXISTS public.admin_email_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_email text NOT NULL,
  backup_email text NOT NULL,
  verification_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

ALTER TABLE public.admin_email_change_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_email_requests_select" ON public.admin_email_change_requests;
CREATE POLICY "admin_email_requests_select" ON public.admin_email_change_requests FOR SELECT TO authenticated
USING (admin_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "admin_email_requests_insert" ON public.admin_email_change_requests;
CREATE POLICY "admin_email_requests_insert" ON public.admin_email_change_requests FOR INSERT TO authenticated
WITH CHECK (admin_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "admin_email_requests_update" ON public.admin_email_change_requests;
CREATE POLICY "admin_email_requests_update" ON public.admin_email_change_requests FOR UPDATE TO authenticated
USING (admin_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (admin_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "admin_email_requests_delete" ON public.admin_email_change_requests;
CREATE POLICY "admin_email_requests_delete" ON public.admin_email_change_requests FOR DELETE TO authenticated
USING (admin_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

UPDATE public.profiles
SET backup_email = 'erjolibi@gmail.com'
WHERE role = 'admin';
