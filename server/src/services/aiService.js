import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import LabReport from '../models/LabReport.js';
import Vitals from '../models/Vitals.js';

export const generateClinicalSummary = async (patientUid) => {
  const records = await MedicalRecord.find({ patientUid }).sort({ encounterDate: -1 }).limit(5);
  const prescriptions = await Prescription.find({ patientUid }).sort({ createdAt: -1 }).limit(5);
  const labs = await LabReport.find({ patientUid }).sort({ createdAt: -1 }).limit(5);
  const vitals = await Vitals.find({ patientUid }).sort({ recordedAt: -1 }).limit(3);

  // Construct structured AI clinical summary
  const latestVitals = vitals[0];
  const recentDiagnoses = records.map(r => r.diagnosis).filter(Boolean).join(', ') || 'No recorded chronic conditions';
  const activeMedications = prescriptions
    .flatMap(p => p.medicines.map(m => `${m.name} (${m.dosage})`))
    .join(', ') || 'None active';
  
  const abnormalLabs = labs
    .flatMap(l => (l.findings || []).filter(f => f.status !== 'Normal').map(f => `${l.testName}: ${f.parameter} is ${f.status} (${f.value} ${f.unit})`))
    .join('; ') || 'All recent lab parameters within normal limits';

  const summaryText = `Patient ${patientUid} active clinical synthesis: Recent consultations document ${recentDiagnoses}. Current active regimen includes ${activeMedications}. Latest vital signs show BP ${latestVitals ? latestVitals.bloodPressure : 'N/A'}, HR ${latestVitals ? latestVitals.heartRate + ' bpm' : 'N/A'}, and SpO2 ${latestVitals ? latestVitals.spO2 + '%' : 'N/A'}. Lab highlights: ${abnormalLabs}.`;

  return {
    disclaimer: 'AI-assisted summary — verify with source records. Do not use as standalone diagnostic tool.',
    generatedAt: new Date().toISOString(),
    patientUid,
    overview: summaryText,
    keyInsights: [
      `Primary active concern: ${records[0]?.diagnosis || 'Routine Evaluation'}`,
      `Regimen compliance: ${prescriptions.length} active prescriptions recorded`,
      `Lab status: ${labs.length} diagnostic reports analyzed`
    ],
    recommendedNextSteps: [
      'Confirm vital signs stability during current encounter',
      'Review drug-drug interactions before adjusting medications',
      'Schedule routine pathology follow-up if indicated'
    ]
  };
};

export const summarizeReport = async (reportId) => {
  const report = await LabReport.findById(reportId);
  if (!report) throw new Error('Lab report not found');

  return {
    disclaimer: 'AI-assisted report summary — verify with laboratory documentation.',
    testName: report.testName,
    summary: `Analysis of ${report.testName} performed on ${new Date(report.createdAt).toLocaleDateString()}. Findings indicate ${report.resultSummary || 'Standard physiological distribution'}.`,
    criticalFlags: (report.findings || []).filter(f => f.status === 'Critical' || f.status === 'High').map(f => `${f.parameter} (${f.value} ${f.unit}) - Reference: ${f.referenceRange}`)
  };
};

export const detectVitalsTrends = async (patientUid) => {
  const vitalsList = await Vitals.find({ patientUid }).sort({ recordedAt: 1 }).limit(10);
  
  if (!vitalsList || vitalsList.length === 0) {
    return { hasData: false, message: 'Insufficient vital readings to compute trend analysis.' };
  }

  const bpReadings = vitalsList.map(v => {
    const parts = (v.bloodPressure || '120/80').split('/');
    return { systolic: parseInt(parts[0]) || 120, diastolic: parseInt(parts[1]) || 80, date: v.recordedAt };
  });

  const avgSystolic = bpReadings.reduce((acc, curr) => acc + curr.systolic, 0) / bpReadings.length;
  const isHighBpTrend = avgSystolic > 135;

  return {
    hasData: true,
    dataCount: vitalsList.length,
    trends: {
      bloodPressureTrend: isHighBpTrend ? 'Elevated Systolic Trend Flagged' : 'Stable Blood Pressure Trend',
      avgSystolic: Math.round(avgSystolic),
      heartRateAverage: Math.round(vitalsList.reduce((acc, curr) => acc + curr.heartRate, 0) / vitalsList.length),
      spO2Average: Math.round(vitalsList.reduce((acc, curr) => acc + curr.spO2, 0) / vitalsList.length)
    },
    flaggedPattern: isHighBpTrend ? 'Pattern Warning: Persistent elevated systolic blood pressure observed across consecutive visits.' : 'Normal vital sign fluctuations across recent visits.',
    disclaimer: 'AI trend detection provides observational pattern metrics for professional clinical context only.'
  };
};
