/*
# Remove legacy booking insert policy

## Security
The original `anon_insert_bookings` policy allowed any request to insert any `user_id`, bypassing the newer guest-or-owner check. Remove it so the current booking insert policy is the only insert rule.
*/

DROP POLICY IF EXISTS "anon_insert_bookings" ON public.bookings;
