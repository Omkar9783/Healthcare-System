import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { logAuditEvent } from '../middleware/audit.js';

export const getAppointments = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'PATIENT') {
      filter.patientUid = req.user.patientUid;
    } else if (req.user.role === 'DOCTOR') {
      filter.doctorId = req.user._id;
    }

    const appointments = await Appointment.find(filter).sort({ date: 1, time: 1 });
    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { patientUid, doctorId, date, time, reason, department } = req.body;
    
    let targetUid = patientUid;
    if (req.user.role === 'PATIENT') {
      targetUid = req.user.patientUid;
    }

    if (!targetUid || !doctorId || !date || !time || !reason) {
      return res.status(400).json({ success: false, message: 'Patient, Doctor, Date, Time, and Reason are required.' });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Selected doctor not found.' });
    }

    const patient = await Patient.findOne({ uid: targetUid });

    const appointment = new Appointment({
      patientUid: targetUid,
      patientName: patient ? patient.name : req.user.name,
      doctorId: doctor._id,
      doctorName: doctor.name,
      department: department || doctor.department || 'General Medicine',
      date,
      time,
      reason,
      status: 'Scheduled'
    });

    await appointment.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid: targetUid,
      action: 'RECORD_CREATED',
      resource: 'APPOINTMENT',
      purpose: 'Clinical Appointment Booking',
      result: 'SUCCESS',
      details: `Appointment booked with Dr. ${doctor.name} on ${date} at ${time}`
    });

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      patientUid: appointment.patientUid,
      action: 'RECORD_UPDATED',
      resource: 'APPOINTMENT',
      purpose: 'Appointment Schedule Management',
      result: 'SUCCESS',
      details: `Appointment status updated to ${status}`
    });

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
