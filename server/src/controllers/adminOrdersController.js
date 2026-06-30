// Адмін-контролер замовлень: список, деталі, зміна статусу.
import { query } from '../db.js';

const ORDER_STATUSES = ['new', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

// GET /api/admin/orders?status=
export async function listOrders(req, res, next) {
  try {
    const status = String(req.query.status || '').trim();
    let sql = `
      SELECT o.id, o.user_id, u.name AS user_name, u.email AS user_email,
             o.status, o.total, o.address, o.created_at,
             COUNT(oi.id) AS item_count
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id`;
    const params = [];
    if (status && ORDER_STATUSES.includes(status)) {
      sql += ' WHERE o.status = ?';
      params.push(status);
    }
    sql += ' GROUP BY o.id, o.user_id, u.name, u.email, o.status, o.total, o.address, o.created_at ORDER BY o.id DESC';
    const orders = await query(sql, params);
    return res.json({ orders, statuses: ORDER_STATUSES });
  } catch (err) {
    return next(err);
  }
}

// GET /api/admin/orders/:id — замовлення з позиціями
export async function getOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    const rows = await query(`
      SELECT o.id, o.user_id, u.name AS user_name, u.email AS user_email,
             o.status, o.total, o.address, o.created_at
      FROM orders o JOIN users u ON u.id = o.user_id
      WHERE o.id = ? LIMIT 1`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const items = await query(`
      SELECT oi.id, oi.product_id, p.title AS product_title, oi.qty, oi.price,
             (oi.qty * oi.price) AS line_total
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC`, [id]);

    return res.json({ order: { ...rows[0], items } });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/admin/orders/:id/status
export async function updateOrderStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status || '').trim();
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}` });
    }
    const existing = await query('SELECT id FROM orders WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Order not found' });

    await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    const [order] = await query('SELECT id, status FROM orders WHERE id = ?', [id]);
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
}
