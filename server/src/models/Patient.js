import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // e.g. PAT-2026-000001
  name: { type: String, required: true },
  dateOfBirth: { type: String, required: true }, // YYYY-MM-DD
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: { type: String, required: true }, // A+, O-, etc.
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  emergencyContact: {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true }
  },
  allergies: [{
    allergen: String,
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
    reaction: String
  }],
  chronicConditions: [String],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  qrToken: { type: String, default: '' },
  qrExpiresAt: { type: Date },
  qrRevoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Patient', patientSchema);
