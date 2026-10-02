/*
# Add service and status columns to bookings

## Purpose
- Store which service the customer selected (Qethje, Modelim Mjekre, Paketë Premium).
- Track booking lifecycle status (pending, completed, cancelled).

## Changes to existing table `bookings`
- `service` (text, nullable for backwards compat with existing rows, default 'Qethje')
  - CHECK constraint limits to known service names.
- `status` (text, not null, default 'pending')
  - CHECK constraint limits to 'pending', 'completed', 'cancelled'.

## Notes
- Both columns are additive — no data is lost.
- Existing rows get 'pending' status and 'Qethje' service default.
*/

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service text DEFAULT 'Qethje'
    CHECK (service IS NULL OR service IN ('Qethje', 'Modelim Mjekre', 'Paketë Premium'));

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'cancelled'));
