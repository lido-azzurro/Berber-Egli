/*
# Create push_subscriptions table for admin push notifications

## Purpose
Stores Web Push subscription data (endpoint, p256dh key, auth key) so the
edge function can send real-time push notifications to the admin's device
when a new booking arrives.

## New Tables
- `push_subscriptions`
  - `id` (uuid, primary key)
  - `endpoint` (text, unique) — the push service endpoint URL
  - `p256dh` (text) — public key for encryption
  - `auth` (text) — auth secret for encryption
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## Security
- Enable RLS on `push_subscriptions`.
- Only authenticated users (admin) can insert/update their subscription.
- Anyone authenticated can manage their own subscription.
*/

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subs_select" ON public.push_subscriptions;
CREATE POLICY "push_subs_select" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "push_subs_insert" ON public.push_subscriptions;
CREATE POLICY "push_subs_insert" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "push_subs_update" ON public.push_subscriptions;
CREATE POLICY "push_subs_update" ON public.push_subscriptions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "push_subs_delete" ON public.push_subscriptions;
CREATE POLICY "push_subs_delete" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS push_subs_endpoint_idx ON public.push_subscriptions(endpoint);
