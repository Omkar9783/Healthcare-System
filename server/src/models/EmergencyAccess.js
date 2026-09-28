import mongoose from 'mongoose';

const emergencyAccessSchema = new mongoose.Schema({
  patientUid: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  staffUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffName: { type: String, required: true },
  purpose: { type: String, default: 'Emergency Treatment' },
  durationMinutes: { type: Number, default: 30 },
  expiresAt: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'EXPIRED'], 
    default: 'ACTIVE' 
  },
  accessedResources: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('EmergencyAccess', emergencyAccessSchema);
