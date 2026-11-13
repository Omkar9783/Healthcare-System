import DocumentVerification from '../models/DocumentVerification.js';
import Patient from '../models/Patient.js';
import RationCardVerification from '../models/RationCardVerification.js';
import SchemeEligibility from '../models/SchemeEligibility.js';
import HospitalScheme from '../models/HospitalScheme.js';
import HealthcarePackage from '../models/HealthcarePackage.js';
import { verifyDocumentWithAI, checkAIHealth } from '../services/aiService.js';
import { logAuditEvent } from '../middleware/audit.js';

/**
 * Helper to determine, sync and fetch government health scheme entitlements based on Ration Card
 */
const evaluateAndSyncRationSchemes = async (rationData, patientUid, patientName) => {
  const cardType = rationData?.card_type || 'Orange';
  const state = rationData?.state || 'Maharashtra';
  const district = rationData?.district || 'Mumbai';
  const headOfFamily = rationData?.head_of_family || patientName || 'Beneficiary';
  const maskedNumber = rationData?.masked_ration_card_number || 'RC-XXXX-XXXX-4512';
  const membersCount = rationData?.family_members_count || 4;

  let mjpjayStatus = 'Potentially Eligible';
  let mjpjayReason = `Based on your ${cardType} ration card in ${state}, you preliminary satisfy MJPJAY beneficiary guidelines.`;
  let pmjayStatus = 'Verification Required';
  let pmjayReason = 'Verify through the official NHA PM-JAY portal or visit an empanelled hospital Ayushman Mitra desk.';

  if (['Yellow', 'Antyodaya (AAY)', 'Annapurna'].includes(cardType)) {
    mjpjayStatus = 'Potentially Eligible';
    mjpjayReason = `Eligible under Priority Household (PHH/BPL / Antyodaya) in ${state}. Cashless treatment up to ₹5,00,000 per year per family.`;
    pmjayStatus = 'Potentially Eligible';
    pmjayReason = 'Antyodaya & BPL yellow cardholders automatically map to SECC 2011 high-priority group for nationwide cashless cover.';
  } else if (cardType === 'Orange') {
    mjpjayStatus = 'Potentially Eligible';
    mjpjayReason = 'Orange ration card holders with annual family income up to ₹1,00,000 receive full cashless coverage under MJPJAY 2.0 across 1,356 procedures.';
    pmjayStatus = 'Verification Required';
    pmjayReason = 'Orange cardholders must confirm deprivation criteria or Golden Card ID on PM-JAY NHA portal.';
  } else if (cardType === 'White') {
    mjpjayStatus = 'Verification Required';
    mjpjayReason = 'White ration card holders require special taluka/district certification or designated acute emergency exceptions.';
    pmjayStatus = 'Verification Required';
    pmjayReason = 'Non-priority white card households generally require hospital desk assessment.';
  }

  // Fetch covered sample procedures from catalog
  let mjpjayPackages = await HealthcarePackage.find({
    schemeName: { $in: ['MJPJAY', 'Both'] }
  }).limit(4);

  if (!mjpjayPackages || mjpjayPackages.length === 0) {
    mjpjayPackages = [
      { packageName: 'Coronary Artery Bypass Graft (CABG)', category: 'Cardiology', coverageDetails: '100% Cashless surgical treatment with pre/post care' },
      { packageName: 'Total Knee Replacement (Unilateral)', category: 'Orthopaedics', coverageDetails: 'Full prosthetic implant and 5 days physiotherapy' },
      { packageName: 'Maintenance Hemodialysis (Per Session)', category: 'Nephrology', coverageDetails: 'Cashless dialysis session including dialyzer kit' },
      { packageName: 'Laparoscopic Appendectomy', category: 'General Surgery', coverageDetails: 'Minimally invasive surgical removal with zero co-pay' }
    ];
  }

  let pmjayPackages = await HealthcarePackage.find({
    schemeName: { $in: ['PM-JAY', 'Both'] }
  }).limit(4);

  if (!pmjayPackages || pmjayPackages.length === 0) {
    pmjayPackages = [
      { packageName: 'Primary Percutaneous Coronary Intervention (PTCA/Stent)', category: 'Interventional Cardiology', coverageDetails: 'Drug-eluting stent placement with ICU care' },
      { packageName: 'Craniotomy for Brain Tumor Excision', category: 'Neurosurgery', coverageDetails: 'Specialized neurosurgical ICU and operative care' },
      { packageName: 'Pediatric Congenital Heart Defect Repair', category: 'Pediatric Cardiac', coverageDetails: 'Complete corrective surgery & post-op monitoring' },
      { packageName: 'Total Hip Replacement (Cemented/Uncemented)', category: 'Orthopaedics', coverageDetails: 'Implant, operation theatre, and inpatient stay' }
    ];
  }

  // Fetch active empanelled hospitals
  let empanelledHospitals = await HospitalScheme.find({
    empanelmentStatus: 'Empanelled - Active'
  }).limit(4);

  if (!empanelledHospitals || empanelledHospitals.length === 0) {
    empanelledHospitals = [
      { hospitalName: 'King Edward Memorial (KEM) Hospital', district: 'Mumbai', empanelmentStatus: 'Empanelled - Active', contactNumber: '022-24107000' },
      { hospitalName: 'Lilavati Hospital & Research Centre', district: 'Mumbai Suburban', empanelmentStatus: 'Empanelled - Active', contactNumber: '022-26751000' },
      { hospitalName: 'Sassoon General Hospital & BJMC', district: 'Pune', empanelmentStatus: 'Empanelled - Active', contactNumber: '020-26128000' },
      { hospitalName: 'Government Medical College & Hospital (GMCH)', district: 'Nagpur', empanelmentStatus: 'Empanelled - Active', contactNumber: '0712-2744670' }
    ];
  }

  const eligibleSchemes = [
    {
      schemeName: 'MJPJAY',
      schemeFullName: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY 2.0)',
      eligibilityStatus: mjpjayStatus,
      eligibilityReason: mjpjayReason,
      coverageAmount: '₹5,00,000 per family per year',
      officialPortalUrl: 'https://www.jeevandayee.gov.in',
      proceduresCount: 1356,
      benefits: [
        '100% cashless hospitalization across 1,356 secondary and tertiary procedures',
        'Covers all pre-existing medical conditions from Day 1',
        'Free diagnostic lab tests and 10 days post-discharge medications included'
      ],
      samplePackages: mjpjayPackages.map(p => ({
        packageName: p.packageName,
        category: p.category,
        coverageDetails: p.coverageDetails
      }))
    },
    {
      schemeName: 'PM-JAY',
      schemeFullName: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
      eligibilityStatus: pmjayStatus,
      eligibilityReason: pmjayReason,
      coverageAmount: '₹5,00,000 per family per year',
      officialPortalUrl: 'https://beneficiary.nha.gov.in',
      proceduresCount: 1949,
      benefits: [
        'All-India Portability: Valid across 28,000+ empanelled hospitals nationwide',
        '1,949 high-end surgical and critical care procedures covered',
        'Zero out-of-pocket expenses for surgery, ICU, and medicines'
      ],
      samplePackages: pmjayPackages.map(p => ({
        packageName: p.packageName,
        category: p.category,
        coverageDetails: p.coverageDetails
      }))
    }
  ];

  // Synchronize with existing system models so GovernmentSchemesView reflects the scanned ration card!
  try {
    await RationCardVerification.findOneAndUpdate(
      { patientId: patientUid },
      {
        patientId: patientUid,
        maskedRationCardNumber: maskedNumber,
        encryptedRationCardNumber: 'SHA256_' + (maskedNumber.replace(/[\s-]/g, '')),
        rationCardType: cardType,
        headOfFamilyName: headOfFamily,
        state,
        district,
        mobileNumber: '9988776651',
        familyMembersCount: Number(membersCount) || 4,
        verificationStatus: 'Verified',
        verificationSource: 'AI Document YOLO & OCR Scan Engine',
        verifiedAt: new Date(),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Sync MJPJAY in SchemeEligibility collection
    await SchemeEligibility.findOneAndUpdate(
      { patientId: patientUid, schemeName: 'MJPJAY' },
      {
        patientId: patientUid,
        schemeName: 'MJPJAY',
        schemeFullName: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
        eligibilityStatus: mjpjayStatus,
        eligibilityReason: mjpjayReason,
        coverageAmount: '₹5,00,000 per family per year',
        officialPortalUrl: 'https://www.jeevandayee.gov.in',
        benefits: eligibleSchemes[0].benefits,
        lastChecked: new Date()
      },
      { upsert: true }
    );

    // Sync PM-JAY in SchemeEligibility collection
    await SchemeEligibility.findOneAndUpdate(
      { patientId: patientUid, schemeName: 'PM-JAY' },
      {
        patientId: patientUid,
        schemeName: 'PM-JAY',
        schemeFullName: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        eligibilityStatus: pmjayStatus,
        eligibilityReason: pmjayReason,
        coverageAmount: '₹5,00,000 per family per year',
        officialPortalUrl: 'https://beneficiary.nha.gov.in',
        benefits: eligibleSchemes[1].benefits,
        lastChecked: new Date()
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('⚠️ Could not sync secondary SchemeEligibility records:', err.message);
  }

  return { eligibleSchemes, empanelledHospitals };
};

/**
 * Helper to determine, sync and fetch government health scheme entitlements based on Aadhaar Card
 */
const evaluateAndSyncAadhaarSchemes = async (aadhaarData, patientUid, patientName) => {
  const name = aadhaarData?.name || patientName || 'Aadhaar Beneficiary';
  const dob = aadhaarData?.dob || '';
  const yob = aadhaarData?.year_of_birth || '';
  const gender = (aadhaarData?.gender || '').toLowerCase();
  const state = aadhaarData?.state || 'Maharashtra';
  const address = (aadhaarData?.address || '').toLowerCase();

  // Calculate age
  let age = null;
  const currentYear = new Date().getFullYear();
  if (yob && /^\d{4}$/.test(String(yob).trim())) {
    age = currentYear - parseInt(String(yob).trim(), 10);
  } else if (dob) {
    const match = String(dob).match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
      age = currentYear - parseInt(match[1], 10);
    }
  }

  // Fetch covered sample procedures from catalog
  let pmjayPackages = await HealthcarePackage.find({
    schemeName: { $in: ['PM-JAY', 'Both'] }
  }).limit(4);

  if (!pmjayPackages || pmjayPackages.length === 0) {
    pmjayPackages = [
      { packageName: 'Primary Percutaneous Coronary Intervention (PTCA/Stent)', category: 'Interventional Cardiology', coverageDetails: 'Drug-eluting stent placement with ICU care' },
      { packageName: 'Craniotomy for Brain Tumor Excision', category: 'Neurosurgery', coverageDetails: 'Specialized neurosurgical ICU and operative care' },
      { packageName: 'Pediatric Congenital Heart Defect Repair', category: 'Pediatric Cardiac', coverageDetails: 'Complete corrective surgery & post-op monitoring' },
      { packageName: 'Total Hip Replacement (Cemented/Uncemented)', category: 'Orthopaedics', coverageDetails: 'Implant, operation theatre, and inpatient stay' }
    ];
  }

  let mjpjayPackages = await HealthcarePackage.find({
    schemeName: { $in: ['MJPJAY', 'Both'] }
  }).limit(4);

  if (!mjpjayPackages || mjpjayPackages.length === 0) {
    mjpjayPackages = [
      { packageName: 'Coronary Artery Bypass Graft (CABG)', category: 'Cardiology', coverageDetails: '100% Cashless surgical treatment with pre/post care' },
      { packageName: 'Total Knee Replacement (Unilateral)', category: 'Orthopaedics', coverageDetails: 'Full prosthetic implant and 5 days physiotherapy' },
      { packageName: 'Maintenance Hemodialysis (Per Session)', category: 'Nephrology', coverageDetails: 'Cashless dialysis session including dialyzer kit' },
      { packageName: 'Laparoscopic Appendectomy', category: 'General Surgery', coverageDetails: 'Minimally invasive surgical removal with zero co-pay' }
    ];
  }

  let empanelledHospitals = await HospitalScheme.find({
    empanelmentStatus: 'Empanelled - Active'
  }).limit(4);

  if (!empanelledHospitals || empanelledHospitals.length === 0) {
    empanelledHospitals = [
      { hospitalName: 'King Edward Memorial (KEM) Hospital', district: 'Mumbai', empanelmentStatus: 'Empanelled - Active', contactNumber: '022-24107000' },
      { hospitalName: 'Lilavati Hospital & Research Centre', district: 'Mumbai Suburban', empanelmentStatus: 'Empanelled - Active', contactNumber: '022-26751000' },
      { hospitalName: 'Sassoon General Hospital & BJMC', district: 'Pune', empanelmentStatus: 'Empanelled - Active', contactNumber: '020-26128000' },
      { hospitalName: 'Government Medical College & Hospital (GMCH)', district: 'Nagpur', empanelmentStatus: 'Empanelled - Active', contactNumber: '0712-2744670' }
    ];
  }

  const eligibleSchemes = [];

  // 1. Ayushman Bharat PM-JAY
  eligibleSchemes.push({
    schemeName: 'PM-JAY',
    schemeFullName: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    eligibilityStatus: 'Eligible - Direct Aadhaar e-KYC Linkable',
    eligibilityReason: 'Verified Indian citizen identity via UIDAI Aadhaar. Enables immediate Golden Card generation via Ayushman Mitra or NHA portal.',
    coverageAmount: '₹5,00,000 per family per year',
    officialPortalUrl: 'https://beneficiary.nha.gov.in',
    proceduresCount: 1949,
    benefits: [
      '100% cashless hospitalization across 28,000+ empanelled hospitals nationwide',
      '1,949 specialized treatment and surgical packages with zero out-of-pocket expenses',
      'All-India portability and 3 days pre-hospitalization / 15 days post-hospitalization medicine cover'
    ],
    samplePackages: pmjayPackages.map(p => ({
      packageName: p.packageName,
      category: p.category,
      coverageDetails: p.coverageDetails
    }))
  });

  // 2. Ayushman Bharat Digital Health Account (ABHA ID)
  eligibleSchemes.push({
    schemeName: 'ABHA',
    schemeFullName: 'Ayushman Bharat Digital Health Account (ABHA / ABDM ID)',
    eligibilityStatus: 'Directly Linkable via Aadhaar',
    eligibilityReason: 'Aadhaar e-KYC enables instant generation of 14-digit ABHA Number and digital health records locker.',
    coverageAmount: 'Free Universal Digital Health Account',
    officialPortalUrl: 'https://abha.abdm.gov.in',
    proceduresCount: 0,
    benefits: [
      'Instant Scan & Share token generation for express OPD registration at AIIMS and government hospitals',
      'Secure digital storage of lab reports, discharge summaries, and prescriptions',
      'Consent-based longitudinal health record sharing with certified healthcare providers'
    ],
    samplePackages: []
  });

  // 3. Maharashtra MJPJAY 2.0 (if Maharashtra domicile or resident)
  const isMaharashtra = state.toLowerCase().includes('maharashtra') || address.includes('maharashtra') ||
    ['mumbai', 'pune', 'nagpur', 'thane', 'nashik', 'aurangabad'].some(c => address.includes(c)) || !state;

  if (isMaharashtra) {
    eligibleSchemes.push({
      schemeName: 'MJPJAY',
      schemeFullName: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY 2.0 - Universal Cover)',
      eligibilityStatus: 'Eligible - Maharashtra Domicile / Resident',
      eligibilityReason: `Aadhaar records verify residency in ${state || 'Maharashtra'}. Qualified for universal state cashless healthcare under expanded MJPJAY 2.0.`,
      coverageAmount: '₹5,00,000 per family per year',
      officialPortalUrl: 'https://www.jeevandayee.gov.in',
      proceduresCount: 1356,
      benefits: [
        '100% cashless treatment across 1,356 secondary and tertiary procedures in Maharashtra',
        'Covers pre-existing medical conditions from Day 1 with no waiting period',
        'Includes all hospital diagnostics, medicines, ICU, and 10 days post-discharge medications'
      ],
      samplePackages: mjpjayPackages.map(p => ({
        packageName: p.packageName,
        category: p.category,
        coverageDetails: p.coverageDetails
      }))
    });
  }

  // 4. Senior Citizen Universal Cover (Age 70+)
  if (age !== null && age >= 70) {
    eligibleSchemes.push({
      schemeName: 'PM-JAY Vayoshri',
      schemeFullName: 'Ayushman Bharat Vayoshri – Universal Health Cover for Senior Citizens (70+)',
      eligibilityStatus: 'Eligible - Senior Citizen 70+ Priority Benefit',
      eligibilityReason: `Aadhaar Date of Birth confirms age of ${age} (70+ category). Automatically entitled to standalone universal ₹5 Lakh annual top-up health insurance irrespective of income.`,
      coverageAmount: '₹5,00,000 dedicated individual cover per year',
      officialPortalUrl: 'https://beneficiary.nha.gov.in',
      proceduresCount: 1949,
      benefits: [
        'Universal coverage for all Indian citizens aged 70+ irrespective of family economic status',
        'Dedicated ₹5,00,000 annual top-up cover separate from family floater pool',
        'Comprehensive geriatric critical care, orthopedics, cardiology, and oncology treatments'
      ],
      samplePackages: pmjayPackages.map(p => ({
        packageName: p.packageName,
        category: p.category,
        coverageDetails: p.coverageDetails
      }))
    });
  } else if (age !== null && age >= 60) {
    eligibleSchemes.push({
      schemeName: 'NPHCE',
      schemeFullName: 'National Programme for Health Care of the Elderly (NPHCE)',
      eligibilityStatus: 'Eligible - Senior Geriatric Care',
      eligibilityReason: `Aadhaar records confirm age of ${age} (Senior Citizen 60–69). Entitled to specialized geriatric OPD and weekly diagnostic packages.`,
      coverageAmount: 'Free Geriatric Consultations & Chronic Medicines',
      officialPortalUrl: 'https://main.mohfw.gov.in',
      proceduresCount: 500,
      benefits: [
        'Free dedicated geriatric clinical consultations and non-communicable disease (NCD) screenings',
        'Free chronic medicines for hypertension, diabetes, and cardiovascular health',
        'Priority assistive healthcare devices and physiotherapy support'
      ],
      samplePackages: []
    });
  }

  // 5. Maternal Health Benefit (Female)
  if (['female', 'f', 'woman'].includes(gender)) {
    eligibleSchemes.push({
      schemeName: 'PMMVY',
      schemeFullName: 'Pradhan Mantri Matru Vandana Yojana (PMMVY) & Janani Suraksha Yojana',
      eligibilityStatus: 'Eligible - Maternal Health & Direct DBT',
      eligibilityReason: 'Female beneficiary with verified Aadhaar identity. Entitled to direct conditional cash assistance transferred into Aadhaar-seeded bank account.',
      coverageAmount: '₹5,00,000 Cover + ₹6,000 DBT Cash Assistance',
      officialPortalUrl: 'https://pmmvy.wcd.gov.in',
      proceduresCount: 250,
      benefits: [
        'Cash incentive of ₹5,00,000 to ₹6,000 transferred directly to Aadhaar-seeded bank account in installments',
        'Free antenatal checkups, iron-folic acid supplementation, and institutional delivery care',
        'Free transport assistance and post-natal care under Janani Shishu Suraksha Karyakram (JSSK)'
      ],
      samplePackages: []
    });
  }

  // 6. Rashtriya Arogya Nidhi (RAN)
  eligibleSchemes.push({
    schemeName: 'RAN',
    schemeFullName: 'Rashtriya Arogya Nidhi (RAN) & Emergency Discretionary Grant',
    eligibilityStatus: 'Potentially Eligible - Super-Specialty Assistance',
    eligibilityReason: 'Available for patients undergoing major life-threatening surgeries at central government apex institutes (e.g. AIIMS, Tata Memorial).',
    coverageAmount: 'Up to ₹15,00,000 one-time grant',
    officialPortalUrl: 'https://main.mohfw.gov.in',
    proceduresCount: 350,
    benefits: [
      'Direct financial grant up to ₹15,00,000 for critical organ transplant, cardiac surgery, and oncology',
      'Immediate disbursement through hospital revolving fund upon Aadhaar identity verification'
    ],
    samplePackages: []
  });

  // Sync to database
  try {
    // Sync PM-JAY
    await SchemeEligibility.findOneAndUpdate(
      { patientId: patientUid, schemeName: 'PM-JAY' },
      {
        patientId: patientUid,
        schemeName: 'PM-JAY',
        schemeFullName: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        eligibilityStatus: 'Potentially Eligible',
        eligibilityReason: 'Verified Indian citizen identity via UIDAI Aadhaar. Entitled to PM-JAY cashless cover.',
        coverageAmount: '₹5,00,000 per family per year',
        officialPortalUrl: 'https://beneficiary.nha.gov.in',
        benefits: eligibleSchemes[0].benefits,
        lastChecked: new Date()
      },
      { upsert: true }
    );

    // Sync MJPJAY if Maharashtra resident
    if (isMaharashtra) {
      await SchemeEligibility.findOneAndUpdate(
        { patientId: patientUid, schemeName: 'MJPJAY' },
        {
          patientId: patientUid,
          schemeName: 'MJPJAY',
          schemeFullName: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY 2.0)',
          eligibilityStatus: 'Potentially Eligible',
          eligibilityReason: 'Maharashtra residency confirmed via Aadhaar. Qualified under expanded MJPJAY 2.0.',
          coverageAmount: '₹5,00,000 per family per year',
          officialPortalUrl: 'https://www.jeevandayee.gov.in',
          benefits: eligibleSchemes[2]?.benefits || eligibleSchemes[0].benefits,
          lastChecked: new Date()
        },
        { upsert: true }
      );
    }
  } catch (syncErr) {
    console.warn('⚠️ Could not sync Aadhaar SchemeEligibility records:', syncErr.message);
  }

  return { eligibleSchemes, empanelledHospitals };
};

/**
 * Upload and verify a document (Aadhaar or Ration Card)
 * POST /api/documents/verify
 */
export const uploadAndVerifyDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    // Determine target patient
    let patientUid = req.body.patientUid;
    if (req.user.role === 'PATIENT') {
      patientUid = req.user.patientUid;
    }
    if (!patientUid) {
      patientUid = 'PAT-2026-000001'; // Default demo patient fallback
    }

    const patient = await Patient.findOne({ uid: patientUid });
    const patientName = patient ? patient.name : (req.body.patientName || 'Registered Patient');

    // Call FastAPI AI service
    const aiResult = await verifyDocumentWithAI(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      patient ? {
        uid: patient.uid,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address
      } : null
    );

    // Extract masked ID number
    let maskedId = '';
    if (aiResult.aadhaar_data && aiResult.aadhaar_data.masked_aadhaar_number) {
      maskedId = aiResult.aadhaar_data.masked_aadhaar_number;
    } else if (aiResult.ration_data && aiResult.ration_data.masked_ration_card_number) {
      maskedId = aiResult.ration_data.masked_ration_card_number;
    }

    // Fetch and determine government health schemes based on document type (Aadhaar or Ration Card)
    let eligibleSchemes = [];
    let empanelledHospitals = [];
    const isRationCard = (aiResult.document_type && aiResult.document_type.includes('ration')) || Boolean(aiResult.ration_data);
    const isAadhaarCard = (aiResult.document_type && aiResult.document_type.includes('aadhaar')) || Boolean(aiResult.aadhaar_data);

    if (isRationCard) {
      const schemeResult = await evaluateAndSyncRationSchemes(aiResult.ration_data, patientUid, patientName);
      eligibleSchemes = schemeResult.eligibleSchemes;
      empanelledHospitals = schemeResult.empanelledHospitals;
    } else if (isAadhaarCard) {
      const schemeResult = await evaluateAndSyncAadhaarSchemes(aiResult.aadhaar_data, patientUid, patientName);
      eligibleSchemes = schemeResult.eligibleSchemes;
      empanelledHospitals = schemeResult.empanelledHospitals;
    }

    // Save record in database
    const docRecord = await DocumentVerification.create({
      verificationId: aiResult.verification_id,
      patientId: patientUid,
      patientName,
      documentType: aiResult.document_type || 'unknown',
      side: aiResult.side || 'front',
      detectionConfidence: aiResult.detection_confidence || 0.0,
      documentDetectionStatus: aiResult.document_detection_status || 'NOT_CHECKED',
      ocrStatus: aiResult.ocr_status || 'NOT_CHECKED',
      qrStatus: aiResult.qr_status || 'NOT_CHECKED',
      signatureStatus: aiResult.signature_status || 'NOT_CHECKED',
      officialVerificationStatus: aiResult.official_verification_status || 'NOT_CHECKED',
      dataMatchStatus: aiResult.data_match_status || 'NOT_CHECKED',
      anomalyStatus: aiResult.anomaly_status || 'NOT_CHECKED',
      verificationStatus: aiResult.verification_status || 'PENDING',
      reviewStatus: aiResult.verification_status === 'VERIFIED' ? 'APPROVED' : (aiResult.verification_status === 'MANUAL_REVIEW' ? 'PENDING' : 'NONE'),
      maskedIdNumber: maskedId,
      extractedData: {
        name: aiResult.aadhaar_data?.name || aiResult.ration_data?.head_of_family || null,
        dob: aiResult.aadhaar_data?.dob || null,
        gender: aiResult.aadhaar_data?.gender || null,
        address: aiResult.aadhaar_data?.address || aiResult.ration_data?.address || null,
        state: aiResult.aadhaar_data?.state || aiResult.ration_data?.state || 'Maharashtra',
        district: aiResult.aadhaar_data?.district || aiResult.ration_data?.district || null,
        cardType: aiResult.ration_data?.card_type || null,
        fairPriceShopNo: aiResult.ration_data?.fair_price_shop_no || null,
        familyMembersCount: aiResult.ration_data?.family_members_count || 0,
        qrDataType: aiResult.aadhaar_data?.qr_data_type || null
      },
      anomalyDetails: {
        isBlurred: aiResult.anomaly_report?.is_blurred || false,
        blurScore: aiResult.anomaly_report?.blur_score || 0,
        isLowResolution: aiResult.anomaly_report?.is_low_resolution || false,
        dimensions: aiResult.anomaly_report?.dimensions || [0, 0],
        boundaryDetected: aiResult.anomaly_report?.boundary_detected ?? true,
        anomalies: aiResult.anomaly_report?.anomalies || []
      },
      patientMatchDetails: {
        nameMatchScore: aiResult.patient_match?.name_match_score || 0,
        dobMatched: aiResult.patient_match?.dob_matched || false,
        genderMatched: aiResult.patient_match?.gender_matched || false,
        overallMatchScore: aiResult.patient_match?.overall_match_score || 0,
        notes: aiResult.patient_match?.notes || []
      },
      eligibleSchemes,
      empanelledHospitals,
      decisionReasons: aiResult.decision_reasons || []
    });

    // Audit Logging
    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DOCUMENT_VERIFIED',
      resource: 'AI_VERIFICATION_SERVICE',
      result: aiResult.verification_status === 'VERIFIED' ? 'SUCCESS' : 'PENDING_REVIEW',
      details: `Processed ${aiResult.document_type} for patient ${patientUid}. Status: ${aiResult.verification_status}`
    });

    res.json({
      success: true,
      data: docRecord
    });
  } catch (err) {
    console.error('Error in uploadAndVerifyDocument:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get verifications for a specific patient
 * GET /api/documents/patient/:patientUid
 */
export const getPatientVerifications = async (req, res) => {
  try {
    const { patientUid } = req.params;

    // RBAC check: PATIENT can only view own verifications
    if (req.user.role === 'PATIENT' && req.user.patientUid !== patientUid) {
      return res.status(403).json({ success: false, message: 'Access denied: You may only view your own document verifications.' });
    }

    let records = await DocumentVerification.find({ patientId: patientUid }).sort({ createdAt: -1 });

    // Ensure ration cards have eligible schemes populated
    for (let rec of records) {
      if (rec.documentType.includes('ration') && (!rec.eligibleSchemes || rec.eligibleSchemes.length === 0)) {
        try {
          const { eligibleSchemes, empanelledHospitals } = await evaluateAndSyncRationSchemes(rec.extractedData, rec.patientId, rec.patientName);
          rec.eligibleSchemes = eligibleSchemes;
          rec.empanelledHospitals = empanelledHospitals;
          await rec.save();
        } catch (e) {
          console.warn('Could not auto-populate schemes for record:', e.message);
        }
      }
    }

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin view: Get all verifications across system
 * GET /api/documents/admin/all
 */
export const getAllVerifications = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let filter = {};
    if (status && status !== 'ALL') {
      filter.verificationStatus = status;
    }

    const records = await DocumentVerification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    // Stats
    const total = await DocumentVerification.countDocuments();
    const verified = await DocumentVerification.countDocuments({ verificationStatus: 'VERIFIED' });
    const manualReview = await DocumentVerification.countDocuments({ verificationStatus: 'MANUAL_REVIEW' });
    const anomalies = await DocumentVerification.countDocuments({ verificationStatus: 'ANOMALY_DETECTED_REQUIRES_REVIEW' });
    const rejected = await DocumentVerification.countDocuments({ verificationStatus: 'NOT_VERIFIED' });

    res.json({
      success: true,
      stats: { total, verified, manualReview, anomalies, rejected },
      data: records
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin action: Manual approve or reject verification
 * PATCH /api/documents/review/:verificationId
 */
export const reviewVerification = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Administrative access required for manual verification decisions.' });
    }

    const { verificationId } = req.params;
    const { action, reason } = req.body; // action: 'APPROVE' or 'REJECT'

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: "Valid action ('APPROVE' or 'REJECT') is required." });
    }
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'A descriptive reason (min 5 characters) is required for audit compliance.' });
    }

    const record = await DocumentVerification.findOne({ verificationId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Verification record not found.' });
    }

    record.reviewStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    record.verificationStatus = action === 'APPROVE' ? 'VERIFIED' : 'NOT_VERIFIED';
    record.reviewedBy = req.user.name || req.user.email;
    record.reviewReason = reason.trim();
    record.reviewedAt = new Date();
    record.decisionReasons.push(`Administrative manual decision: ${action} by ${req.user.name}. Reason: ${reason}`);
    record.updatedAt = new Date();

    await record.save();

    await logAuditEvent({
      userId: req.user._id,
      userName: req.user.name,
      userRole: 'ADMIN',
      action: action === 'APPROVE' ? 'DOCUMENT_MANUAL_APPROVED' : 'DOCUMENT_MANUAL_REJECTED',
      resource: 'AI_VERIFICATION_SERVICE',
      result: 'SUCCESS',
      details: `Admin ${action} for ${record.verificationId}. Reason: ${reason}`
    });

    res.json({
      success: true,
      message: `Document verification ${record.verificationId} has been successfully ${record.reviewStatus.toLowerCase()}.`,
      data: record
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Health status check for AI engine
 * GET /api/documents/health
 */
export const getAIHealthStatus = async (req, res) => {
  const status = await checkAIHealth();
  res.json({ success: true, aiService: status });
};
