// services/paypal.js
// Client-side helper that talks to the Express server (server.js) which holds
// the PayPal secret. The app never sees the secret.

import { API_BASE_URL } from '../config';

/**
 * Create a PayPal payment on the server and return the approval URL that the
 * user must open to approve the payment.
 *
 * @param {number} amount  Order total (e.g. 249.99)
 * @param {string} currency ISO currency code (default 'USD')
 * @returns {Promise<{ approvalUrl: string, paymentId: string }>}
 */
export async function createPayPalPayment(amount, currency = 'USD') {
  const response = await fetch(`${API_BASE_URL}/create-paypal-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency }),
  });

  if (!response.ok) {
    let details = '';
    try {
      const err = await response.json();
      details = err.error || JSON.stringify(err);
    } catch (e) {
      details = `HTTP ${response.status}`;
    }
    throw new Error(`Failed to create PayPal payment: ${details}`);
  }

  return response.json(); // { approvalUrl, paymentId }
}

/**
 * Ask our server to confirm a PayPal payment's REAL status.
 * Returns { verified, state, amount, currency }. `verified` is true only when
 * PayPal reports the payment as 'approved' (i.e. actually captured), which
 * prevents faking a paid order by just closing the approval window.
 *
 * @param {string} paymentId
 * @returns {Promise<{ verified: boolean, state?: string, amount?: string, currency?: string }>}
 */
export async function getPayPalPaymentStatus(paymentId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/paypal-payment-status?paymentId=${encodeURIComponent(paymentId)}`
    );
    if (!response.ok) return { verified: false };
    return response.json();
  } catch (e) {
    return { verified: false };
  }
}

/**
 * Fetch a PayPal access token from the server (useful for advanced flows).
 * @returns {Promise<string>} accessToken
 */
export async function getPayPalAccessToken() {
  const response = await fetch(`${API_BASE_URL}/get-paypal-token`);
  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }
  const data = await response.json();
  return data.accessToken;
}
