import type { APIRoute } from 'astro';
import { stripe, getSupabaseServer } from '../../../lib/stripe';
import { sendEmail, orderConfirmationHtml } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (!sig || !webhookSecret) {
    console.warn('[webhook] missing signature or secret');
    return new Response('Missing signature', { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[webhook] signature verify failed', err?.message);
    return new Response(`Webhook Error: ${err?.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session: any = event.data.object;
    const sb = getSupabaseServer();

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 20 });
      const lineItemsData = lineItems.data.map((li) => ({
        name: li.description,
        quantity: li.quantity,
        amount_pence: li.amount_total ?? 0,
      }));

      const { error: insErr } = await sb.from('ww_orders').insert({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        customer_email: session.customer_details?.email ?? session.customer_email,
        customer_name: session.customer_details?.name ?? null,
        amount_total_pence: session.amount_total,
        currency: session.currency,
        line_items: lineItemsData,
        status: 'paid',
      });
      if (insErr) console.error('[webhook] order insert error', insErr);

      const email = session.customer_details?.email ?? session.customer_email;
      if (email) {
        await sendEmail({
          to: email,
          subject: '🕯️ Your Wicked Wick Co. order is confirmed',
          html: orderConfirmationHtml({
            customerName: session.customer_details?.name ?? '',
            orderId: session.id.slice(-10).toUpperCase(),
            lineItems: lineItemsData as any,
            totalPence: session.amount_total ?? 0,
            currency: session.currency ?? 'usd',
          }),
        });
      }
    } catch (e) {
      console.error('[webhook] processing error', e);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
