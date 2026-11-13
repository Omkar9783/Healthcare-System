import mongoose from 'mongoose';

const schemeEligibilityRuleSchema = new mongoose.Schema({
  schemeId: { type: String, required: true, index: true },
  ruleCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  field: { type: String, required: true },
  operator: { 
    type: String, 
    enum: ['EQUALS', 'LESS_THAN_OR_EQUAL', 'GREATER_THAN_OR_EQUAL', 'IN_LIST', 'EXISTS', 'CUSTOM'],
    required: true 
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  weight: { type: Number, default: 10 },
  isMandatory: { type: Boolean, default: true },
  failureMessage: { type: String, required: true },
  passMessage: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SchemeEligibilityRule', schemeEligibilityRuleSchema);

