import express from 'express';
import { getPatientsList, getPatientByUid } from '../controllers/patientController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getPatientsList);
router.get('/:uid', authenticateToken, getPatientByUid);

export default router;
