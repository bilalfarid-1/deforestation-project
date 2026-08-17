import { Router } from 'express';
import { getNews } from '../controllers/newsController.js';

const router = Router();

// @route   GET /api/news
// @desc    Retrieve deforestation news with multi-criteria filtering
router.get('/', getNews);

export default router;
