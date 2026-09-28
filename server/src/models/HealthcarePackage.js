import mongoose from 'mongoose';

const healthcarePackageSchema = new mongoose.Schema({
  schemeName: { 
    type: String, 
    enum: ['MJPJAY', 'PM-JAY', 'Both'],
    required: true 
  },
  packageCode: { type: String, required: true },
  packageName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Cardiology', 'Ophthalmology', 'Nephrology', 'Orthopedic Surgery', 'Oncology', 'General Surgery', 'Pediatrics', 'Neurology'],
    required: true 
  },
  coverageDetails: { type: String, required: true },
  officialRateGuideline: { type: String, default: 'Standard Scheme Tariff' },
  requiredDocuments: [{ type: String }],
  preAuthRequired: { type: Boolean, default: true },
  hospitalTier: { type: String, default: 'Secondary & Tertiary Care Centers' },
  verificationNotice: { 
    type: String, 
    default: 'Official package data aligned with MJPJAY 2.0 & PM-JAY National Health Authority Master.'
  }
});

export default mongoose.model('HealthcarePackage', healthcarePackageSchema);
