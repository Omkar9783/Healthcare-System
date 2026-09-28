import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientUid: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  department: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // e.g. 10:30 AM
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-show'], 
    default: 'Scheduled' 
  },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Appointment', appointmentSchema);
