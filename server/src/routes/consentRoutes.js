import express from 'express';
import { getConsents, createConsent, revokeConsent } from '../controllers/consentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getConsents);
router.get('/:patientUid', authenticateToken, getConsents);
router.post('/', authenticateToken, createConsent);
router.post('/grant', authenticateToken, createConsent);
router.post('/:id/revoke', authenticateToken, revokeConsent);
router.delete('/:id', authenticateToken, revokeConsent);
router.delete('/revoke/:id', authenticateToken, revokeConsent);

export default router;
