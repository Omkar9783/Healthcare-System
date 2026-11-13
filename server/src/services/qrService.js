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
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

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
  if (!qrToken) {
    return { valid: false, reason: 'QR token is empty' };
  }

  const trimmed = typeof qrToken === 'string' ? qrToken.trim() : '';
  let parsedToken = trimmed;
  let parsedUid = null;

  try {
    const json = JSON.parse(trimmed);
    if (json && typeof json === 'object') {
      if (json.token) parsedToken = json.token;
      if (json.uid) parsedUid = json.uid;
    }
  } catch (e) {
    // String token provided directly
  }

  // Also recognize direct Patient UID (e.g., PAT-2026-000001)
  if (!parsedUid && (trimmed.startsWith('PAT-') || trimmed.toUpperCase().startsWith('PAT-'))) {
    parsedUid = trimmed.toUpperCase();
  }

  const searchConditions = [];
  if (parsedToken) searchConditions.push({ qrToken: parsedToken });
  if (parsedUid) searchConditions.push({ uid: parsedUid });
  if (trimmed) searchConditions.push({ uid: trimmed });
  if (trimmed) searchConditions.push({ uid: trimmed.toUpperCase() });

  const patient = await Patient.findOne({ $or: searchConditions });

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
        details: `Invalid QR Token provided: ${trimmed.substring(0, 30)}`
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

  // Auto-renew token if expired so verified active patients are never locked out
  if (patient.qrExpiresAt && new Date() > new Date(patient.qrExpiresAt)) {
    patient.qrExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (!patient.qrToken) {
      patient.qrToken = generateSecureToken(patient.uid);
    }
    await patient.save();
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
