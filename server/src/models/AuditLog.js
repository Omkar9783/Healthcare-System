import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  auditId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  patientUid: { type: String, default: null, index: true },
  action: { 
    type: String, 
    enum: [
      'PATIENT_VIEWED',
      'RECORD_UPDATED',
      'RECORD_MODIFIED',
      'RECORD_CREATED',
      'QR_SCANNED',
      'ACCESS_GRANTED',
      'ACCESS_DENIED',
      'CONSENT_GRANTED',
      'CONSENT_REVOKED',
      'EMERGENCY_ACCESS',
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'PRESCRIPTION_DISPENSED',
      'LAB_REPORT_UPDATED',
      'DOCUMENT_VERIFIED',
      'DOCUMENT_MANUAL_APPROVED',
      'DOCUMENT_MANUAL_REJECTED'
    ],
    required: true 
  },
  resource: { type: String, required: true },
  purpose: { type: String, default: 'Clinical Care' },
  ipAddress: { type: String, default: '127.0.0.1' },
  result: { type: String, enum: ['SUCCESS', 'DENIED', 'EXPIRED', 'PENDING_REVIEW'], default: 'SUCCESS' },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true }
});

export default mongoose.model('AuditLog', auditLogSchema);
