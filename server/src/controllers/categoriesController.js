// Публічний контролер категорій (без авторизації) — для фільтрів вітрини.
import { query } from '../db.js';

// GET /api/categories — список категорій із лічильником товарів.
export async function listPublicCategories(_req, res, next) {
  try {
    const categories = await query(`
      SELECT c.id, c.name, c.slug, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.id ASC`);
    return res.json({ categories });
  } catch (err) {
    return next(err);
  }
}
