// services/stripe.js
// Talks to the server to create a Stripe PaymentIntent. The client secret is
// then used with Stripe's PaymentSheet so raw card data never touches our code.

import { API_BASE_URL } from '../config';

/**
 * @param {number} amount   Order total in the main currency unit (e.g. 249.99)
 * @param {string} currency ISO code, default 'usd'
 * @returns {Promise<{ clientSecret: string, paymentIntentId: string }>}
 */
export async function createPaymentIntent(amount, currency = 'usd') {
  const response = await fetch(`${API_BASE_URL}/create-payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency }),
  });

  if (!response.ok) {
    let details = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      details = err.error || details;
    } catch (e) {}
    throw new Error(`Failed to create payment intent: ${details}`);
  }

  return response.json();
}
