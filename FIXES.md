# Critical fixes applied

## 1. server.js
- PayPal client_id / client_secret are now proper strings loaded from environment
  variables (no more ReferenceError crash on startup).
- Added fail-fast validation + CORS so the app can call the server.
- /create-paypal-payment now validates the amount and embeds amount+currency in
  the return URL.
- /success now executes the payment with the REAL amount+currency (read from the
  query string) instead of the hardcoded $10.00 / USD.
- Supports sandbox/live via PAYPAL_MODE.

## 2. .env / .env.example
- Added .env (real values) and .env.example (template).
- All secrets (PayPal, Stripe, Supabase, EmailJS) now come from env vars.
- .env is git-ignored; .env.example is committed.

## 3. Single entry point
- index.js now just registers the full App.js (registerRootComponent).
- The complete app (bottom tabs + StripeProvider + real Products screen) in
  App.js is now the only entry, so Stripe works. The old duplicate app that
  lived in index.js was removed.

## 4. creditCardOCR.js
- Was 0 bytes. Now a working camera + Tesseract OCR card scanner
  (extractCardNumber / extractExpiry / luhnCheck helpers + <CreditCardScanner/>).

## 5. Backend <-> Frontend integration
- config.js: central client config (API_BASE_URL + keys from env).
- services/paypal.js: createPayPalPayment() / getPayPalAccessToken() helpers.
- Checkout.js: PayPal option now calls the server and opens the approval page.
- supabaseClient.js / App.js / VerifyEmail.js: keys read from config instead of
  being hardcoded.

## How to run
1. cp .env.example .env  (already provided) and fill values.
2. Backend:  node server.js
3. App:      npm install && npx expo start
   - Set EXPO_PUBLIC_API_BASE_URL to reach your server
     (Android emulator: http://10.0.2.2:3000, iOS sim: http://localhost:3000,
      device: http://<your-LAN-IP>:3000).
