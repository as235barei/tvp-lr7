// Публічний контролер каталогу (без авторизації).
// Список товарів із динамічними фільтрами/пошуком/сортуванням через query-параметри
// та деталі окремого товару. Усі запити параметризовані (prepared statements).
import { query } from '../db.js';

// Базова вибірка товару разом із назвою та slug категорії.
const SELECT_PRODUCT = `
  SELECT p.id, p.category_id, c.name AS category_name, c.slug AS category_slug,
         p.title, p.brand, p.description, p.price, p.stock, p.rating,
         p.image_url, p.created_at
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

// Дозволені варіанти сортування (whitelist — ORDER BY не можна параметризувати).
const SORTS = {
  popular: 'p.rating DESC, p.id ASC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  rating: 'p.rating DESC',
  name: 'p.title ASC',
};

// GET /api/products?category=&brand=&q=&minPrice=&maxPrice=&sort=&inStock=
// Повертає список товарів за фільтрами + (за наявності фільтра категорії) її назву.
export async function listProducts(req, res, next) {
  try {
    const { category, brand, q, minPrice, maxPrice, sort, inStock } = req.query;

    const where = [];
    const params = [];

    if (category) {
      where.push('c.slug = ?');
      params.push(String(category));
    }
    if (brand) {
      where.push('p.brand = ?');
      params.push(String(brand));
    }
    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`;
      where.push('(p.title LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)');
      params.push(like, like, like);
    }
    if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(Number(minPrice))) {
      where.push('p.price >= ?');
      params.push(Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
      where.push('p.price <= ?');
      params.push(Number(maxPrice));
    }
    if (inStock === '1' || inStock === 'true') {
      where.push('p.stock > 0');
    }

    let sql = SELECT_PRODUCT;
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ` ORDER BY ${SORTS[sort] || SORTS.popular}`;

    const products = await query(sql, params);

    // Назва категорії, якщо застосовано фільтр за slug.
    let categoryName = null;
    if (category) {
      const rows = await query('SELECT name FROM categories WHERE slug = ? LIMIT 1', [String(category)]);
      categoryName = rows[0]?.name || null;
    }

    return res.json({ products, total: products.length, category: categoryName });
  } catch (err) {
    return next(err);
  }
}

// GET /api/products/:id — деталі товару з назвою категорії та кількістю
// схвалених відгуків.
export async function getProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const [product] = await query(`${SELECT_PRODUCT} WHERE p.id = ? LIMIT 1`, [id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const [{ reviews_count: reviewsCount }] = await query(
      "SELECT COUNT(*) AS reviews_count FROM reviews WHERE product_id = ? AND status = 'approved'",
      [id],
    );

    return res.json({ product: { ...product, reviews_count: reviewsCount } });
  } catch (err) {
    return next(err);
  }
}
