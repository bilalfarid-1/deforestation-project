import { Router } from 'express';
import authRoutes from './authRoutes.js';
import reportRoutes from './reportRoutes.js';
import newsRoutes from './newsRoutes.js';
import communityRoutes from './communityRoutes.js';
import complaintRoutes from './complaintRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
router.use('/news', newsRoutes);
router.use('/community', communityRoutes);
router.use('/send-complaint', complaintRoutes);

// Backwards compatibility alias for /api/contact
router.use('/contact', complaintRoutes);

export default router;
