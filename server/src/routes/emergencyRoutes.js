import express from 'express';
import { requestEmergencyAccess, getEmergencyStatus } from '../controllers/emergencyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/access', authenticateToken, requestEmergencyAccess);
router.get('/status/:patientUid', authenticateToken, getEmergencyStatus);

export default router;
