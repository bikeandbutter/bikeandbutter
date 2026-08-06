// supabase/functions/hitpay-webhook/index.ts
//
// Public endpoint HitPay calls automatically when a payment completes.
// Verifies the payload is genuinely from HitPay (HMAC signature check),
// then flips the matching order's status from pending_payment -> paid.
//
// SECRETS THIS FUNCTION NEEDS (set via `supabase secrets set`):
//   HITPAY_SALT         — found in HitPay dashboard: Settings > Payment
//                         Gateway > API Keys (separate from the API key itself)
//   GMAIL_ADDRESS        — bikeandbutter@gmail.com
//   GMAIL_APP_PASSWORD   — 16-character App Password generated at
//                         myaccount.google.com/apppasswords (requires
//                         2-Step Verification enabled on the account first)
//
// AUTO-PROVIDED BY SUPABASE (no setup needed):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// IMPORTANT: this function must be deployed with --no-verify-jwt, since
// HitPay calling it won't have a Supabase auth token. See deploy guide.

const OWNER_EMAIL = 'bikeandbutter@gmail.com';

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

async function sendOwnerNotification(order: any, items: any[]) {
  const gmailAddress = Deno.env.get('GMAIL_ADDRESS');
  const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');

  if (!gmailAddress || !gmailAppPassword) {
    console.error('GMAIL_ADDRESS or GMAIL_APP_PASSWORD not set — skipping owner notification email');
    return;
  }

  const itemRows = items.map((item) =>
    `<tr>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;"><strong>${item.sku}</strong></td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.name}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.colour || ''}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.size || ''}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.qty}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">S$${item.line_total_sgd}</td>
     </tr>`
  ).join('');

  const html = `
    <h2>New paid order — ${order.order_number}</h2>
    <p><strong>Customer:</strong> ${order.customer_name}<br/>
       <strong>Email:</strong> ${order.email}<br/>
       <strong>Phone:</strong> ${order.phone}<br/>
       <strong>Delivery address:</strong> ${order.delivery_address}<br/>
       ${order.delivery_notes ? `<strong>Notes:</strong> ${order.delivery_notes}<br/>` : ''}
    </p>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px;">
      <thead>
        <tr style="background:#f4f4f4;text-align:left;">
          <th style="padding:6px 10px;">SKU</th>
          <th style="padding:6px 10px;">Item</th>
          <th style="padding:6px 10px;">Colour</th>
          <th style="padding:6px 10px;">Size</th>
          <th style="padding:6px 10px;">Qty</th>
          <th style="padding:6px 10px;">Line Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <p style="margin-top:14px;">
      <strong>Subtotal:</strong> S$${order.subtotal_sgd}<br/>
      <strong>Shipping:</strong> S$${order.shipping_fee_sgd}<br/>
      <strong>Total paid:</strong> S$${order.total_sgd}
    </p>
    <p style="margin-top:14px;color:#666;font-size:12px;">
      Manage this order in the <a href="https://bikeandbutter.com/evr/admin/">EVR admin panel</a>.
    </p>
  `;

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: {
        username: gmailAddress,
        password: gmailAppPassword,
      },
    },
  });

  try {
    await client.send({
      from: gmailAddress,
      to: OWNER_EMAIL,
      subject: `New order ${order.order_number} — S$${order.total_sgd}`,
      html,
    });
  } catch (err) {
    console.error('Gmail SMTP send failed:', err);
  } finally {
    await client.close();
  }
}

async function sendCustomerConfirmation(order: any, items: any[]) {
  const gmailAddress = Deno.env.get('GMAIL_ADDRESS');
  const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');

  if (!gmailAddress || !gmailAppPassword) {
    console.error('GMAIL_ADDRESS or GMAIL_APP_PASSWORD not set — skipping customer confirmation email');
    return;
  }

  // Deliberately NO sku column here — this goes to the customer, and the
  // SKU is what lets us order stock from our supplier. Keep it internal.
  const itemRows = items.map((item) =>
    `<tr>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.name}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.colour || ''}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.size || ''}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.qty}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;">S$${item.line_total_sgd}</td>
     </tr>`
  ).join('');

  const html = `
    <h2>Thanks for your order, ${order.customer_name}!</h2>
    <p>We've received your payment for order <strong>${order.order_number}</strong>.
       This is a pre-order — items ship from our warehouse in approximately
       10 working days. We'll be in touch if anything in your order can't be
       fulfilled.</p>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px;margin-top:12px;">
      <thead>
        <tr style="background:#f4f4f4;text-align:left;">
          <th style="padding:6px 10px;">Item</th>
          <th style="padding:6px 10px;">Colour</th>
          <th style="padding:6px 10px;">Size</th>
          <th style="padding:6px 10px;">Qty</th>
          <th style="padding:6px 10px;">Line Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <p style="margin-top:14px;">
      <strong>Subtotal:</strong> S$${order.subtotal_sgd}<br/>
      <strong>Shipping:</strong> S$${order.shipping_fee_sgd}<br/>
      <strong>Total paid:</strong> S$${order.total_sgd}
    </p>
    <p style="margin-top:14px;">
      <strong>Delivery address:</strong> ${order.delivery_address}<br/>
      ${order.delivery_notes ? `<strong>Notes:</strong> ${order.delivery_notes}<br/>` : ''}
    </p>
    <p style="margin-top:14px;color:#666;font-size:12px;">
      Questions about your order? Just reply to this email.
    </p>
  `;

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: {
        username: gmailAddress,
        password: gmailAppPassword,
      },
    },
  });

  try {
    await client.send({
      from: gmailAddress,
      to: order.email,
      subject: `Your order ${order.order_number} is confirmed — Bike & Butter`,
      html,
    });
  } catch (err) {
    console.error('Gmail SMTP send (customer) failed:', err);
  } finally {
    await client.close();
  }
}

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
      const { data: updatedOrders, error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_reference: fields.payment_id || fields.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', orderNumber)
        .eq('status', 'pending_payment') // don't overwrite an already-processed order
        .select();

      if (error) {
        console.error('Failed to update order:', error);
        return new Response(JSON.stringify({ error: 'DB update failed' }), { status: 500 });
      }

      // .select() only returns a row if the update actually matched+changed
      // one — i.e. this is the FIRST time we've seen this order as paid.
      // This guards against HitPay retrying the webhook and us emailing
      // the owner twice for the same order.
      if (updatedOrders && updatedOrders.length > 0) {
        const order = updatedOrders[0];
        const { data: items, error: itemsErr } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsErr) {
          console.error('Failed to fetch order items for email:', itemsErr);
        } else {
          await sendOwnerNotification(order, items || []);
          await sendCustomerConfirmation(order, items || []);
        }
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
