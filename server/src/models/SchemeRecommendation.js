import mongoose from 'mongoose';

const ruleEvaluationItemSchema = new mongoose.Schema({
  ruleCode: { type: String, required: true },
  name: { type: String, default: '' },
  passed: { type: Boolean, required: true },
  isMandatory: { type: Boolean, default: true },
  note: { type: String, required: true }
}, { _id: false });

const recommendationItemSchema = new mongoose.Schema({
  schemeId: { type: String, required: true },
  schemeName: { type: String, required: true },
  shortCode: { type: String, required: true },
  governmentDepartment: { type: String, required: true },
  state: { type: String, default: 'Maharashtra' },
  eligibilityStatus: { 
    type: String, 
    enum: ['POTENTIALLY_ELIGIBLE', 'INSUFFICIENT_INFORMATION', 'INELIGIBLE'],
    required: true 
  },
  matchScore: { type: Number, default: 0 },
  coverageBenefit: { type: String, required: true },
  officialUrl: { type: String, required: true },
  reasons: [{ type: String }],
  missingFields: [{ type: String }],
  missingDocuments: [{ type: String }],
  ruleEvaluations: [ruleEvaluationItemSchema]
}, { _id: false });

const schemeRecommendationSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  recommendations: [recommendationItemSchema],
  summary: {
    eligibleCount: { type: Number, default: 0 },
    infoNeededCount: { type: Number, default: 0 },
    ineligibleCount: { type: Number, default: 0 },
    totalEvaluated: { type: Number, default: 0 }
  },
  disclaimer: {
    type: String,
    default: 'Preliminary AI evaluation based on published government criteria. Final eligibility must be verified by official government authorities.'
  },
  evaluatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('SchemeRecommendation', schemeRecommendationSchema);

