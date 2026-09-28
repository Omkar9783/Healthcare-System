import express from 'express';
import { getClinicalSummary, getReportSummary, getVitalsTrends } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary/:patientUid', authenticateToken, getClinicalSummary);
router.get('/report/:reportId', authenticateToken, getReportSummary);
router.get('/trends/:patientUid', authenticateToken, getVitalsTrends);

export default router;
