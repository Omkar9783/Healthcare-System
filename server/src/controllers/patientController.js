import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import LabReport from '../models/LabReport.js';
import Vitals from '../models/Vitals.js';
import Consent from '../models/Consent.js';
import { canAccess } from '../services/authorizationService.js';
import { logAuditEvent } from '../middleware/audit.js';

export const getPatientsList = async (req, res) => {
  try {
    const { query } = req.query;
    let filter = {};
    if (query) {
      filter = {
        $or: [
          { uid: new RegExp(query, 'i') },
          { name: new RegExp(query, 'i') },
          { bloodGroup: new RegExp(query, 'i') }
        ]
      };
    }

    const patients = await Patient.find(filter).select('uid name gender bloodGroup dateOfBirth phone');
    res.json({ success: true, count: patients.length, patients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPatientByUid = async (req, res) => {
  try {
    const { uid } = req.params;
    const accessCheck = await canAccess({
      user: req.user,
      patientUid: uid,
      resource: 'MEDICAL_RECORDS',
      purpose: 'Clinical Assessment'
    });

    if (!accessCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: accessCheck.reason || 'Access Denied to Patient Data.'
      });
    }

    const patient = await Patient.findOne({ uid });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const medicalRecords = await MedicalRecord.find({ patientUid: uid }).sort({ encounterDate: -1 });
    const prescriptions = await Prescription.find({ patientUid: uid }).sort({ createdAt: -1 });
    const labReports = await LabReport.find({ patientUid: uid }).sort({ createdAt: -1 });
    const vitalsList = await Vitals.find({ patientUid: uid }).sort({ recordedAt: -1 });
    const activeConsents = await Consent.find({ patientUid: uid, status: 'ACTIVE' });

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid: uid,
      action: 'PATIENT_VIEWED',
      resource: 'PATIENT_FULL_PROFILE',
      purpose: 'Clinical Consultation',
      result: 'SUCCESS'
    });

    res.json({
      success: true,
      patient,
      medicalRecords,
      prescriptions,
      labReports,
      vitalsList,
      activeConsents
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
