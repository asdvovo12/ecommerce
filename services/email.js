// services/email.js
// Sends an order receipt email using EmailJS (already configured in config.js).
//
// NOTE: EmailJS templates use named variables. Add these variables to your
// EmailJS template so the receipt renders nicely:
//   {{to_email}} {{order_id}} {{order_total}} {{order_items}} {{order_date}} {{message}}
// The `code` field is also sent so the existing template still shows something.

import emailjs from 'emailjs-com';
import { EMAILJS } from '../config';

/**
 * @param {Object} params
 * @param {string} params.toEmail
 * @param {Object} params.order   The saved order row (id, total, currency, created_at...)
 * @param {Array}  params.items   Order items ([{ name, storage, unit_price, quantity }])
 */
export async function sendOrderReceipt({ toEmail, order, items = [] }) {
  if (!toEmail) {
    console.warn('sendOrderReceipt: no recipient email; skipping.');
    return;
  }
  if (!EMAILJS.serviceId || !EMAILJS.templateId || !EMAILJS.userId) {
    console.warn('sendOrderReceipt: EmailJS not configured; skipping.');
    return;
  }

  emailjs.init(EMAILJS.userId);

  const currency = order.currency || 'USD';
  const itemsText = (items || [])
    .map(
      (it) =>
        `- ${it.name}${it.storage ? ' (' + it.storage + ')' : ''} x${it.quantity} = ${currency} ${(
          Number(it.unit_price) * it.quantity
        ).toFixed(2)}`
    )
    .join('\n');

  const totalText = `${currency} ${Number(order.total).toFixed(2)}`;
  const shortId = String(order.id).slice(0, 8);

  const params = {
    to_email: toEmail,
    order_id: order.id,
    order_total: totalText,
    order_items: itemsText,
    order_date: new Date(order.created_at || Date.now()).toLocaleString(),
    message: `Thank you for your order!\n\nOrder #${shortId}\nTotal: ${totalText}\n\n${itemsText}`,
    // Fallback for the existing template that expects a `code` field:
    code: `Order #${shortId}`,
  };

  try {
    await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, params);
  } catch (e) {
    console.warn('sendOrderReceipt: failed to send:', e && e.message);
  }
}
