import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  patientUid: { type: String, required: true, index: true },
  doctorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String, required: true },
  department: { type: String, default: 'General Medicine' },
  encounterDate: { type: Date, default: Date.now },
  chiefComplaint: { type: String, required: true },
  diagnosis: { type: String, required: true },
  treatmentNotes: { type: String, required: true },
  recommendedFollowUp: { type: String, default: '' },
  documents: [{
    title: String,
    type: String,
    url: String
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('MedicalRecord', medicalRecordSchema);
