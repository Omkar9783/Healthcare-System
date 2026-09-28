import Consent from '../models/Consent.js';
import User from '../models/User.js';
import { logAuditEvent } from '../middleware/audit.js';

export const getConsents = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'PATIENT') {
      filter.patientUid = req.user.patientUid;
    } else {
      const { patientUid } = req.query;
      if (patientUid) filter.patientUid = patientUid;
    }

    const consents = await Consent.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: consents.length, consents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createConsent = async (req, res) => {
  try {
    const { grantedToUserId, grantedToRole = 'DOCTOR', resourceType = 'ALL', purpose, durationHours = 48 } = req.body;

    const patientUid = req.user.patientUid || req.body.patientUid;
    if (!patientUid || !purpose) {
      return res.status(400).json({ success: false, message: 'Patient UID and purpose are required.' });
    }

    let grantedToName = 'All Attending Clinicians';
    if (grantedToUserId) {
      const provider = await User.findById(grantedToUserId);
      if (provider) grantedToName = provider.name;
    }

    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const consent = new Consent({
      patientUid,
      grantedToUserId,
      grantedToName,
      grantedToRole,
      resourceType,
      purpose,
      durationHours,
      expiresAt,
      status: 'ACTIVE'
    });

    await consent.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid,
      action: 'CONSENT_GRANTED',
      resource: resourceType,
      purpose,
      result: 'SUCCESS',
      details: `Consent granted to ${grantedToName} for ${durationHours} hours`
    });

    res.status(201).json({ success: true, consent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const revokeConsent = async (req, res) => {
  try {
    const { id } = req.params;
    const consent = await Consent.findById(id);
    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent record not found.' });
    }

    if (req.user.role === 'PATIENT' && consent.patientUid !== req.user.patientUid) {
      return res.status(403).json({ success: false, message: 'You can only revoke your own consents.' });
    }

    consent.status = 'REVOKED';
    await consent.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid: consent.patientUid,
      action: 'CONSENT_REVOKED',
      resource: consent.resourceType,
      purpose: consent.purpose,
      result: 'SUCCESS',
      details: `Consent ID ${id} explicitly revoked by patient`
    });

    res.json({ success: true, message: 'Consent successfully revoked.', consent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
