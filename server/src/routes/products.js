// Публічний каталог + відгуки товарів: /api/products/*
// Перегляд каталогу доступний усім (гостям). Створення відгуку — лише авторизованим.
import { Router } from 'express';
import { listProducts, getProduct } from '../controllers/productsController.js';
import { listProductReviews, createReview } from '../controllers/reviewsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Каталог (публічно)
router.get('/', listProducts);
router.get('/:id', getProduct);

// Відгуки товару
router.get('/:id/reviews', listProductReviews);          // публічно: лише approved
router.post('/:id/reviews', requireAuth, createReview);  // авторизовані: pending

export default router;
