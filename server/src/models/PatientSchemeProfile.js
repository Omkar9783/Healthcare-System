import mongoose from 'mongoose';

const patientSchemeProfileSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true, index: true },
  demographics: {
    fullName: { type: String, default: '' },
    maskedAadhaar: { type: String, default: '' }, // XXXX-XXXX-1234
    aadhaarHash: { type: String, default: '' },
    dob: { type: String, default: '' },
    age: { type: Number, default: null },
    gender: { type: String, default: '' },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  address: {
    fullAddress: { type: String, default: '' },
    district: { type: String, default: 'Mumbai' },
    state: { type: String, default: 'Maharashtra' },
    pincode: { type: String, default: '' },
    isMaharashtraDomicile: { type: Boolean, default: true },
    yearsResidentInState: { type: Number, default: 15 }
  },
  socioEconomic: {
    rationCardNumber: { type: String, default: '' },
    rationCardType: { 
      type: String, 
      enum: ['Yellow', 'Orange', 'White', 'Antyodaya (AAY)', 'Annapurna', 'None'],
      default: 'None'
    },
    annualIncome: { type: Number, default: null },
    casteCategory: { 
      type: String, 
      enum: ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'Other'],
      default: 'General'
    },
    casteName: { type: String, default: '' },
    isDisabilityApplicable: { type: Boolean, default: false },
    disabilityType: { type: String, default: 'None' },
    disabilityPercentage: { type: Number, default: 0 },
    udidNumber: { type: String, default: '' },
    isPregnantOrLactating: { type: Boolean, default: false },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumberMasked: { type: String, default: '' }, // XXXX-XXXX-1234
      ifscCode: { type: String, default: '' },
      branch: { type: String, default: '' }
    }
  },
  documentsSummary: {
    aadhaarVerified: { type: Boolean, default: false },
    rationCardVerified: { type: Boolean, default: false },
    incomeCertVerified: { type: Boolean, default: false },
    casteCertVerified: { type: Boolean, default: false },
    disabilityCertVerified: { type: Boolean, default: false },
    birthCertVerified: { type: Boolean, default: false },
    bankProofVerified: { type: Boolean, default: false }
  },
  consentGiven: { type: Boolean, default: true },
  consentTimestamp: { type: Date, default: Date.now },
  lastSynthesizedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('PatientSchemeProfile', patientSchemeProfileSchema);

