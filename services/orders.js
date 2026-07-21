// services/orders.js
// Persists orders to Supabase and decrements stock atomically.

import { supabase } from '../supabaseClient';

/**
 * Create an order with its items, then decrement stock for each product.
 *
 * @param {Object} params
 * @param {Array}  params.cartItems       Cart items ([{ id, name, storage, price, discount, quantity, image }])
 * @param {Object} params.shippingAddress Saved address object
 * @param {string} params.paymentMethod   'stripe' | 'paypal' | 'visa' | 'mastercard'
 * @param {string} params.paymentRef      PaymentIntent id / PayPal payment id
 * @param {number} params.subtotal
 * @param {number} params.shipping
 * @param {number} params.tax
 * @param {number} params.total
 * @param {string} params.currency
 * @returns {Promise<{ order: Object }>}
 */
export async function createOrder({
  cartItems = [],
  shippingAddress = null,
  paymentMethod,
  paymentRef = null,
  subtotal = 0,
  shipping = 0,
  tax = 0,
  total = 0,
  currency = 'USD',
}) {
  // Identify the logged-in user (orders are tied to auth.users via RLS).
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to place an order.');

  // 1) Insert the order.
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'paid',
      payment_method: paymentMethod,
      payment_ref: paymentRef,
      currency,
      subtotal,
      shipping,
      tax,
      total,
      shipping_address: shippingAddress,
    })
    .select()
    .single();
  if (orderError) throw orderError;

  // 2) Insert the order items.
  const items = cartItems.map((item) => ({
    order_id: order.id,
    product_id: isUuid(item.id) ? item.id : null,
    name: item.name,
    storage: item.storage || null,
    unit_price: Number((item.price * (1 - (item.discount || 0))).toFixed(2)),
    quantity: item.quantity || 1,
    image: typeof item.image === 'string' ? item.image : null,
  }));

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('order_items').insert(items);
    if (itemsError) throw itemsError;
  }

  // 3) Decrement stock (best-effort; ignore failures for non-DB products).
  await Promise.all(
    cartItems
      .filter((item) => isUuid(item.id))
      .map((item) =>
        supabase.rpc('decrement_stock', {
          p_product_id: item.id,
          p_qty: item.quantity || 1,
        })
      )
  ).catch((e) => console.warn('Stock decrement warning:', e?.message));

  return { order, items, userEmail: user.email };
}

/**
 * Fetch the current user's orders (most recent first) with their items.
 */
export async function getMyOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}
