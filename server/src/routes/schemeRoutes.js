import express from 'express';
import {
  getPatientSchemeData,
  verifyRationCard,
  addFamilyMember,
  deleteFamilyMember,
  getEmpanelledHospitals,
  getHealthcarePackages,
  submitHospitalVerificationRequest,
  getHospitalVerificationRequests,
  reviewHospitalVerificationRequest,
  aiSchemeAssistant,
  markNotificationRead,
  getBeneficiaryQRData
} from '../controllers/schemeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/patient/:patientUid', authenticateToken, getPatientSchemeData);
router.post('/verify-ration-card', authenticateToken, verifyRationCard);
router.post('/family', authenticateToken, addFamilyMember);
router.delete('/family/:memberId', authenticateToken, deleteFamilyMember);
router.get('/hospitals', getEmpanelledHospitals);
router.get('/packages', getHealthcarePackages);
router.post('/hospital-verification-request', authenticateToken, submitHospitalVerificationRequest);
router.get('/hospital-requests', authenticateToken, getHospitalVerificationRequests);
router.patch('/hospital-requests/:requestId', authenticateToken, reviewHospitalVerificationRequest);
router.post('/ai-assist', authenticateToken, aiSchemeAssistant);
router.patch('/notifications/:notificationId/read', authenticateToken, markNotificationRead);
router.get('/beneficiary-qr/:patientUid', authenticateToken, getBeneficiaryQRData);

export default router;
