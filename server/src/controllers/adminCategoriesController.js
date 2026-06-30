// Адмін-контролер CRUD для категорій (захищено requireAuth + requireAdmin).
import { query } from '../db.js';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateCategory(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const has = (k) => body[k] !== undefined && body[k] !== null;

  if (!partial || has('name')) {
    data.name = String(body.name ?? '').trim();
    if (data.name.length < 2) errors.push('Name must be at least 2 characters');
  }
  if (!partial || has('slug')) {
    data.slug = String(body.slug ?? '').trim().toLowerCase();
    if (!SLUG_RE.test(data.slug)) errors.push('Slug must be lowercase, words separated by hyphens');
  }
  return { errors, data };
}

// GET /api/admin/categories — список з лічильником товарів
export async function listCategories(_req, res, next) {
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

// POST /api/admin/categories
export async function createCategory(req, res, next) {
  try {
    const { errors, data } = validateCategory(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors.join('; '), errors });

    const dup = await query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [data.slug]);
    if (dup.length) return res.status(409).json({ error: 'Slug is already in use' });

    const result = await query('INSERT INTO categories (name, slug) VALUES (?, ?)', [data.name, data.slug]);
    const [category] = await query('SELECT id, name, slug FROM categories WHERE id = ?', [result.insertId]);
    return res.status(201).json({ category });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/admin/categories/:id
export async function updateCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Category not found' });

    const { errors, data } = validateCategory(req.body || {}, { partial: true });
    if (errors.length) return res.status(400).json({ error: errors.join('; '), errors });

    if (data.slug) {
      const dup = await query('SELECT id FROM categories WHERE slug = ? AND id <> ? LIMIT 1', [data.slug, id]);
      if (dup.length) return res.status(409).json({ error: 'Slug is already in use' });
    }

    const fields = [];
    const params = [];
    for (const key of ['name', 'slug']) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(id);
    await query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);

    const [category] = await query('SELECT id, name, slug FROM categories WHERE id = ?', [id]);
    return res.json({ category });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/admin/categories/:id — заборонено, якщо є товари
export async function deleteCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Category not found' });

    const [{ cnt }] = await query('SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?', [id]);
    if (cnt > 0) {
      return res.status(409).json({ error: `Cannot delete: category still has ${cnt} product(s)` });
    }
    await query('DELETE FROM categories WHERE id = ?', [id]);
    return res.json({ ok: true, id });
  } catch (err) {
    return next(err);
  }
}
