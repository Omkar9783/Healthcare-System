import mongoose from 'mongoose';

const attachedDocSchema = new mongoose.Schema({
  docType: { type: String, required: true },
  docId: { type: String, required: true },
  fileName: { type: String, required: true },
  verified: { type: Boolean, default: true }
}, { _id: false });

const schemeApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  schemeId: { type: String, required: true, index: true },
  schemeName: { type: String, required: true },
  formData: { type: mongoose.Schema.Types.Mixed, default: {} },
  missingFields: [{ type: String }],
  attachedDocuments: [attachedDocSchema],
  userConsent: {
    approvedByUser: { type: Boolean, default: true },
    consentTimestamp: { type: Date, default: Date.now },
    userDeclaration: { 
      type: String, 
      default: 'I hereby confirm that all information provided is accurate to the best of my knowledge and give explicit consent for saving and processing my application.'
    }
  },
  applicationStatus: {
    type: String,
    enum: [
      'DRAFT',
      'READY_FOR_PORTAL_SUBMISSION',
      'SUBMITTED_TO_DESK',
      'UNDER_OFFICIAL_REVIEW',
      'APPROVED_OFFICIALLY',
      'REJECTED_OFFICIALLY'
    ],
    default: 'DRAFT',
    index: true
  },
  officialPortalUrl: { type: String, default: '' },
  officialReferenceNumber: { type: String, default: '' },
  deskNotes: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('SchemeApplication', schemeApplicationSchema);

