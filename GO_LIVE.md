# Go-Live Guide — Payments & Orders

This explains what now works, how to run it, and what to do before you actually sell.

## What now works (added in this round)

1. **Real card charges via Stripe** (secure, PCI-compliant)
   - Server endpoint `POST /create-payment-intent` creates a Stripe PaymentIntent.
   - The app opens Stripe's **PaymentSheet** to collect the card securely — raw card data never touches our code or server.
   - Files: `server.js`, `services/stripe.js`, `Checkout.js`.

2. **PayPal charge** completes and is recorded as an order.

3. **Orders are saved to Supabase** (`services/orders.js`)
   - An order + its line items are written only **after** payment succeeds.
   - Each order is tied to the signed-in user (enforced by Row Level Security).

4. **Stock decrement** — `decrement_stock()` reduces product stock atomically after purchase (prevents overselling).

5. **Product catalog table** ready in Supabase (`services/products.js`)
   - `fetchProducts()` reads active products from the DB and **falls back to the local catalog** automatically when the DB is empty/unreachable.

## One-time setup

1. **Create the database tables**
   - Open Supabase Dashboard → SQL Editor → paste and run `supabase/schema.sql`.

2. **Add your Stripe keys** to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_or_test_...
   STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...
   ```

3. **Run it**
   ```
   npm install
   node server.js        # starts the payment server on :3000
   npx expo start        # starts the app
   ```
   - Set `EXPO_PUBLIC_API_BASE_URL` to a URL the phone can reach:
     - Android emulator: `http://10.0.2.2:3000`
     - iOS simulator: `http://localhost:3000`
     - Real device: `http://<your-computer-LAN-IP>:3000`

## Test the payment flow

- Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
- After success you should see: cart cleared → order row in `orders` → items in `order_items` → stock reduced.

## Before you sell for real (still recommended)

- [ ] Switch Stripe & PayPal from **test/sandbox** to **live** keys, and set `PAYPAL_MODE=live`.
- [ ] **Rotate the keys** that were previously committed in code (Supabase, Stripe, PayPal, EmailJS) — treat them as compromised.
- [ ] Populate the `products` table (or keep the local catalog) and replace `via.placeholder.com` images with real ones.
- [ ] Verify PayPal server-side on the `/success` webhook and mark the order paid there (currently the order is saved after the approval browser closes).
- [ ] Enable shipping/tax if needed: set `SHIPPING_FLAT` and `TAX_RATE` in `Checkout.js`.
- [ ] Show real order history from `getMyOrders()` in `Order.js` (currently uses placeholder data).
- [ ] Add email receipts (EmailJS is already configured).
- [ ] Add Privacy Policy + Terms (required for App Store / Play Store and Stripe review).
- [ ] Add an admin path to manage products/stock (writes need the service role or an authenticated admin policy).

## Security note

Card number/CVV are **no longer** sent to your server — Stripe's PaymentSheet handles them. The old manual card fields in `Payment.js` are used only to pick a method label; the real charge always goes through Stripe.
