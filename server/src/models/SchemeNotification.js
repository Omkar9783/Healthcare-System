import mongoose from 'mongoose';

const schemeNotificationSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['Information', 'Warning', 'Action Required', 'Success'],
    default: 'Information' 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  readStatus: { type: Boolean, default: false },
  linkTab: { type: String, default: 'schemes' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SchemeNotification', schemeNotificationSchema);
