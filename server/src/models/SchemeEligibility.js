import mongoose from 'mongoose';

const schemeEligibilitySchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  schemeName: { 
    type: String, 
    enum: ['MJPJAY', 'PM-JAY'],
    required: true 
  },
  schemeFullName: { type: String, required: true },
  eligibilityStatus: { 
    type: String, 
    enum: ['Potentially Eligible', 'Verification Required', 'Not Eligible', 'Officially Verified'],
    default: 'Verification Required'
  },
  eligibilityReason: { type: String, required: true },
  coverageAmount: { type: String, default: '₹5,00,000 per family per year' },
  verificationSource: { type: String, default: 'State Health Agency / NFSA Data Cross-Check' },
  officialPortalUrl: { type: String, default: '' },
  requiredDocuments: [{ type: String }],
  benefits: [{ type: String }],
  lastChecked: { type: Date, default: Date.now }
});

export default mongoose.model('SchemeEligibility', schemeEligibilitySchema);
