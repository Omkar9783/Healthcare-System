import { generatePatientQR, validateQRToken, revokePatientQR } from '../services/qrService.js';

export const generateQR = async (req, res) => {
  try {
    const patientUid = req.body.patientUid || req.user.patientUid;
    if (!patientUid) {
      return res.status(400).json({ success: false, message: 'Patient UID is required.' });
    }

    const result = await generatePatientQR(patientUid, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const validateQR = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token string is required.' });
    }

    const result = await validateQRToken(token, req.user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const revokeQR = async (req, res) => {
  try {
    const patientUid = req.body.patientUid || req.user.patientUid;
    if (!patientUid) {
      return res.status(400).json({ success: false, message: 'Patient UID is required.' });
    }

    const result = await revokePatientQR(patientUid, req.user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
