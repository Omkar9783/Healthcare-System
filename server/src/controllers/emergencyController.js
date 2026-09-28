import EmergencyAccess from '../models/EmergencyAccess.js';
import Patient from '../models/Patient.js';
import { logAuditEvent } from '../middleware/audit.js';

export const requestEmergencyAccess = async (req, res) => {
  try {
    const { patientUid, purpose = 'Emergency Treatment', durationMinutes = 30 } = req.body;
    if (!patientUid) {
      return res.status(400).json({ success: false, message: 'Patient UID is required for emergency override.' });
    }

    const patient = await Patient.findOne({ uid: patientUid });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const access = new EmergencyAccess({
      patientUid,
      patientName: patient.name,
      staffUserId: req.user._id,
      staffName: req.user.name,
      purpose,
      durationMinutes,
      expiresAt,
      status: 'ACTIVE',
      accessedResources: ['Blood Group', 'Allergies', 'Critical Conditions', 'Emergency Contact']
    });

    await access.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid,
      action: 'EMERGENCY_ACCESS',
      resource: 'EMERGENCY_DATA_OVERRIDE',
      purpose,
      result: 'SUCCESS',
      details: `30-minute temporary emergency access granted. Expires at ${expiresAt}`
    });

    res.status(201).json({
      success: true,
      message: 'Temporary Emergency Access Granted.',
      expiresAt,
      emergencyInfo: {
        patientUid: patient.uid,
        patientName: patient.name,
        dateOfBirth: patient.dateOfBirth,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        emergencyContact: patient.emergencyContact
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEmergencyStatus = async (req, res) => {
  try {
    const { patientUid } = req.params;
    const activeAccess = await EmergencyAccess.findOne({
      patientUid,
      staffUserId: req.user._id,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() }
    });

    if (!activeAccess) {
      return res.json({ success: true, active: false });
    }

    const remainingSeconds = Math.max(0, Math.floor((new Date(activeAccess.expiresAt) - new Date()) / 1000));
    res.json({
      success: true,
      active: true,
      expiresAt: activeAccess.expiresAt,
      remainingSeconds,
      access: activeAccess
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
