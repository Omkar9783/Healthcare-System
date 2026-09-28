import crypto from 'crypto';
import Patient from '../models/Patient.js';
import { logAuditEvent } from '../middleware/audit.js';

export const generateSecureToken = (patientUid) => {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const timestamp = Date.now();
  // Secure token payload format: MEDI-SECURE-V1.<patientUid>.<randomBytes>.<timestamp>
  return `MS-QR-${patientUid}-${randomBytes.substring(0, 16).toUpperCase()}`;
};

export const generatePatientQR = async (patientUid, requestingUser) => {
  const patient = await Patient.findOne({ uid: patientUid });
  if (!patient) {
    throw new Error('Patient not found');
  }

  const token = generateSecureToken(patientUid);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity

  patient.qrToken = token;
  patient.qrExpiresAt = expiresAt;
  patient.qrRevoked = false;
  await patient.save();

  if (requestingUser) {
    await logAuditEvent({
      userId: requestingUser._id,
      userName: requestingUser.name,
      userRole: requestingUser.role,
      patientUid,
      action: 'QR_SCANNED',
      resource: 'QR_TOKEN_GENERATION',
      purpose: 'Identity Assertion',
      result: 'SUCCESS',
      details: 'New secure QR token generated'
    });
  }

  return {
    patientUid: patient.uid,
    qrToken: token,
    expiresAt,
    // QR Code data payload (Only includes secure token URL/ref, NO MEDICAL DATA)
    qrPayload: JSON.stringify({
      system: 'MediSecure-Identity',
      token: token,
      uid: patient.uid,
      generatedAt: new Date().toISOString()
    })
  };
};

export const validateQRToken = async (qrToken, requestingUser) => {
  let parsedToken = qrToken;
  let parsedUid = null;

  try {
    const json = JSON.parse(qrToken);
    if (json && json.token) {
      parsedToken = json.token;
      parsedUid = json.uid;
    }
  } catch (e) {
    // String token provided directly
  }

  const patient = await Patient.findOne({ 
    $or: [{ qrToken: parsedToken }, { uid: parsedUid }]
  });

  if (!patient) {
    if (requestingUser) {
      await logAuditEvent({
        userId: requestingUser._id,
        userName: requestingUser.name,
        userRole: requestingUser.role,
        action: 'ACCESS_DENIED',
        resource: 'QR_VALIDATION',
        purpose: 'Identity Lookup',
        result: 'DENIED',
        details: 'Invalid QR Token provided'
      });
    }
    return { valid: false, reason: 'Invalid or unknown QR Token' };
  }

  if (patient.qrRevoked) {
    if (requestingUser) {
      await logAuditEvent({
        userId: requestingUser._id,
        userName: requestingUser.name,
        userRole: requestingUser.role,
        patientUid: patient.uid,
        action: 'ACCESS_DENIED',
        resource: 'QR_VALIDATION',
        purpose: 'Identity Lookup',
        result: 'DENIED',
        details: 'QR Token has been revoked by patient'
      });
    }
    return { valid: false, reason: 'QR Token has been revoked by patient' };
  }

  if (patient.qrExpiresAt && new Date() > new Date(patient.qrExpiresAt)) {
    if (requestingUser) {
      await logAuditEvent({
        userId: requestingUser._id,
        userName: requestingUser.name,
        userRole: requestingUser.role,
        patientUid: patient.uid,
        action: 'ACCESS_DENIED',
        resource: 'QR_VALIDATION',
        purpose: 'Identity Lookup',
        result: 'DENIED',
        details: 'QR Token expired'
      });
    }
    return { valid: false, reason: 'QR Token has expired' };
  }

  if (requestingUser) {
    await logAuditEvent({
      userId: requestingUser._id,
      userName: requestingUser.name,
      userRole: requestingUser.role,
      patientUid: patient.uid,
      action: 'QR_SCANNED',
      resource: 'PATIENT_IDENTITY',
      purpose: 'Identity Lookup',
      result: 'SUCCESS',
      details: 'Patient QR Token validated successfully'
    });
  }

  return {
    valid: true,
    patient: {
      uid: patient.uid,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      phone: patient.phone,
      emergencyContact: patient.emergencyContact
    }
  };
};

export const revokePatientQR = async (patientUid, requestingUser) => {
  const patient = await Patient.findOne({ uid: patientUid });
  if (!patient) throw new Error('Patient not found');

  patient.qrRevoked = true;
  await patient.save();

  if (requestingUser) {
    await logAuditEvent({
      userId: requestingUser._id,
      userName: requestingUser.name,
      userRole: requestingUser.role,
      patientUid,
      action: 'CONSENT_REVOKED',
      resource: 'QR_TOKEN',
      purpose: 'Security Revocation',
      result: 'SUCCESS',
      details: 'Patient QR token explicitly revoked'
    });
  }

  return { success: true, message: 'QR token successfully revoked.' };
};
