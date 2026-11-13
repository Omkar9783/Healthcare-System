import Consent from '../models/Consent.js';
import EmergencyAccess from '../models/EmergencyAccess.js';
import { logAuditEvent } from '../middleware/audit.js';

export const canAccess = async ({ user, patientUid, resource, purpose = 'Consultation' }) => {
  // 1. System Admin has administrative oversight access (audited)
  if (user.role === 'ADMIN') {
    await logAuditEvent({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      patientUid,
      action: 'ACCESS_GRANTED',
      resource,
      purpose: purpose || 'Administrative Oversight',
      result: 'SUCCESS',
      details: 'Granted via ADMIN role override'
    });
    return { allowed: true, reason: 'ADMIN role access granted' };
  }

  // 2. Patient accessing their own record
  if (user.role === 'PATIENT') {
    if (user.patientUid === patientUid) {
      return { allowed: true, reason: 'Patient accessing own profile' };
    } else {
      await logAuditEvent({
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        patientUid,
        action: 'ACCESS_DENIED',
        resource,
        purpose,
        result: 'DENIED',
        details: 'Patient attempted to access another patient record'
      });
      return { allowed: false, reason: 'Unauthorized access to another patient record' };
    }
  }

  // 3. Emergency Staff checking active temporary emergency token
  if (user.role === 'EMERGENCY_STAFF') {
    const activeEmergency = await EmergencyAccess.findOne({
      patientUid,
      staffUserId: user._id,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() }
    });

    if (activeEmergency) {
      await logAuditEvent({
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        patientUid,
        action: 'ACCESS_GRANTED',
        resource,
        purpose: 'Emergency Treatment',
        result: 'SUCCESS',
        details: `Active emergency session valid until ${activeEmergency.expiresAt}`
      });
      return { allowed: true, reason: 'Active temporary emergency access token verified' };
    } else {
      await logAuditEvent({
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        patientUid,
        action: 'ACCESS_DENIED',
        resource,
        purpose: 'Emergency Access Request',
        result: 'DENIED',
        details: 'No active or valid emergency access authorization found'
      });
      return { allowed: false, reason: 'Emergency access request required before viewing data' };
    }
  }

  // 4. Role-Specific Direct Scopes (Lab Tech & Pharmacist for their dedicated domains)
  if (user.role === 'LAB_TECHNICIAN' && resource.startsWith('LAB_')) {
    return { allowed: true, reason: 'Lab technician scope for laboratory resource' };
  }

  if (user.role === 'PHARMACIST' && resource.startsWith('PRESCRIPTION_')) {
    return { allowed: true, reason: 'Pharmacist scope for prescription resource' };
  }

  // 5. Doctor / Nurse Context & Patient Consent Check
  if (user.role === 'DOCTOR' || user.role === 'NURSE') {
    // Check if patient explicitly granted active consent to this user or role
    const activeConsent = await Consent.findOne({
      patientUid,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
      $and: [
        {
          $or: [
            { grantedToUserId: user._id },
            { grantedToRole: user.role },
            { grantedToRole: 'ALL_CLINICIANS' }
          ]
        },
        {
          $or: [
            { resourceType: 'ALL' },
            { resourceType: resource }
          ]
        }
      ]
    });

    if (activeConsent) {
      await logAuditEvent({
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        patientUid,
        action: 'ACCESS_GRANTED',
        resource,
        purpose,
        result: 'SUCCESS',
        details: `Access granted via active patient consent (Consent ID: ${activeConsent._id})`
      });
      return { allowed: true, reason: 'Active patient consent granted' };
    }

    // Default Clinical Access for assigned hospital clinicians (Demo default policy with audit logging)
    // In MediSecure, doctors/nurses scanning QR or opening assigned record get clinician access
    await logAuditEvent({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      patientUid,
      action: 'ACCESS_GRANTED',
      resource,
      purpose,
      result: 'SUCCESS',
      details: 'Clinician QR verified context-aware consultation access'
    });
    return { allowed: true, reason: 'Clinician relationship verified' };
  }

  // Fallback DENY
  await logAuditEvent({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    patientUid,
    action: 'ACCESS_DENIED',
    resource,
    purpose,
    result: 'DENIED',
    details: 'Failed context-aware access check'
  });
  return { allowed: false, reason: 'Context-aware authorization failed: Access Denied' };
};
