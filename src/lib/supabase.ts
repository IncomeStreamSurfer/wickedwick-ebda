import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[supabase] Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: { persistSession: false },
});

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  long_description: string | null;
  scent_notes: string | null;
  burn_time_hours: number | null;
  size_oz: number | null;
  price_pence: number;
  currency: string;
  image_url: string | null;
  image_alt: string | null;
  featured: boolean;
  in_stock: boolean;
};

export type ContentPost = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  author: string | null;
  published_at: string | null;
};

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('ww_products')
    .select('*')
    .order('featured', { ascending: false })
    .order('name');
  if (error) {
    console.error('[supabase] getAllProducts:', error);
    return [];
  }
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('ww_products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) {
    console.error('[supabase] getProductBySlug:', error);
    return null;
  }
  return (data as Product) ?? null;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('ww_products')
    .select('*')
    .eq('featured', true)
    .order('name');
  if (error) return [];
  return (data ?? []) as Product[];
}

export async function getPublishedPosts(): Promise<ContentPost[]> {
  const { data, error } = await supabase
    .from('ww_content')
    .select('*')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as ContentPost[];
}

export async function getPostBySlug(slug: string): Promise<ContentPost | null> {
  const { data, error } = await supabase
    .from('ww_content')
    .select('*')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .maybeSingle();
  if (error) return null;
  return (data as ContentPost) ?? null;
}

export function formatPrice(pence: number, currency = 'usd') {
  const symbol = currency.toLowerCase() === 'gbp' ? '£' : currency.toLowerCase() === 'eur' ? '€' : '$';
  return `${symbol}${(pence / 100).toFixed(2)}`;
}
