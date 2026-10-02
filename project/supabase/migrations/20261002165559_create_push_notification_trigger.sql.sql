/*
# Install pg_net and create booking insert trigger for push notifications

## Purpose
When a new booking is inserted into the `bookings` table, automatically
call the `send-push-notification` edge function via HTTP POST so the admin
receives a real-time push notification on their device.

## Changes
1. Install `pg_net` extension (available but not yet installed).
2. Create a trigger function `notify_push_on_booking()` that makes an
   asynchronous HTTP POST to the edge function with booking details.
3. Create a trigger `on_booking_insert_push` that fires AFTER INSERT on
   `bookings` and only for online bookings (source = 'online') where
   `seen_by_admin` is false (i.e. genuine new customer bookings).

## Security
- The trigger function runs with SECURITY DEFINER privileges.
- The HTTP call uses the Supabase service role key from environment.
- Only fires on INSERT, never on UPDATE or DELETE.
*/

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_push_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_service_key text;
BEGIN
  -- Only notify for new online bookings not yet seen by admin
  IF NEW.source = 'online' AND NEW.seen_by_admin = false THEN
    v_url := current_setting('app.supabase_url', true) || '/functions/v1/send-push-notification';
    v_service_key := current_setting('app.supabase_service_role_key', true);

    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'clientName', NEW.client_full_name,
        'slotTime', NEW.slot_time,
        'bookingDate', NEW.booking_date,
        'service', NEW.service
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_insert_push ON public.bookings;
CREATE TRIGGER on_booking_insert_push
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_on_booking();
