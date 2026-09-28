import { generateClinicalSummary, summarizeReport, detectVitalsTrends } from '../services/aiService.js';
import { canAccess } from '../services/authorizationService.js';

export const getClinicalSummary = async (req, res) => {
  try {
    const { patientUid } = req.params;
    const access = await canAccess({
      user: req.user,
      patientUid,
      resource: 'MEDICAL_RECORDS',
      purpose: 'AI Clinical Assist'
    });

    if (!access.allowed) {
      return res.status(403).json({ success: false, message: access.reason });
    }

    const summary = await generateClinicalSummary(patientUid);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReportSummary = async (req, res) => {
  try {
    const { reportId } = req.params;
    const summary = await summarizeReport(reportId);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getVitalsTrends = async (req, res) => {
  try {
    const { patientUid } = req.params;
    const access = await canAccess({
      user: req.user,
      patientUid,
      resource: 'VITALS',
      purpose: 'Trend Analytics'
    });

    if (!access.allowed) {
      return res.status(403).json({ success: false, message: access.reason });
    }

    const trend = await detectVitalsTrends(patientUid);
    res.json({ success: true, trend });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
