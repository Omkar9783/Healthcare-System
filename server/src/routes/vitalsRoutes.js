import express from 'express';
import { getVitalsByPatient, recordVitals } from '../controllers/vitalsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:patientUid', authenticateToken, getVitalsByPatient);
router.post('/', authenticateToken, recordVitals);

export default router;
