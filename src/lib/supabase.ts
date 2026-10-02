import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'berber-egli-auth',
  },
});

export type ServiceType =
  | 'Qethje'
  | 'Rruajtje'
  | 'Rruajtje Makinë'
  | 'Lyerje Mjekre'
  | 'Larje Koke'
  | 'Trajtim me Avull'
  | 'Black Mask'
  | 'Scrub Mask'
  | 'Mask Dylli';

export type BookingStatus = 'pending' | 'completed' | 'cancelled';

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  role: 'customer' | 'admin';
  barber_notes: string | null;
  backup_email: string | null;
  created_at: string;
  updated_at: string;
};

export const SERVICES: { name: ServiceType; price: string; priceValue: number }[] = [
  { name: 'Qethje', price: '400 ALL', priceValue: 400 },
  { name: 'Rruajtje', price: '300 ALL', priceValue: 300 },
  { name: 'Rruajtje Makinë', price: '100 ALL', priceValue: 100 },
  { name: 'Lyerje Mjekre', price: '300 ALL', priceValue: 300 },
  { name: 'Larje Koke', price: '100 ALL', priceValue: 100 },
  { name: 'Trajtim me Avull', price: '1000 ALL', priceValue: 1000 },
  { name: 'Black Mask', price: '300 ALL', priceValue: 300 },
  { name: 'Scrub Mask', price: '200 ALL', priceValue: 200 },
  { name: 'Mask Dylli', price: '200 ALL', priceValue: 200 },
];

export type Booking = {
  id: string;
  booking_date: string;
  slot_time: string;
  client_full_name: string;
  client_phone: string;
  notes: string | null;
  source: 'online' | 'walkin' | 'phone';
  created_at: string;
  seen_by_admin: boolean;
  service: ServiceType | null;
  status: BookingStatus;
  user_id: string | null;
};
