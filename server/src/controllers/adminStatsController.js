// Адмін-контролер статистики для дашборду.
import { query } from '../db.js';

// GET /api/admin/stats — зведені лічильники + останні замовлення
export async function getStats(_req, res, next) {
  try {
    const [[{ products }], [{ categories }], [{ users }], [{ orders }],
           [{ pendingReviews }], [{ revenue }]] = await Promise.all([
      query('SELECT COUNT(*) AS products FROM products'),
      query('SELECT COUNT(*) AS categories FROM categories'),
      query('SELECT COUNT(*) AS users FROM users'),
      query('SELECT COUNT(*) AS orders FROM orders'),
      query("SELECT COUNT(*) AS pendingReviews FROM reviews WHERE status = 'pending'"),
      // дохід рахуємо за сплаченими/виконаними замовленнями
      query("SELECT COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status <> 'cancelled'"),
    ]);

    const recentOrders = await query(`
      SELECT o.id, u.name AS user_name, o.status, o.total, o.created_at
      FROM orders o JOIN users u ON u.id = o.user_id
      ORDER BY o.id DESC
      LIMIT 5`);

    const ordersByStatus = await query(`
      SELECT status, COUNT(*) AS count FROM orders GROUP BY status`);

    return res.json({
      stats: {
        products,
        categories,
        users,
        orders,
        pendingReviews,
        revenue: Number(revenue),
      },
      recentOrders,
      ordersByStatus,
    });
  } catch (err) {
    return next(err);
  }
}
