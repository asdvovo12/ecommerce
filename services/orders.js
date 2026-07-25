// services/orders.js
// Persists orders to Supabase and decrements stock atomically.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';

const LOCAL_ORDERS_KEY = 'localOrders';

/**
 * Save an order on the device only (used in DEMO_MODE, or when Supabase is
 * unreachable / the user is not signed in). Same shape as a Supabase order row
 * so Order.js can render it without any change.
 */
export async function createLocalOrder({
  cartItems = [],
  shippingAddress = null,
  paymentMethod = 'demo',
  paymentRef = null,
  subtotal = 0,
  shipping = 0,
  tax = 0,
  total = 0,
  currency = 'USD',
}) {
  const now = new Date().toISOString();
  const orderId = `demo-${Date.now()}`;

  const items = cartItems.map((item, index) => ({
    id: `${orderId}-${index}`,
    order_id: orderId,
    product_id: isUuid(item.id) ? item.id : null,
    name: item.name,
    storage: item.storage || null,
    unit_price: Number(
      (Number(item.price || 0) * (1 - Number(item.discount || 0))).toFixed(2)
    ),
    quantity: item.quantity || 1,
    image: typeof item.image === 'string' ? item.image : null,
  }));

  const order = {
    id: orderId,
    created_at: now,
    status: 'paid',
    payment_method: paymentMethod,
    payment_ref: paymentRef,
    currency,
    subtotal,
    shipping,
    tax,
    total,
    shipping_address: shippingAddress,
    is_local: true,
    order_items: items,
  };

  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(order);
    await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to save local order:', e && e.message);
  }

  let userEmail = null;
  try {
    const { data } = await supabase.auth.getUser();
    userEmail = data?.user?.email || null;
  } catch (e) {}

  return { order, items, userEmail };
}

/** Read the orders that were saved on the device. */
export async function getLocalOrders() {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

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
  const local = await getLocalOrders();

  let remote = [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    remote = data || [];
  } catch (e) {
    // Not signed in / tables missing / offline: still show local orders
    console.warn('Remote orders unavailable:', e && e.message);
    if (local.length === 0) throw e;
  }

  return [...local, ...remote].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
}

function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}