// config.js
// Central place for client-side configuration.
//
// IMPORTANT (Expo Snack): Snack does NOT read the .env file, so process.env.*
// is empty there. Only PUBLIC keys are baked in below as fallbacks so the app
// runs on Snack without a terminal. These keys are safe to ship in the client
// (Supabase anon key, Stripe *publishable* key, EmailJS public id).
// NEVER put the Stripe SECRET key or PayPal SECRET here — those live only on
// the server (server.js). If you later host the server, set API_BASE_URL to
// its public URL (or EXPO_PUBLIC_API_BASE_URL in a real build).

// ---- Public fallbacks (used automatically on Expo Snack) ----
const PUBLIC = {
  // Leave as localhost: payments only work once server.js is hosted somewhere
  // the phone/browser can reach. See notes above.
  API_BASE_URL: 'http://localhost:3000',
  STRIPE_PUBLISHABLE_KEY:
    'pk_test_51RDEOV4S4J4RzkQ0HVgTXg3bH51ZI12LtXRDr3zzLfMt5bcv0ycLhc3b5PrjSxYE20Viu9b7fJe3ddeX1yoIISfd00dr6HkoDC',
  SUPABASE_URL: 'https://refnmtaheurfnjxaosxf.supabase.co',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZm5tdGFoZXVyZm5qeGFvc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDMyMTIsImV4cCI6MjEwMDIxOTIxMn0.W_D7ZOfhBKlgqA5pmQuumQYfLX1D2PKyds3ZhJkizkg',
  EMAILJS_SERVICE_ID: 'service_ilcksaq',
  EMAILJS_TEMPLATE_ID: 'template_i5dib8v',
  EMAILJS_USER_ID: '8dFiZYa41iXSUamZk',
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || PUBLIC.API_BASE_URL;

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || PUBLIC.STRIPE_PUBLISHABLE_KEY;

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || PUBLIC.SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || PUBLIC.SUPABASE_ANON_KEY;

// ---- Demo mode ----  ⬅️ ده الجديد
// When true, the app completes checkout WITHOUT calling Stripe/PayPal.
// The order is saved (Supabase if signed in, otherwise locally on the device)
// so the whole flow Cart -> Payment -> Address -> Order works with no keys.
// The buyer of the app just sets EXPO_PUBLIC_DEMO_MODE=false (and fills the
// real keys + hosts server.js) to switch to real charges.
const rawDemoFlag = process.env.EXPO_PUBLIC_DEMO_MODE;
export const DEMO_MODE =
  typeof rawDemoFlag === 'string'
    ? rawDemoFlag.toLowerCase() === 'true'
    : /localhost|10\.0\.2\.2|127\.0\.0\.1/.test(API_BASE_URL); // no real server configured yet

export const EMAILJS = {
  serviceId: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || PUBLIC.EMAILJS_SERVICE_ID,
  templateId: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || PUBLIC.EMAILJS_TEMPLATE_ID,
  userId: process.env.EXPO_PUBLIC_EMAILJS_USER_ID || PUBLIC.EMAILJS_USER_ID,
};

export default {
  API_BASE_URL,
  DEMO_MODE,
  STRIPE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  EMAILJS,
};