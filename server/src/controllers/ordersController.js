// Замовлення авторизованого користувача (checkout + історія). requireAuth.
//   POST /api/orders      — оформлення: бере позиції з тіла або з кошика користувача,
//                           рахує total за ЦІНАМИ З БД, створює orders + order_items
//                           у транзакції та очищає кошик;
//   GET  /api/orders      — історія замовлень користувача;
//   GET  /api/orders/:id  — деталі замовлення (лише власні).
import { pool, query } from '../db.js';

// Зібрати позиції замовлення: або з тіла { items:[{productId, qty}] },
// або з серверного кошика користувача. Ціни завжди беруться з БД.
async function resolveItems(conn, userId, bodyItems) {
  let source = [];
  if (Array.isArray(bodyItems) && bodyItems.length > 0) {
    source = bodyItems
      .map((it) => ({ productId: Number(it.productId ?? it.id), qty: Math.max(1, Math.trunc(Number(it.qty) || 1)) }))
      .filter((it) => Number.isInteger(it.productId) && it.productId > 0);
  } else {
    const [cart] = await conn.execute(
      'SELECT product_id AS productId, qty FROM cart_items WHERE user_id = ?',
      [userId],
    );
    source = cart.map((c) => ({ productId: Number(c.productId), qty: Number(c.qty) }));
  }
  if (source.length === 0) return { items: [], total: 0 };

  // Підтягнути актуальні ціни/назви з БД.
  const ids = source.map((s) => s.productId);
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await conn.execute(
    `SELECT id, title, price FROM products WHERE id IN (${placeholders})`,
    ids,
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  const items = [];
  let total = 0;
  for (const s of source) {
    const prod = byId.get(s.productId);
    if (!prod) continue; // пропускаємо неіснуючі товари
    const price = Number(prod.price);
    items.push({ productId: s.productId, title: prod.title, qty: s.qty, price });
    total += price * s.qty;
  }
  return { items, total: Number(total.toFixed(2)) };
}

// POST /api/orders { address, items? }
export async function createOrder(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const address = String(req.body?.address ?? '').trim();
    if (address.length < 5) {
      conn.release();
      return res.status(400).json({ error: 'A delivery address (at least 5 characters) is required' });
    }

    await conn.beginTransaction();

    const { items, total } = await resolveItems(conn, req.user.id, req.body?.items);
    if (items.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Cannot place an order with an empty cart' });
    }

    const [orderRes] = await conn.execute(
      "INSERT INTO orders (user_id, status, total, address) VALUES (?, 'new', ?, ?)",
      [req.user.id, total, address],
    );
    const orderId = orderRes.insertId;

    for (const it of items) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)',
        [orderId, it.productId, it.qty, it.price],
      );
    }

    // Кошик користувача очищується після успішного оформлення.
    await conn.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    await conn.commit();
    conn.release();

    const order = await fetchOrder(req.user.id, orderId);
    return res.status(201).json({ order });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    conn.release();
    return next(err);
  }
}

// Завантажити замовлення користувача разом із позиціями.
async function fetchOrder(userId, orderId) {
  const rows = await query(
    `SELECT id, user_id, status, total, address, created_at
     FROM orders WHERE id = ? AND user_id = ? LIMIT 1`,
    [orderId, userId],
  );
  if (rows.length === 0) return null;
  const items = await query(
    `SELECT oi.id, oi.product_id, p.title AS product_title, oi.qty, oi.price,
            (oi.qty * oi.price) AS line_total
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId],
  );
  return { ...rows[0], items };
}

// GET /api/orders — історія користувача (з лічильником і коротким переліком товарів).
export async function listOrders(req, res, next) {
  try {
    const orders = await query(`
      SELECT o.id, o.status, o.total, o.address, o.created_at,
             COUNT(oi.id) AS item_count,
             GROUP_CONCAT(p.title ORDER BY oi.id SEPARATOR ', ') AS items_preview
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = ?
      GROUP BY o.id, o.status, o.total, o.address, o.created_at
      ORDER BY o.id DESC`, [req.user.id]);
    return res.json({ orders });
  } catch (err) {
    return next(err);
  }
}

// GET /api/orders/:id — деталі (лише власне замовлення).
export async function getOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid order id' });
    }
    const order = await fetchOrder(req.user.id, id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
}
