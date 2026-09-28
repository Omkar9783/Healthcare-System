import express from 'express';
import { getConsents, createConsent, revokeConsent } from '../controllers/consentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getConsents);
router.post('/', authenticateToken, createConsent);
router.post('/:id/revoke', authenticateToken, revokeConsent);

export default router;
