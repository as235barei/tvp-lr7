// Виклики публічних і користувацьких ендпоінтів вітрини (/api/products,
// /api/categories, /api/cart, /api/orders, /api/products/:id/reviews) через
// спільний fetch-клієнт. Публічні запити йдуть без токена (auth:false), решта —
// з Bearer-токеном (додається автоматично у api/client.js).
import { api } from './client';

// --- нормалізація ----------------------------------------------------------
// MySQL повертає DECIMAL як рядок ("1199.00") — приводимо ціни/рейтинг до Number.
// Каталог/картка товару з ЛР3 очікують поля category(slug), shortDesc, specs,
// inStock, units, image — мапимо запис БД у цю форму, щоб зберегти весь UX.
export function normalizeProduct(p) {
  if (!p) return null;
  const price = Number(p.price);
  const rating = Number(p.rating);
  const stock = Number(p.stock);
  return {
    id: p.id,
    title: p.title,
    brand: p.brand,
    category: p.category_slug || p.category || '',
    categoryName: p.category_name || '',
    price,
    rating,
    shortDesc: p.description || '',
    description: p.description || '',
    specs: { Brand: p.brand, Category: p.category_name || p.category_slug || '—' },
    inStock: stock > 0,
    units: stock,
    stock,
    image: p.image_url || '/placeholder.png',
    reviewsCount: Number(p.reviews_count || 0),
  };
}

// Позиція серверного кошика → форма, з якою працює CartContext.
export function normalizeCartItem(it) {
  return {
    id: it.id,
    title: it.title,
    price: Number(it.price),
    image: it.image || '/placeholder.png',
    qty: Number(it.qty),
    stock: Number(it.stock),
    category: it.category,
  };
}

// Зібрати query-рядок з непорожніх фільтрів.
function toQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const shopApi = {
  // --- публічне (гість) ---
  listProducts: async (filters = {}) => {
    const data = await api.get(`/api/products${toQuery(filters)}`, { auth: false });
    return { ...data, products: (data.products || []).map(normalizeProduct) };
  },
  getProduct: async (id) => {
    const { product } = await api.get(`/api/products/${id}`, { auth: false });
    return normalizeProduct(product);
  },
  listCategories: () => api.get('/api/categories', { auth: false }),
  listReviews: (productId) =>
    api.get(`/api/products/${productId}/reviews`, { auth: false }).then((d) => d.reviews || []),

  // --- користувацьке (requireAuth) ---
  addReview: (productId, payload) => api.post(`/api/products/${productId}/reviews`, payload),

  getCart: () => api.get('/api/cart').then((d) => (d.items || []).map(normalizeCartItem)),
  addToCart: (productId, qty = 1) =>
    api.post('/api/cart', { productId, qty }).then((d) => (d.items || []).map(normalizeCartItem)),
  mergeCart: (items) =>
    api.post('/api/cart/merge', { items }).then((d) => (d.items || []).map(normalizeCartItem)),
  updateCartItem: (productId, qty) =>
    api.put(`/api/cart/${productId}`, { qty }).then((d) => (d.items || []).map(normalizeCartItem)),
  removeCartItem: (productId) =>
    api.del(`/api/cart/${productId}`).then((d) => (d.items || []).map(normalizeCartItem)),
  clearCart: () => api.del('/api/cart').then((d) => (d.items || []).map(normalizeCartItem)),

  createOrder: (payload) => api.post('/api/orders', payload).then((d) => d.order),
  listOrders: () => api.get('/api/orders').then((d) => d.orders || []),
  getOrder: (id) => api.get(`/api/orders/${id}`).then((d) => d.order),
};

export default shopApi;
