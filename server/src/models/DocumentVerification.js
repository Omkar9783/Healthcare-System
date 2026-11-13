import mongoose from 'mongoose';

const documentVerificationSchema = new mongoose.Schema({
  verificationId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  documentType: { 
    type: String, 
    enum: ['aadhaar_front', 'aadhaar_back', 'ration_front', 'ration_back', 'other_document', 'unknown'],
    required: true 
  },
  side: { type: String, enum: ['front', 'back', 'unknown'], default: 'front' },
  detectionConfidence: { type: Number, default: 0.0 },

  // Requirement 11 & 15: Independent Verification Flags
  documentDetectionStatus: { type: String, default: 'NOT_CHECKED' },
  ocrStatus: { type: String, default: 'NOT_CHECKED' },
  qrStatus: { type: String, default: 'NOT_CHECKED' },
  signatureStatus: { type: String, default: 'NOT_CHECKED' },
  officialVerificationStatus: { type: String, default: 'NOT_CHECKED' },
  dataMatchStatus: { type: String, default: 'NOT_CHECKED' },
  anomalyStatus: { type: String, default: 'NOT_CHECKED' },

  // Central Decision Engine Status
  verificationStatus: {
    type: String,
    enum: ['VERIFIED', 'NOT_VERIFIED', 'PENDING', 'MANUAL_REVIEW', 'UNSUPPORTED_DOCUMENT', 'ANOMALY_DETECTED_REQUIRES_REVIEW'],
    default: 'PENDING',
    index: true
  },

  // Manual Review Workflow (Requirement 14 & 15)
  reviewStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'NONE'],
    default: 'NONE'
  },
  reviewedBy: { type: String, default: null }, // Admin user id or name
  reviewReason: { type: String, default: null },
  reviewedAt: { type: Date, default: null },

  // Extracted demographics (Always masked identity numbers)
  maskedIdNumber: { type: String, default: '' },
  extractedData: {
    name: { type: String, default: null },
    dob: { type: String, default: null },
    gender: { type: String, default: null },
    address: { type: String, default: null },
    state: { type: String, default: null },
    district: { type: String, default: null },
    cardType: { type: String, default: null },
    fairPriceShopNo: { type: String, default: null },
    familyMembersCount: { type: Number, default: 0 },
    qrDataType: { type: String, default: null }
  },

  // Security & Anomalies
  anomalyDetails: {
    isBlurred: { type: Boolean, default: false },
    blurScore: { type: Number, default: 0 },
    isLowResolution: { type: Boolean, default: false },
    dimensions: [Number],
    boundaryDetected: { type: Boolean, default: true },
    anomalies: [String]
  },

  // Demographic Matching Scores
  patientMatchDetails: {
    nameMatchScore: { type: Number, default: 0 },
    dobMatched: { type: Boolean, default: false },
    genderMatched: { type: Boolean, default: false },
    overallMatchScore: { type: Number, default: 0 },
    notes: [String]
  },

  // Automatically determined health schemes based on scanned ration card
  eligibleSchemes: [{
    schemeName: { type: String, required: true },
    schemeFullName: { type: String, required: true },
    eligibilityStatus: { type: String, required: true },
    eligibilityReason: { type: String, required: true },
    coverageAmount: { type: String, default: '₹5,00,000 per family per year' },
    officialPortalUrl: { type: String, default: '' },
    proceduresCount: { type: Number, default: 1356 },
    benefits: [String],
    samplePackages: [{
      packageName: String,
      category: String,
      coverageDetails: String
    }]
  }],

  empanelledHospitals: [{
    hospitalName: String,
    city: String,
    contactPhone: String,
    schemes: [String]
  }],

  decisionReasons: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('DocumentVerification', documentVerificationSchema);
