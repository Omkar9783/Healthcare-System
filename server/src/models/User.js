import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST', 'PATIENT', 'EMERGENCY_STAFF'],
    required: true 
  },
  patientUid: { type: String, default: null }, // Linked if user role is PATIENT
  hospital: { type: String, default: 'MediSecure Central Hospital' },
  department: { type: String, default: 'General Medicine' },
  specialization: { type: String, default: '' },
  phone: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
