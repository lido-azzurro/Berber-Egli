/*
# Create customer profiles automatically after signup

## Purpose
Ensures every new Supabase Auth customer gets a profile even when the auth provider requires email confirmation before a session is issued.

## Security
- The trigger is SECURITY DEFINER with a fixed search path.
- It always creates a `customer` profile and never trusts a client-supplied role.
- Existing profiles are left unchanged.
*/

CREATE OR REPLACE FUNCTION public.handle_new_customer_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Klient'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), 'Pa numër'),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_customer_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_customer_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer_profile();

REVOKE EXECUTE ON FUNCTION public.handle_new_customer_profile() FROM public, anon, authenticated;
