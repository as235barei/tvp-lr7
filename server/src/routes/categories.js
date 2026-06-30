// Публічні категорії: /api/categories
import { Router } from 'express';
import { listPublicCategories } from '../controllers/categoriesController.js';

const router = Router();

router.get('/', listPublicCategories);

export default router;
