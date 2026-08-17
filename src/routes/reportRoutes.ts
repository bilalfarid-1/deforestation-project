import { Router } from 'express';
import {
  analyzeArea,
  saveReport,
  getReports,
  getReportById,
  deleteReport
} from '../controllers/reportController.js';

const router = Router();

// @route   POST /api/reports/analyze
// @desc    Run bi-temporal satellite deforestation detection
router.post('/analyze', analyzeArea);

// @route   POST /api/reports
// @desc    Save an analysis report to history
router.post('/', saveReport);

// @route   GET /api/reports
// @desc    Get all saved analysis reports (history)
router.get('/', getReports);

// @route   GET /api/reports/:id
// @desc    Get a specific report by ID
router.get('/:id', getReportById);

// @route   DELETE /api/reports/:id
// @desc    Delete a report by ID
router.delete('/:id', deleteReport);

export default router;
