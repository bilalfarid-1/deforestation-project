import { Router } from 'express';
import { sendComplaint } from '../controllers/complaintController.js';

const router = Router();

// @route   POST /api/send-complaint
// @desc    Dispatch official complaint notice email
router.post('/', sendComplaint);

export default router;
