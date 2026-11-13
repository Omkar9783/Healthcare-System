import mongoose from 'mongoose';

const governmentSchemeSchema = new mongoose.Schema({
  schemeId: { type: String, required: true, unique: true, index: true },
  schemeName: { type: String, required: true },
  shortCode: { type: String, required: true },
  governmentDepartment: { type: String, required: true },
  state: { type: String, default: 'Maharashtra' },
  purpose: { type: String, required: true },
  coverageBenefit: { type: String, required: true },
  eligibilityCriteriaSummary: { type: String, required: true },
  ageRequirements: {
    minAge: { type: Number, default: 0 },
    maxAge: { type: Number, default: 120 },
    description: { type: String, default: 'Any age' }
  },
  incomeRequirements: {
    maxAnnualIncome: { type: Number, default: null }, // null = no cap or covered under universal/BPL
    incomeCertificateRequired: { type: Boolean, default: false },
    allowedRationCardTypes: [{ type: String }], // 'Yellow', 'Orange', 'White', 'Antyodaya (AAY)'
    description: { type: String, default: 'Income criteria as per gazette' }
  },
  categoryRequirements: {
    allowedCategories: [{ type: String }], // 'General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC'
    casteCertificateRequired: { type: Boolean, default: false },
    description: { type: String, default: 'Open to all categories' }
  },
  disabilityRequirements: {
    minDisabilityPercentage: { type: Number, default: 0 },
    disabilityCertificateRequired: { type: Boolean, default: false },
    description: { type: String, default: 'Not applicable' }
  },
  genderRequirements: {
    type: String,
    enum: ['ALL', 'FEMALE', 'MALE'],
    default: 'ALL'
  },
  residenceRequirements: {
    maharashtraDomicileRequired: { type: Boolean, default: true },
    minYearsInState: { type: Number, default: 0 },
    description: { type: String, default: 'Resident of Maharashtra' }
  },
  requiredDocuments: [{
    docType: { type: String, required: true },
    docName: { type: String, required: true },
    isMandatory: { type: Boolean, default: true },
    description: { type: String, default: '' }
  }],
  applicationFormFields: [{
    fieldKey: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'select', 'date', 'textarea'], default: 'text' },
    required: { type: Boolean, default: true },
    options: [{ type: String }],
    placeholder: { type: String, default: '' },
    helpText: { type: String, default: '' }
  }],
  officialApplicationUrl: { type: String, required: true },
  lastVerifiedDate: { type: String, default: '2026-01-15' },
  sourceOfEligibilityRules: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('GovernmentScheme', governmentSchemeSchema);

