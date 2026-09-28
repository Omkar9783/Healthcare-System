import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema({
  patientUid: { type: String, required: true, index: true },
  grantedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  grantedToName: { type: String, required: true },
  grantedToRole: { type: String, required: true },
  resourceType: { 
    type: String, 
    enum: ['ALL', 'MEDICAL_RECORDS', 'PRESCRIPTIONS', 'LAB_REPORTS', 'VITALS'],
    default: 'ALL'
  },
  purpose: { type: String, required: true }, // e.g. "Consultation", "Second Opinion", "Follow-up"
  durationHours: { type: Number, required: true, default: 48 },
  expiresAt: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'REVOKED', 'EXPIRED'], 
    default: 'ACTIVE' 
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Consent', consentSchema);
