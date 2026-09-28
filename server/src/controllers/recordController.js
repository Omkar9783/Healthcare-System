import MedicalRecord from '../models/MedicalRecord.js';
import { canAccess } from '../services/authorizationService.js';
import { logAuditEvent } from '../middleware/audit.js';

export const getRecordsByPatient = async (req, res) => {
  try {
    const { patientUid } = req.params;
    const access = await canAccess({
      user: req.user,
      patientUid,
      resource: 'MEDICAL_RECORDS',
      purpose: 'Clinical Assessment'
    });

    if (!access.allowed) {
      return res.status(403).json({ success: false, message: access.reason });
    }

    const records = await MedicalRecord.find({ patientUid }).sort({ encounterDate: -1 });
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createRecord = async (req, res) => {
  try {
    if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Doctors and Admins can create medical records.' });
    }

    const { patientUid, chiefComplaint, diagnosis, treatmentNotes, recommendedFollowUp, department } = req.body;
    if (!patientUid || !chiefComplaint || !diagnosis || !treatmentNotes) {
      return res.status(400).json({ success: false, message: 'Patient UID, chief complaint, diagnosis, and treatment notes are required.' });
    }

    const record = new MedicalRecord({
      patientUid,
      doctorUserId: req.user._id,
      doctorName: req.user.name,
      department: department || req.user.department || 'General Medicine',
      chiefComplaint,
      diagnosis,
      treatmentNotes,
      recommendedFollowUp,
      encounterDate: new Date()
    });

    await record.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid,
      action: 'RECORD_CREATED',
      resource: 'MEDICAL_RECORD',
      purpose: 'Clinical Diagnosis',
      result: 'SUCCESS',
      details: `New medical record added: ${diagnosis}`
    });

    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
