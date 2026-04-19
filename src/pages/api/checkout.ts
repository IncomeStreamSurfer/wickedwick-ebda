import type { APIRoute } from 'astro';
import { stripe, getSupabaseServer } from '../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const items: Array<{ product_id: string; quantity: number }> = body.items ?? [];
    if (!items.length) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), { status: 400 });
    }

    const sb = getSupabaseServer();
    const ids = items.map((i) => i.product_id);
    const { data: products, error } = await sb.from('ww_products').select('*').in('id', ids);
    if (error || !products) {
      return new Response(JSON.stringify({ error: 'Could not load products' }), { status: 500 });
    }

    const siteUrl = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;

    let subtotal = 0;
    const line_items = items
      .map((it) => {
        const p = products.find((x: any) => x.id === it.product_id);
        if (!p) return null;
        const qty = Math.max(1, Math.min(10, Number(it.quantity) || 1));
        subtotal += p.price_pence * qty;
        return {
          price_data: {
            currency: p.currency || 'usd',
            product_data: {
              name: p.name,
              description: p.description ?? undefined,
              images: p.image_url ? [p.image_url] : undefined,
              metadata: { product_id: p.id, slug: p.slug },
            },
            unit_amount: p.price_pence,
          },
          quantity: qty,
        };
      })
      .filter(Boolean) as any[];

    if (!line_items.length) {
      return new Response(JSON.stringify({ error: 'No valid items' }), { status: 400 });
    }

    const shipping_options =
      subtotal >= 5000
        ? [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 0, currency: 'usd' }, display_name: 'Free shipping (over $50)' } }]
        : [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 600, currency: 'usd' }, display_name: 'Standard shipping (2-5 business days)' } }];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'IE'] },
      shipping_options,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      metadata: {
        line_items_json: JSON.stringify(line_items.map((l) => ({ name: l.price_data.product_data.name, qty: l.quantity, pence: l.price_data.unit_amount }))),
      },
    });

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[checkout]', e);
    return new Response(JSON.stringify({ error: e?.message ?? 'Checkout failed' }), { status: 500 });
  }
};
