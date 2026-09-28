import express from 'express';
import { getPrescriptions, createPrescription, updateDispensingStatus } from '../controllers/prescriptionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getPrescriptions);
router.post('/', authenticateToken, createPrescription);
router.put('/:id/dispense', authenticateToken, updateDispensingStatus);

export default router;
