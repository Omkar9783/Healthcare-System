import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patientUid: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String, required: true },
  diagnosis: { type: String, required: true },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g. 500mg
    frequency: { type: String, required: true }, // e.g. 1-0-1 (After Meals)
    duration: { type: String, required: true }, // e.g. 5 Days
    instructions: { type: String, default: '' }
  }],
  dispensingStatus: { 
    type: String, 
    enum: ['Pending', 'Dispensed', 'Cancelled'], 
    default: 'Pending' 
  },
  dispensedByPharmacist: { type: String, default: '' },
  dispensedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Prescription', prescriptionSchema);
