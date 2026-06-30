// Маршрути автентифікації: /api/auth/*
import { Router } from 'express';
import { register, login, me, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me); // захищений маршрут

export default router;
