import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import { canAccess } from '../services/authorizationService.js';
import { logAuditEvent } from '../middleware/audit.js';

export const getPrescriptions = async (req, res) => {
  try {
    const { patientUid } = req.query;
    let filter = {};

    if (patientUid) {
      const access = await canAccess({
        user: req.user,
        patientUid,
        resource: 'PRESCRIPTIONS',
        purpose: 'Pharmacy Verification'
      });
      if (!access.allowed) {
        return res.status(403).json({ success: false, message: access.reason });
      }
      filter.patientUid = patientUid;
    } else if (req.user.role === 'PATIENT') {
      filter.patientUid = req.user.patientUid;
    }

    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: prescriptions.length, prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPrescription = async (req, res) => {
  try {
    if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Doctors can issue prescriptions.' });
    }

    const { patientUid, diagnosis, medicines } = req.body;
    if (!patientUid || !diagnosis || !medicines || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient UID, diagnosis, and medicines list are required.' });
    }

    const patient = await Patient.findOne({ uid: patientUid });
    const prescription = new Prescription({
      patientUid,
      patientName: patient ? patient.name : 'Patient',
      doctorUserId: req.user._id,
      doctorName: req.user.name,
      diagnosis,
      medicines,
      dispensingStatus: 'Pending'
    });

    await prescription.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid,
      action: 'RECORD_CREATED',
      resource: 'PRESCRIPTION',
      purpose: 'Medication Order',
      result: 'SUCCESS',
      details: `Prescription issued with ${medicines.length} medicines`
    });

    res.status(201).json({ success: true, prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateDispensingStatus = async (req, res) => {
  try {
    if (req.user.role !== 'PHARMACIST' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Pharmacists can update prescription dispensing status.' });
    }

    const { id } = req.params;
    const { status } = req.body; // 'Dispensed' or 'Pending' or 'Cancelled'

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    prescription.dispensingStatus = status;
    prescription.dispensedByPharmacist = req.user.name;
    prescription.dispensedAt = status === 'Dispensed' ? new Date() : null;
    await prescription.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid: prescription.patientUid,
      action: 'PRESCRIPTION_DISPENSED',
      resource: 'PRESCRIPTION',
      purpose: 'Medication Dispensation',
      result: 'SUCCESS',
      details: `Prescription marked as ${status} by Pharmacist ${req.user.name}`
    });

    res.json({ success: true, prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
