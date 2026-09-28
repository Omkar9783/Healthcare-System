import mongoose from 'mongoose';

const familyMemberSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  relationship: { 
    type: String, 
    enum: ['Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'],
    required: true 
  },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: { type: String, default: 'O+' },
  mobileNumber: { type: String, default: '' },
  beneficiaryId: { type: String, default: '' }, // Govt Scheme Beneficiary ID (optional)
  linkedPatientId: { type: String, default: '' }, // Existing patient UID if linked in system (optional)
  schemeStatus: { 
    type: String, 
    enum: ['Covered', 'Verification Required', 'Pending Enrollment', 'Not Eligible'],
    default: 'Covered'
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('FamilyMember', familyMemberSchema);
