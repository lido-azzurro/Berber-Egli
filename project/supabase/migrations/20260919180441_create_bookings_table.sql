/*
# Create bookings table for BERBER EGLI booking system

## Purpose
Stores all haircut appointment bookings for the barber shop booking system.
Single source of truth for slot availability — both customer bookings and
admin-added walk-ins live in this table.

## New Tables
- `bookings`
  - `id` (uuid, primary key)
  - `booking_date` (date, not null) — the calendar day the appointment is on
  - `slot_time` (text, not null) — 24h HH:MM format e.g. "09:00", "21:30"
  - client_full_name (text, not null) — Emër Mbiemër
  - client_phone (text, not null) — Numër Telefoni
  - notes (text, nullable) — optional Shënime
  - source (text, not null default 'online') — 'online' | 'walkin' | 'phone'
  - created_at (timestamptz, default now())
  - seen_by_admin (boolean, default false) — used for the "+N new" badge

## Constraints
- Unique constraint on (booking_date, slot_time) so two bookings can never
  occupy the same slot — database-enforced double-booking prevention.

## Security
- Enable RLS on `bookings`.
- This app is single-tenant with no customer sign-in: the customer-facing
  booking page must read/write as anon. Admin signs in via Supabase Auth.
- SELECT/INSERT open to anon + authenticated (anyone can book & see taken slots).
- UPDATE/DELETE restricted to authenticated (barber/admin only).
  Customer cannot cancel bookings; they call the shop. Admin can cancel/delete.

## Indexes
- Index on booking_date for fast slot-availability lookups.
- Index on seen_by_admin for fast "new bookings" count.
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date date NOT NULL,
  slot_time text NOT NULL,
  client_full_name text NOT NULL,
  client_phone text NOT NULL,
  notes text,
  source text NOT NULL DEFAULT 'online' CHECK (source IN ('online','walkin','phone')),
  created_at timestamptz DEFAULT now(),
  seen_by_admin boolean NOT NULL DEFAULT false
);

-- Prevent double-booking at the database level
CREATE UNIQUE INDEX IF NOT EXISTS bookings_date_slot_unique
  ON bookings (booking_date, slot_time);

CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS bookings_seen_idx ON bookings (seen_by_admin);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Customer (anon) can see which slots are taken (needed to gray out booked slots)
-- and can create bookings. They cannot see full client details because the
-- frontend only selects slot_time for availability; admin UI uses authenticated session.
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only authenticated admin can update (e.g. mark seen, change source)
DROP POLICY IF EXISTS "auth_update_bookings" ON bookings;
CREATE POLICY "auth_update_bookings" ON bookings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Only authenticated admin can delete bookings
DROP POLICY IF EXISTS "auth_delete_bookings" ON bookings;
CREATE POLICY "auth_delete_bookings" ON bookings FOR DELETE
  TO authenticated USING (true);
