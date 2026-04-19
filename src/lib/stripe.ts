import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const key = import.meta.env.STRIPE_SECRET_KEY;
if (!key) console.warn('[stripe] STRIPE_SECRET_KEY missing');

export const stripe = new Stripe(key ?? '', {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

export function getSupabaseServer() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const k = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url ?? '', k ?? '', { auth: { persistSession: false } });
}
