import mongoose from 'mongoose';

const verificationRequestSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String, default: '' },
  hospitalId: { type: String, required: true },
  hospitalName: { type: String, required: true },
  schemeName: { type: String, required: true },
  rationCardNumber: { type: String, required: true }, // Masked e.g. XXXX-XXXX-1234
  rationCardType: { type: String, required: true },
  documentUrl: { type: String, default: '' },
  treatmentCategory: { type: String, default: 'General Healthcare' },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'ADDITIONAL_DOCS_REQUIRED'],
    default: 'PENDING' 
  },
  remarks: { type: String, default: 'Pending administrative evaluation by empanelled desk.' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: String, default: null }
});

export default mongoose.model('VerificationRequest', verificationRequestSchema);
