// Адмін-контролер модерації відгуків: список з фільтром, схвалення, видалення.
import { query } from '../db.js';

const REVIEW_STATUSES = ['pending', 'approved'];

// GET /api/admin/reviews?status=pending|approved
export async function listReviews(req, res, next) {
  try {
    const status = String(req.query.status || '').trim();
    let sql = `
      SELECT r.id, r.product_id, p.title AS product_title,
             r.user_id, u.name AS user_name, u.email AS user_email,
             r.rating, r.comment, r.status, r.created_at
      FROM reviews r
      JOIN products p ON p.id = r.product_id
      JOIN users u ON u.id = r.user_id`;
    const params = [];
    if (status && REVIEW_STATUSES.includes(status)) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY r.id DESC';
    const reviews = await query(sql, params);
    return res.json({ reviews, statuses: REVIEW_STATUSES });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/admin/reviews/:id/approve  (pending → approved)
export async function approveReview(req, res, next) {
  try {
    const id = Number(req.params.id);
    const rows = await query('SELECT id FROM reviews WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Review not found' });

    await query("UPDATE reviews SET status = 'approved' WHERE id = ?", [id]);
    const [review] = await query('SELECT id, status FROM reviews WHERE id = ?', [id]);
    return res.json({ review });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/admin/reviews/:id
export async function deleteReview(req, res, next) {
  try {
    const id = Number(req.params.id);
    const rows = await query('SELECT id FROM reviews WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Review not found' });

    await query('DELETE FROM reviews WHERE id = ?', [id]);
    return res.json({ ok: true, id });
  } catch (err) {
    return next(err);
  }
}
