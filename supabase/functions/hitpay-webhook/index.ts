// supabase/functions/hitpay-webhook/index.ts
//
// Public endpoint HitPay calls automatically when a payment completes.
// Verifies the payload is genuinely from HitPay (HMAC signature check),
// then flips the matching order's status from pending_payment -> paid.
//
// SECRETS THIS FUNCTION NEEDS (set via `supabase secrets set`):
//   HITPAY_SALT      — found in HitPay dashboard: Settings > Payment
//                      Gateway > API Keys (separate from the API key itself)
//
// AUTO-PROVIDED BY SUPABASE (no setup needed):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// IMPORTANT: this function must be deployed with --no-verify-jwt, since
// HitPay calling it won't have a Supabase auth token. See deploy guide.

import { createClient } from 'jsr:@supabase/supabase-js@2';

async function verifyHmac(fields: Record<string, string>, salt: string): Promise<boolean> {
  const { hmac, ...rest } = fields;
  if (!hmac) return false;

  // Matches HitPay's documented verification approach: concatenate
  // "key"+"value" for every field (excluding hmac), sorted by key,
  // then HMAC-SHA256 the result with your account's salt.
  const sortedKeys = Object.keys(rest).sort();
  const source = sortedKeys.map((k) => `${k}${rest[k]}`).join('');

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(source));
  const computedHmac = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0')).join('');

  return computedHmac === hmac;
}

Deno.serve(async (req) => {
  try {
    const contentType = req.headers.get('content-type') || '';
    let fields: Record<string, string> = {};

    if (contentType.includes('application/json')) {
      fields = await req.json();
    } else {
      const formData = await req.formData();
      formData.forEach((value, key) => { fields[key] = String(value); });
    }

    const salt = Deno.env.get('HITPAY_SALT')!;
    const isValid = await verifyHmac(fields, salt);

    if (!isValid) {
      console.error('HitPay webhook: invalid HMAC signature', fields);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // reference_number was set to our order_number when we created the
    // payment request, so we use it to find the matching order.
    const orderNumber = fields.reference_number;
    const status = fields.status; // e.g. "completed"

    if (!orderNumber) {
      return new Response(JSON.stringify({ error: 'Missing reference_number' }), { status: 400 });
    }

    if (status === 'completed') {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_reference: fields.payment_id || fields.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', orderNumber)
        .eq('status', 'pending_payment'); // don't overwrite an already-processed order

      if (error) {
        console.error('Failed to update order:', error);
        return new Response(JSON.stringify({ error: 'DB update failed' }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
