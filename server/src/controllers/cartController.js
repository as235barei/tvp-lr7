// Серверний кошик авторизованого користувача (таблиця cart_items).
// Усі ендпоінти захищені requireAuth, тому кошик завжди прив'язаний до req.user.id.
//   GET    /api/cart                — позиції кошика з даними товару;
//   POST   /api/cart                — додати товар { productId, qty } (інкремент);
//   POST   /api/cart/merge          — злити локальний кошик гостя { items:[...] };
//   PUT    /api/cart/:productId     — встановити кількість { qty };
//   DELETE /api/cart/:productId     — видалити позицію;
//   DELETE /api/cart                — очистити кошик.
import { query } from '../db.js';

const MAX_QTY = 10;
const clampQty = (n) => Math.max(1, Math.min(MAX_QTY, Math.trunc(Number(n) || 1)));

// Поточний кошик користувача у зручному для клієнта вигляді.
async function loadCart(userId) {
  return query(`
    SELECT ci.product_id AS id, p.title, p.price, p.image_url AS image,
           p.stock, c.slug AS category, ci.qty
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE ci.user_id = ?
    ORDER BY ci.id ASC`, [userId]);
}

// Додати/збільшити одну позицію (upsert із клампом 1..10). Повертає нову кількість.
async function upsertItem(userId, productId, qty) {
  const prod = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId]);
  if (prod.length === 0) return { ok: false, error: `Product ${productId} not found` };

  const existing = await query(
    'SELECT qty FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1',
    [userId, productId],
  );
  if (existing.length > 0) {
    const newQty = clampQty(existing[0].qty + qty);
    await query('UPDATE cart_items SET qty = ? WHERE user_id = ? AND product_id = ?',
      [newQty, userId, productId]);
  } else {
    await query('INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?)',
      [userId, productId, clampQty(qty)]);
  }
  return { ok: true };
}

// GET /api/cart
export async function getCart(req, res, next) {
  try {
    const items = await loadCart(req.user.id);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

// POST /api/cart { productId, qty }
export async function addToCart(req, res, next) {
  try {
    const productId = Number(req.body?.productId);
    const qty = clampQty(req.body?.qty ?? 1);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Valid productId is required' });
    }
    const result = await upsertItem(req.user.id, productId, qty);
    if (!result.ok) return res.status(404).json({ error: result.error });

    const items = await loadCart(req.user.id);
    return res.status(201).json({ items });
  } catch (err) {
    return next(err);
  }
}

// POST /api/cart/merge { items: [{ productId, qty }] }
// Зливає локальний кошик гостя на сервер при вході.
export async function mergeCart(req, res, next) {
  try {
    const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
    for (const it of incoming) {
      const productId = Number(it.productId ?? it.id);
      const qty = clampQty(it.qty ?? 1);
      if (Number.isInteger(productId) && productId > 0) {
        await upsertItem(req.user.id, productId, qty);
      }
    }
    const items = await loadCart(req.user.id);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/cart/:productId { qty }
export async function updateCartItem(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    const qty = clampQty(req.body?.qty);
    const existing = await query(
      'SELECT id FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1',
      [req.user.id, productId],
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Cart item not found' });

    await query('UPDATE cart_items SET qty = ? WHERE user_id = ? AND product_id = ?',
      [qty, req.user.id, productId]);
    const items = await loadCart(req.user.id);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/cart/:productId
export async function removeCartItem(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    await query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]);
    const items = await loadCart(req.user.id);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/cart — очистити весь кошик
export async function clearCart(req, res, next) {
  try {
    await query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    return res.json({ items: [] });
  } catch (err) {
    return next(err);
  }
}
