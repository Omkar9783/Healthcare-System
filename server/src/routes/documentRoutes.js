import express from 'express';
import multer from 'multer';
import {
  uploadAndVerifyDocument,
  getPatientVerifications,
  getAllVerifications,
  reviewVerification,
  getAIHealthStatus
} from '../controllers/documentVerificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer memory storage with 10MB limit
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are supported for AI Document Verification.'), false);
    }
  }
});

// Verification and Processing Routes
router.post('/verify', authenticateToken, upload.single('file'), uploadAndVerifyDocument);
router.get('/patient/:patientUid', authenticateToken, getPatientVerifications);
router.get('/admin/all', authenticateToken, getAllVerifications);
router.patch('/review/:verificationId', authenticateToken, reviewVerification);
router.get('/health', getAIHealthStatus);

export default router;
