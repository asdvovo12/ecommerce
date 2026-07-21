const express = require('express');
const cors = require('cors');
const paypal = require('paypal-rest-sdk');
const Stripe = require('stripe');
const dotenv = require('dotenv');
const fetch = require('node-fetch'); // Import node-fetch
const btoa = require('btoa'); // Import btoa for Base64 encoding

// Load environment variables from .env file
dotenv.config();

// --- Validate required environment variables early (fail fast) ---
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_API_BASE =
  PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error(
    '\u274c Missing PayPal credentials. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env file.'
  );
  process.exit(1);
}

// --- Stripe setup ---
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error(
    '\u274c Missing STRIPE_SECRET_KEY. Please set it in your .env file.'
  );
  process.exit(1);
}
const stripe = Stripe(STRIPE_SECRET_KEY);

const app = express();

app.use(cors()); // Allow the mobile app / web client to call this server
app.use(express.json()); // Middleware to parse JSON request bodies

// Configure PayPal SDK (credentials are strings loaded from environment)
paypal.configure({
  mode: PAYPAL_MODE,
  client_id: PAYPAL_CLIENT_ID,
  client_secret: PAYPAL_CLIENT_SECRET,
});

// ---  Endpoint for getting an access token ---
app.get('/get-paypal-token', async (req, res) => {
  try {
    const encodedCredentials = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);

    const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json(); // Parse error response
      console.error('PayPal Token Error:', errorData); // Log detailed error
      return res
        .status(tokenResponse.status)
        .json({ error: 'Failed to get PayPal access token', details: errorData });
    }

    const tokenData = await tokenResponse.json();
    res.json({ accessToken: tokenData.access_token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// --- End of token endpoint ---

// Endpoint to create a PayPal payment
app.post('/create-paypal-payment', (req, res) => {
  const { amount, currency } = req.body;

  const numericAmount = Number(amount);
  if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0 || !currency) {
    return res
      .status(400)
      .json({ error: 'A valid amount (> 0) and currency are required.' });
  }

  const totalStr = numericAmount.toFixed(2); // Ensure two decimal places

  // We embed the amount + currency in the return URL so /success can execute
  // the payment with the SAME values used at creation time.
  const returnUrl = `${process.env.RETURN_URL}?amount=${totalStr}&currency=${currency}`;

  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: returnUrl,
      cancel_url: process.env.CANCEL_URL,
    },
    transactions: [
      {
        amount: {
          total: totalStr,
          currency: currency,
        },
        description: 'Payment for your product/service',
      },
    ],
  };

  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      console.error(error); // Log the full error for debugging
      if (error.response && error.response.message) {
        return res
          .status(500)
          .json({ error: `PayPal API Error: ${error.response.message}` });
      }
      return res.status(500).json({ error: 'PayPal API Error' });
    }

    const approvalLink = payment.links.find((link) => link.rel === 'approval_url');
    if (approvalLink && approvalLink.href) {
      res.json({ approvalUrl: approvalLink.href, paymentId: payment.id });
    } else {
      res.status(500).json({ error: 'Approval URL not found.' });
    }
  });
});

// VERY IMPORTANT: Endpoint to *execute* the payment after user approval.
// The amount + currency are read from the query string (set in return_url),
// so the executed values always match the created payment.
app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const amount = req.query.amount;
  const currency = req.query.currency || 'USD';

  if (!payerId || !paymentId || !amount) {
    return res.status(400).send('Missing payment confirmation parameters.');
  }

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: currency, // MUST MATCH the currency used at creation.
          total: Number(amount).toFixed(2), // MUST MATCH the amount used at creation.
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      console.error(error.response || error);
      res.status(500).send('Payment execution failed.');
    } else {
      console.log(JSON.stringify(payment));
      res.send('Payment successful!');
    }
  });
});

app.get('/cancel', (req, res) => {
  res.send('Payment cancelled.');
});

// ============================================================
// STRIPE: create a PaymentIntent and return its client secret.
// The app collects the card securely with Stripe's PaymentSheet and confirms
// using this client secret, so raw card data never touches this server or the
// app code (PCI compliant).
// ============================================================
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'A valid amount (> 0) is required.' });
    }

    // Stripe expects the amount in the smallest currency unit (cents).
    const amountInCents = Math.round(numericAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || undefined,
    });
  } catch (error) {
    console.error('Stripe PaymentIntent error:', error.message);
    res.status(500).json({ error: 'Failed to create payment intent.' });
  }
});

// ============================================================
// PAYPAL: verify a payment's REAL status directly from PayPal.
// The app calls this AFTER the approval browser closes, so a user cannot fake
// a "paid" order by simply closing the window. A payment reaches state
// 'approved' only after /success actually executed it on PayPal.
// ============================================================
app.get('/paypal-payment-status', (req, res) => {
  const paymentId = req.query.paymentId;
  if (!paymentId) {
    return res.status(400).json({ verified: false, error: 'paymentId is required.' });
  }

  paypal.payment.get(paymentId, (error, payment) => {
    if (error) {
      console.error(error.response || error);
      return res
        .status(500)
        .json({ verified: false, error: 'Failed to fetch payment status.' });
    }

    const state = payment.state; // 'created' | 'approved' | 'failed'
    const transaction = (payment.transactions && payment.transactions[0]) || {};
    const amountObj = transaction.amount || {};

    res.json({
      verified: state === 'approved',
      state,
      paymentId,
      amount: amountObj.total,
      currency: amountObj.currency,
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
