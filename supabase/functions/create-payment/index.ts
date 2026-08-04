// supabase/functions/create-payment/index.ts
//
// Called by the checkout page right after an order is saved to Supabase.
// Takes an order_id, asks HitPay to create a payment link for that order's
// amount, records the payment_reference on the order, and returns the
// checkout URL so the frontend can redirect the customer to pay.
//
// SECRETS THIS FUNCTION NEEDS (set via `supabase secrets set`):
//   HITPAY_API_KEY   — your HitPay sandbox (later: live) API key
//
// AUTO-PROVIDED BY SUPABASE (no setup needed):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ── Switch this one line when going live (see HitPay docs) ──────────
// const HITPAY_BASE_URL = 'https://api.sandbox.hit-pay.com/v1'; // <- sandbox
const HITPAY_BASE_URL = 'https://api.hit-pay.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up the order using the service role key, which bypasses RLS —
    // safe here because this code runs on the server, never in the browser.
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://bikeandbutter.com';

    const hitpayRes = await fetch(`${HITPAY_BASE_URL}/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BUSINESS-API-KEY': Deno.env.get('HITPAY_API_KEY')!,
      },
      body: JSON.stringify({
        // total_sgd = subtotal_sgd + shipping_fee_sgd, computed at checkout.
        // Fall back to subtotal_sgd for any pre-existing order saved before
        // the shipping columns existed, so older pending orders don't break.
        amount: order.total_sgd ?? order.subtotal_sgd,
        currency: 'SGD',
        email: order.email,
        name: order.customer_name,
        phone: order.phone,
        purpose: `EVR order ${order.order_number}`,
        reference_number: order.order_number,
        redirect_url: `${siteUrl}/evr/order-confirmation.html?order=${order.order_number}`,
        webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/hitpay-webhook`,
        send_email: true,
      }),
    });

    const hitpayData = await hitpayRes.json();

    if (!hitpayRes.ok) {
      console.error('HitPay error:', hitpayData);
      return new Response(JSON.stringify({ error: 'HitPay request failed', details: hitpayData }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save the HitPay payment request id on the order so the webhook can
    // later match an incoming payment confirmation back to this order.
    await supabase
      .from('orders')
      .update({ payment_provider: 'hitpay', payment_reference: hitpayData.id })
      .eq('id', order_id);

    return new Response(JSON.stringify({ checkout_url: hitpayData.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
