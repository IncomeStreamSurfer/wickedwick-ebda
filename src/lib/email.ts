const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY missing — skipping send');
    return { skipped: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: opts.from ?? 'Wicked Wick Co. <onboarding@resend.dev>',
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[email] Resend error', res.status, body);
      return { error: body };
    }
    return { id: body.id };
  } catch (e) {
    console.error('[email] send failed', e);
    return { error: String(e) };
  }
}

export function orderConfirmationHtml(opts: {
  customerName: string;
  orderId: string;
  lineItems: Array<{ name: string; quantity: number; amount_pence: number }>;
  totalPence: number;
  currency: string;
}) {
  const sym = opts.currency.toLowerCase() === 'gbp' ? '£' : opts.currency.toLowerCase() === 'eur' ? '€' : '$';
  const rows = opts.lineItems
    .map(
      (l) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid #e5d9c5;">${l.name} × ${l.quantity}</td><td style="padding:12px 0;border-bottom:1px solid #e5d9c5;text-align:right;">${sym}${(l.amount_pence / 100).toFixed(2)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1413">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6efe6;padding:40px 20px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5d9c5">
  <tr><td style="padding:32px 32px 16px 32px">
    <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#8a4b2a">Wicked Wick Co.</p>
    <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:28px;font-weight:600">Thank you, ${opts.customerName || 'friend'} 🕯️</h1>
    <p style="margin:0;color:#3a322f;line-height:1.6">Your order is confirmed. We're already getting the candles ready in our workshop — they'll ship within 2 business days.</p>
  </td></tr>
  <tr><td style="padding:8px 32px">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">
      ${rows}
      <tr><td style="padding:14px 0 0 0;font-weight:600">Total</td><td style="padding:14px 0 0 0;text-align:right;font-weight:600">${sym}${(opts.totalPence / 100).toFixed(2)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 32px 32px 32px">
    <p style="margin:0 0 12px 0;color:#3a322f;line-height:1.6">We'll email you a tracking number the moment your order ships. If anything's off, just reply to this email — we're a small team and we'll make it right.</p>
    <p style="margin:0;color:#8a4b2a;font-size:13px">Order ID: ${opts.orderId}</p>
  </td></tr>
  <tr><td style="background:#1a1413;color:#f6efe6;padding:20px 32px;font-size:12px;text-align:center">
    Wicked Wick Co. · Hand-poured with care
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
