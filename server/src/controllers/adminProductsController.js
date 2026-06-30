// Адмін-контролер CRUD для товарів (захищено requireAuth + requireAdmin).
// Усі запити параметризовані (prepared statements) → захист від SQL-ін'єкцій.
import { query } from '../db.js';

const SELECT_PRODUCT = `
  SELECT p.id, p.category_id, c.name AS category_name, p.title, p.brand,
         p.description, p.price, p.stock, p.rating, p.image_url, p.created_at
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

// --- серверна валідація вхідних даних товару --------------------------------
async function validateProduct(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  const has = (k) => body[k] !== undefined && body[k] !== null;

  if (!partial || has('title')) {
    const title = String(body.title ?? '').trim();
    if (title.length < 2) errors.push('Title must be at least 2 characters');
    data.title = title;
  }
  if (!partial || has('brand')) {
    data.brand = String(body.brand ?? '').trim();
    if (!partial && data.brand.length === 0) errors.push('Brand is required');
  }
  if (!partial || has('price')) {
    const price = Number(body.price);
    if (Number.isNaN(price) || price < 0) errors.push('Price must be a number ≥ 0');
    data.price = price;
  }
  if (!partial || has('stock')) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) errors.push('Stock must be an integer ≥ 0');
    data.stock = stock;
  }
  if (!partial || has('category_id')) {
    const categoryId = Number(body.category_id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      errors.push('Valid category_id is required');
    } else {
      const cat = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [categoryId]);
      if (cat.length === 0) errors.push(`Category ${categoryId} does not exist`);
    }
    data.category_id = categoryId;
  }
  if (has('description')) data.description = String(body.description ?? '').trim() || null;
  if (has('image_url')) data.image_url = String(body.image_url ?? '').trim() || null;
  if (has('rating')) {
    const rating = Number(body.rating);
    if (Number.isNaN(rating) || rating < 0 || rating > 5) errors.push('Rating must be 0..5');
    data.rating = rating;
  }
  return { errors, data };
}

// GET /api/admin/products?search=
export async function listProducts(req, res, next) {
  try {
    const search = String(req.query.search || '').trim();
    let sql = SELECT_PRODUCT;
    const params = [];
    if (search) {
      sql += ' WHERE p.title LIKE ? OR p.brand LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY p.id DESC';
    const products = await query(sql, params);
    return res.json({ products, total: products.length });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/products
export async function createProduct(req, res, next) {
  try {
    const { errors, data } = await validateProduct(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors.join('; '), errors });

    const result = await query(
      `INSERT INTO products (category_id, title, brand, description, price, stock, rating, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.category_id, data.title, data.brand || '', data.description ?? null,
        data.price, data.stock, data.rating ?? 0, data.image_url ?? '/placeholder.png',
      ],
    );
    const [product] = await query(`${SELECT_PRODUCT} WHERE p.id = ?`, [result.insertId]);
    return res.status(201).json({ product });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/admin/products/:id
export async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Product not found' });

    const { errors, data } = await validateProduct(req.body || {}, { partial: true });
    if (errors.length) return res.status(400).json({ error: errors.join('; '), errors });

    const fields = [];
    const params = [];
    for (const key of ['category_id', 'title', 'brand', 'description', 'price', 'stock', 'rating', 'image_url']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(id);
    await query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);

    const [product] = await query(`${SELECT_PRODUCT} WHERE p.id = ?`, [id]);
    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/admin/products/:id
export async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Product not found' });
    try {
      await query('DELETE FROM products WHERE id = ?', [id]);
    } catch (err) {
      // order_items посилається на товар з ON DELETE RESTRICT
      if (err && err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ error: 'Cannot delete: product is referenced by existing orders' });
      }
      throw err;
    }
    return res.json({ ok: true, id });
  } catch (err) {
    return next(err);
  }
}
