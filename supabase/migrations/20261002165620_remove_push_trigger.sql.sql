/*
# Remove push notification trigger (moved to frontend-triggered approach)

## Purpose
The database trigger approach using pg_net requires the service role key
to be stored as a database setting, which is not available. Instead, the
frontend will call the send-push-notification edge function directly
after a successful booking insert.

## Changes
- Drop the `on_booking_insert_push` trigger.
- Drop the `notify_push_on_booking()` function.
- Keep pg_net installed (harmless, may be useful later).
*/

DROP TRIGGER IF EXISTS on_booking_insert_push ON public.bookings;
DROP FUNCTION IF EXISTS public.notify_push_on_booking();
