// Замовлення користувача: /api/orders/*  (увесь роутер захищено requireAuth)
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createOrder, listOrders, getOrder } from '../controllers/ordersController.js';

const router = Router();

router.use(requireAuth);

router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);

export default router;
