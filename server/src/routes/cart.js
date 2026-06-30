// Серверний кошик: /api/cart/*  (увесь роутер захищено requireAuth)
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getCart, addToCart, mergeCart, updateCartItem, removeCartItem, clearCart,
} from '../controllers/cartController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/merge', mergeCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeCartItem);
router.delete('/', clearCart);

export default router;
