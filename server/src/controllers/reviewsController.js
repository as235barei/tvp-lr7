// Контролер відгуків про товари.
//   GET  /api/products/:id/reviews  — публічний: лише схвалені (approved) відгуки;
//   POST /api/products/:id/reviews  — для авторизованих: створює відгук зі
//                                     статусом 'pending' (іде на модерацію).
// Один користувач може залишити лише один відгук на товар (дублі → 409).
import { query } from '../db.js';

// GET /api/products/:id/reviews — лише approved, з іменем автора.
export async function listProductReviews(req, res, next) {
  try {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const reviews = await query(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name AS author
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ? AND r.status = 'approved'
      ORDER BY r.id DESC`, [productId]);
    return res.json({ reviews });
  } catch (err) {
    return next(err);
  }
}

// POST /api/products/:id/reviews  (requireAuth)
// Тіло: { rating: 1..5, comment }. Створює відгук pending → потрапляє в адмін-модерацію.
export async function createReview(req, res, next) {
  try {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const product = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId]);
    if (product.length === 0) return res.status(404).json({ error: 'Product not found' });

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment ?? '').trim();
    const errors = [];
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push('Rating must be an integer from 1 to 5');
    }
    if (comment.length > 0 && comment.length < 3) {
      errors.push('Comment is too short');
    }
    if (errors.length) return res.status(400).json({ error: errors.join('; '), errors });

    // один відгук на товар від користувача
    const dup = await query(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ? LIMIT 1',
      [productId, req.user.id],
    );
    if (dup.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }

    const result = await query(
      "INSERT INTO reviews (product_id, user_id, rating, comment, status) VALUES (?, ?, ?, ?, 'pending')",
      [productId, req.user.id, rating, comment || null],
    );
    const [review] = await query(
      'SELECT id, product_id, rating, comment, status, created_at FROM reviews WHERE id = ?',
      [result.insertId],
    );
    return res.status(201).json({ review });
  } catch (err) {
    return next(err);
  }
}
