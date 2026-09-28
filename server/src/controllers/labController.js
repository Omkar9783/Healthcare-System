import LabReport from '../models/LabReport.js';
import Patient from '../models/Patient.js';
import { canAccess } from '../services/authorizationService.js';
import { logAuditEvent } from '../middleware/audit.js';

export const getLabReports = async (req, res) => {
  try {
    const { patientUid, status } = req.query;
    let filter = {};

    if (patientUid) {
      const access = await canAccess({
        user: req.user,
        patientUid,
        resource: 'LAB_REPORTS',
        purpose: 'Diagnostic Review'
      });
      if (!access.allowed) {
        return res.status(403).json({ success: false, message: access.reason });
      }
      filter.patientUid = patientUid;
    } else if (req.user.role === 'PATIENT') {
      filter.patientUid = req.user.patientUid;
    }

    if (status) filter.status = status;

    const reports = await LabReport.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTestRequest = async (req, res) => {
  try {
    if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Doctors can request lab tests.' });
    }

    const { patientUid, testName, testCategory } = req.body;
    if (!patientUid || !testName) {
      return res.status(400).json({ success: false, message: 'Patient UID and test name are required.' });
    }

    const patient = await Patient.findOne({ uid: patientUid });
    const report = new LabReport({
      patientUid,
      patientName: patient ? patient.name : 'Patient',
      testName,
      testCategory: testCategory || 'Pathology',
      requestedByDoctor: req.user.name,
      status: 'Requested'
    });

    await report.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid,
      action: 'RECORD_CREATED',
      resource: 'LAB_REPORT_REQUEST',
      purpose: 'Diagnostic Test Order',
      result: 'SUCCESS',
      details: `Lab test requested: ${testName}`
    });

    res.status(201).json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateLabReportResults = async (req, res) => {
  try {
    if (req.user.role !== 'LAB_TECHNICIAN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Lab Technicians can update lab results.' });
    }

    const { id } = req.params;
    const { status, resultSummary, findings, attachmentUrl } = req.body;

    const report = await LabReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Lab report not found.' });
    }

    if (status) report.status = status;
    if (resultSummary) report.resultSummary = resultSummary;
    if (findings) report.findings = findings;
    if (attachmentUrl) report.attachmentUrl = attachmentUrl;
    
    report.labTechnicianName = req.user.name;
    if (status === 'Completed') report.completedAt = new Date();

    await report.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid: report.patientUid,
      action: 'LAB_REPORT_UPDATED',
      resource: 'LAB_REPORT',
      purpose: 'Pathology Diagnostics',
      result: 'SUCCESS',
      details: `Lab report updated to status ${report.status} by ${req.user.name}`
    });

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
