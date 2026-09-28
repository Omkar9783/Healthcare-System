import Vitals from '../models/Vitals.js';
import { canAccess } from '../services/authorizationService.js';
import { logAuditEvent } from '../middleware/audit.js';

export const getVitalsByPatient = async (req, res) => {
  try {
    const { patientUid } = req.params;
    const access = await canAccess({
      user: req.user,
      patientUid,
      resource: 'VITALS',
      purpose: 'Vital Sign Monitoring'
    });

    if (!access.allowed) {
      return res.status(403).json({ success: false, message: access.reason });
    }

    const vitals = await Vitals.find({ patientUid }).sort({ recordedAt: -1 });
    res.json({ success: true, count: vitals.length, vitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const recordVitals = async (req, res) => {
  try {
    const allowedRoles = ['NURSE', 'DOCTOR', 'EMERGENCY_STAFF', 'ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Your role is not authorized to record vital signs.' });
    }

    const { patientUid, temperature, bloodPressure, heartRate, spO2, respiratoryRate, weight, notes } = req.body;
    if (!patientUid || !temperature || !bloodPressure || !heartRate || !spO2) {
      return res.status(400).json({ success: false, message: 'Patient UID, temperature, blood pressure, heart rate, and SpO2 are required.' });
    }

    const vital = new Vitals({
      patientUid,
      recordedByUserId: req.user._id,
      recordedByName: req.user.name,
      recordedByRole: req.user.role,
      temperature,
      bloodPressure,
      heartRate,
      spO2,
      respiratoryRate: respiratoryRate || 16,
      weight: weight || 70,
      notes: notes || ''
    });

    await vital.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid,
      action: 'RECORD_CREATED',
      resource: 'VITALS',
      purpose: 'Nursing Vitals Logging',
      result: 'SUCCESS',
      details: `Vitals recorded: BP ${bloodPressure}, HR ${heartRate} bpm, SpO2 ${spO2}%`
    });

    res.status(201).json({ success: true, vital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
