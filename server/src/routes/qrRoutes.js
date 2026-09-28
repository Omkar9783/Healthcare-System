import express from 'express';
import { generateQR, validateQR, revokeQR } from '../controllers/qrController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', authenticateToken, generateQR);
router.post('/validate', authenticateToken, validateQR);
router.post('/revoke', authenticateToken, revokeQR);

export default router;
