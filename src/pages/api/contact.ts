import type { APIRoute } from 'astro';
import { getSupabaseServer } from '../../lib/stripe';
import { sendEmail } from '../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const subject = String(form.get('subject') ?? '').trim() || 'New contact';
    const message = String(form.get('message') ?? '').trim();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Name, email, and message are required' }), { status: 400 });
    }

    const sb = getSupabaseServer();
    await sb.from('ww_contact_submissions').insert({ name, email, subject, message });

    await sendEmail({
      to: email,
      subject: 'We got your message — Wicked Wick Co.',
      html: `<p>Hey ${name.split(' ')[0] || 'there'},</p>
<p>Thanks for reaching out to Wicked Wick Co. 🕯️ — we'll get back to you within one business day.</p>
<p>You wrote:</p>
<blockquote style="border-left:3px solid #c08457;padding:8px 16px;color:#3a322f;background:#f6efe6;border-radius:4px">${message.replace(/</g,'&lt;')}</blockquote>
<p>Catch you soon,<br/>The Wicked Wick Co. team</p>`,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('[contact]', e);
    return new Response(JSON.stringify({ error: 'Failed to submit' }), { status: 500 });
  }
};
