import mongoose from 'mongoose';

const labReportSchema = new mongoose.Schema({
  patientUid: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  testName: { type: String, required: true }, // e.g. Complete Blood Count (CBC), Lipid Profile
  testCategory: { type: String, default: 'Pathology' },
  requestedByDoctor: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Requested', 'In Progress', 'Completed'], 
    default: 'Requested' 
  },
  labTechnicianName: { type: String, default: '' },
  sampleCollectedAt: { type: Date },
  resultSummary: { type: String, default: '' },
  findings: [{
    parameter: String,
    value: String,
    unit: String,
    referenceRange: String,
    status: { type: String, enum: ['Normal', 'High', 'Low', 'Critical'], default: 'Normal' }
  }],
  attachmentUrl: { type: String, default: '' },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('LabReport', labReportSchema);
