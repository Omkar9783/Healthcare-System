import mongoose from 'mongoose';

const hospitalSchemeSchema = new mongoose.Schema({
  hospitalId: { type: String, required: true, unique: true },
  hospitalName: { type: String, required: true },
  state: { type: String, default: 'Maharashtra' },
  district: { type: String, default: 'Mumbai' },
  city: { type: String, default: 'Mumbai' },
  address: { type: String, required: true },
  contactPhone: { type: String, required: true },
  schemes: [{ type: String }], // ['MJPJAY', 'PM-JAY']
  empanelmentStatus: { 
    type: String, 
    enum: ['Empanelled - Active', 'Empanelled - Renewal Pending', 'Suspended'],
    default: 'Empanelled - Active'
  },
  specialties: [{ type: String }],
  isGovernmentHospital: { type: Boolean, default: false },
  rating: { type: Number, default: 4.8 },
  latitude: { type: Number, default: 19.0760 },
  longitude: { type: Number, default: 72.8777 },
  demoDataNotice: {
    type: String,
    default: 'Demo empanelled hospital dataset. Official production registry integration ready.'
  }
});

export default mongoose.model('HospitalScheme', hospitalSchemeSchema);
