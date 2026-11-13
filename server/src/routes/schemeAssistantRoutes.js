import express from 'express';
import multer from 'multer';
import {
  getSchemes,
  getSchemeById,
  getPatientProfile,
  updatePatientProfile,
  uploadSupportingDocument,
  getPatientDocuments,
  evaluateEligibility,
  autofillApplicationForm,
  submitApplication,
  getPatientApplications,
  updateApplicationStatus
} from '../controllers/schemeAssistantController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Multer memory storage configuration for supporting documents (10MB limit)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) or PDFs are supported for document processing.'), false);
    }
  }
});

// 1. Schemes Database
router.get('/schemes', getSchemes);
router.get('/schemes/:schemeId', getSchemeById);

// 2. Patient Scheme Profile
router.get('/profile/:patientUid', authenticateToken, getPatientProfile);
router.put('/profile/:patientUid', authenticateToken, updatePatientProfile);

// 3. Document Upload & OCR Field Extraction
router.post('/upload-document', authenticateToken, upload.single('file'), uploadSupportingDocument);
router.get('/documents/:patientUid', authenticateToken, getPatientDocuments);

// 4. Rule-based Scheme Eligibility Engine
router.post('/evaluate/:patientUid', authenticateToken, evaluateEligibility);

// 5. Auto-Form Filling & Application Management
router.post('/autofill', authenticateToken, autofillApplicationForm);
router.post('/submit-application', authenticateToken, submitApplication);
router.get('/applications/:patientUid', authenticateToken, getPatientApplications);
router.patch('/applications/:applicationId/status', authenticateToken, updateApplicationStatus);

export default router;

