import mongoose from 'mongoose';

const vitalsSchema = new mongoose.Schema({
  patientUid: { type: String, required: true, index: true },
  recordedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedByName: { type: String, required: true },
  recordedByRole: { type: String, enum: ['NURSE', 'DOCTOR', 'EMERGENCY_STAFF'], required: true },
  temperature: { type: Number, required: true }, // in Celsius / F
  bloodPressure: { type: String, required: true }, // e.g. "120/80"
  heartRate: { type: Number, required: true }, // bpm
  spO2: { type: Number, required: true }, // %
  respiratoryRate: { type: Number, required: true }, // breaths/min
  weight: { type: Number, required: true }, // kg
  notes: { type: String, default: '' },
  recordedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Vitals', vitalsSchema);
