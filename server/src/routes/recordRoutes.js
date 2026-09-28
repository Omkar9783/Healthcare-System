import express from 'express';
import { getRecordsByPatient, createRecord } from '../controllers/recordController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:patientUid', authenticateToken, getRecordsByPatient);
router.post('/', authenticateToken, createRecord);

export default router;
