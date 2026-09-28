import express from 'express';
import { getLabReports, createTestRequest, updateLabReportResults } from '../controllers/labController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getLabReports);
router.post('/request', authenticateToken, createTestRequest);
router.put('/:id/results', authenticateToken, updateLabReportResults);

export default router;
