import mongoose from 'mongoose';

const rationCardVerificationSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  maskedRationCardNumber: { type: String, required: true },
  encryptedRationCardNumber: { type: String, required: true },
  rationCardType: { 
    type: String, 
    enum: ['Yellow', 'Orange', 'White', 'Antyodaya (AAY)', 'Annapurna', 'Other'],
    required: true 
  },
  headOfFamilyName: { type: String, required: true },
  state: { type: String, default: 'Maharashtra' },
  district: { type: String, default: 'Mumbai' },
  mobileNumber: { type: String, required: true },
  documentUrl: { type: String, default: '' },
  familyMembersCount: { type: Number, default: 4 },
  verificationStatus: { 
    type: String, 
    enum: ['Verified', 'Pending Verification', 'Unable to Verify'],
    default: 'Pending Verification'
  },
  verificationSource: { type: String, default: 'Preliminary Eligibility Engine' },
  disclaimer: {
    type: String,
    default: 'Preliminary Eligibility Check – Final eligibility must be verified through the official government portal or authorized hospital.'
  },
  verifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('RationCardVerification', rationCardVerificationSchema);
