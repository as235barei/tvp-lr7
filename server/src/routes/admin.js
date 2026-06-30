// Адмін-API: /api/admin/*
// Увесь маршрутизатор захищено двома middleware:
//   requireAuth  — потрібен дійсний JWT (інакше 401);
//   requireAdmin — потрібна роль 'admin' (інакше 403).
// Тому будь-який ендпоінт нижче недоступний гостям і звичайним користувачам.
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

import { getStats } from '../controllers/adminStatsController.js';
import {
  listProducts, createProduct, updateProduct, deleteProduct,
} from '../controllers/adminProductsController.js';
import {
  listCategories, createCategory, updateCategory, deleteCategory,
} from '../controllers/adminCategoriesController.js';
import {
  listOrders, getOrder, updateOrderStatus,
} from '../controllers/adminOrdersController.js';
import {
  listUsers, updateUserRole, deleteUser,
} from '../controllers/adminUsersController.js';
import {
  listReviews, approveReview, deleteReview,
} from '../controllers/adminReviewsController.js';

const router = Router();

// Глобальний захист усього адмін-API.
router.use(requireAuth, requireAdmin);

// Dashboard
router.get('/stats', getStats);

// Products
router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Categories
router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Orders
router.get('/orders', listOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', updateOrderStatus);

// Users
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Reviews moderation
router.get('/reviews', listReviews);
router.patch('/reviews/:id/approve', approveReview);
router.delete('/reviews/:id', deleteReview);

export default router;
