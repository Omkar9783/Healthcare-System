import mongoose from 'mongoose';

const applicationDocumentSchema = new mongoose.Schema({
  docId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  applicationId: { type: String, default: null, index: true },
  docType: {
    type: String,
    enum: [
      'aadhaar_card',
      'ration_card',
      'income_certificate',
      'caste_certificate',
      'disability_certificate',
      'birth_certificate',
      'bank_passbook',
      'other'
    ],
    required: true
  },
  docName: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: 'image/png' },
  fileHash: { type: String, default: '' },
  ocrExtractedFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  verificationStatus: {
    type: String,
    enum: ['DETECTED', 'OCR_EXTRACTED', 'VERIFIED', 'REJECTED', 'MANUAL_REVIEW'],
    default: 'OCR_EXTRACTED'
  },
  confidenceScore: { type: Number, default: 0.90 },
  userConsent: { type: Boolean, default: true },
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model('ApplicationDocument', applicationDocumentSchema);

