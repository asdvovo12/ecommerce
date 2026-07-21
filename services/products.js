// services/products.js
// Loads the product catalog from Supabase, with a graceful fallback to the
// local ProductData.js so the app still shows products if the DB is empty or
// unreachable during development.

import { supabase } from '../supabaseClient';
import { allProducts as localProducts } from '../ProductData';

/**
 * Fetch active products from Supabase. Returns an array normalized to the same
 * shape the UI already expects. Falls back to local data on any error/empty.
 */
export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return localProducts;

    return data.map(normalizeProduct);
  } catch (e) {
    console.warn('fetchProducts: falling back to local catalog:', e?.message);
    return localProducts;
  }
}

export async function fetchProductById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return normalizeProduct(data);
  } catch (e) {
    return localProducts.find((p) => String(p.id) === String(id)) || null;
  }
}

// Map a DB row to the shape used across the app (see ProductData.js).
function normalizeProduct(row) {
  const storagePricing = row.storage_pricing || {};
  const storageOptions = row.storage_options || [];
  const defaultPrice =
    row.price ||
    (storageOptions.length ? storagePricing[storageOptions[0]] : 0) ||
    0;

  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    description: row.description,
    category: row.category,
    price: defaultPrice,
    discount: row.discount || 0,
    stock: row.stock,
    storageOptions,
    storagePricing,
    images: (row.images || []).map((uri) =>
      typeof uri === 'string' ? { uri } : uri
    ),
  };
}
