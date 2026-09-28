import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['SIGNUP', 'LOGIN', 'RECOVERY'],
    default: 'SIGNUP'
  },
  channel: {
    type: String,
    enum: ['EMAIL', 'SMS'],
    default: 'EMAIL'
  },
  role: {
    type: String,
    default: 'PATIENT'
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Auto-expire documents after 10 minutes in MongoDB
  }
});

export default mongoose.model('OtpVerification', otpVerificationSchema);
