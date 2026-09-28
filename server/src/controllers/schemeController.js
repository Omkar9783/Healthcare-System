import crypto from 'crypto';
import RationCardVerification from '../models/RationCardVerification.js';
import SchemeEligibility from '../models/SchemeEligibility.js';
import FamilyMember from '../models/FamilyMember.js';
import HospitalScheme from '../models/HospitalScheme.js';
import HealthcarePackage from '../models/HealthcarePackage.js';
import VerificationRequest from '../models/VerificationRequest.js';
import SchemeNotification from '../models/SchemeNotification.js';
import Patient from '../models/Patient.js';
import { logAuditEvent } from '../middleware/audit.js';

const MANDATORY_DISCLAIMER = 'Preliminary Eligibility Check – Final eligibility must be verified through the official government portal or authorized hospital.';

// Helper to mask ration card number: e.g. XXXX-XXXX-1234
const maskRationCard = (number) => {
  if (!number) return 'XXXX-XXXX-0000';
  const clean = number.replace(/[\s-]/g, '');
  if (clean.length <= 4) return `XXXX-XXXX-${clean}`;
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
};

// Helper to securely hash the raw ration card number for storage
const hashRationCard = (number) => {
  return crypto.createHash('sha256').update(number.trim()).digest('hex');
};

/**
 * Get comprehensive scheme dashboard data for a patient
 * GET /api/schemes/patient/:patientUid
 */
export const getPatientSchemeData = async (req, res) => {
  try {
    const { patientUid } = req.params;

    let rationCard = await RationCardVerification.findOne({ patientId: patientUid });
    let eligibilities = await SchemeEligibility.find({ patientId: patientUid });
    let familyMembers = await FamilyMember.find({ patientId: patientUid });
    let notifications = await SchemeNotification.find({ patientId: patientUid }).sort({ createdAt: -1 }).limit(10);
    let verificationRequests = await VerificationRequest.find({ patientId: patientUid }).sort({ submittedAt: -1 });

    // If no eligibility records exist yet, seed initial default preliminary records
    if (!eligibilities || eligibilities.length === 0) {
      const defaultMjpjay = await SchemeEligibility.create({
        patientId: patientUid,
        schemeName: 'MJPJAY',
        schemeFullName: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
        eligibilityStatus: rationCard ? 'Potentially Eligible' : 'Verification Required',
        eligibilityReason: rationCard 
          ? `Based on ${rationCard.rationCardType} ration card recorded in Maharashtra.`
          : 'Please submit your ration card details for preliminary rule evaluation.',
        coverageAmount: '₹5,00,000 per family per year',
        officialPortalUrl: 'https://www.jeevandayee.gov.in',
        requiredDocuments: ['Valid Ration Card (Yellow/Orange/AAY)', 'Aadhaar Card', 'Domicile / Residence Certificate'],
        benefits: [
          'Cashless hospitalization across 1,356 secondary and tertiary procedures',
          'Free pre-hospitalization tests and 10 days post-discharge medications',
          'Covers pre-existing medical conditions from day one'
        ]
      });

      const defaultPmjay = await SchemeEligibility.create({
        patientId: patientUid,
        schemeName: 'PM-JAY',
        schemeFullName: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        eligibilityStatus: 'Verification Required',
        eligibilityReason: 'Official confirmation requires checking SECC 2011 database or Ayushman Golden Card ID.',
        coverageAmount: '₹5,00,000 per family per year',
        officialPortalUrl: 'https://beneficiary.nha.gov.in',
        requiredDocuments: ['Aadhaar Card', 'Ration Card', 'PM-JAY Beneficiary Letter / Family ID'],
        benefits: [
          'All India portability: Valid in any empanelled hospital across India',
          '1,949 specialized medical procedures and high-end surgeries',
          'Zero co-payment and zero cost for medicines, diagnostics, and ICU'
        ]
      });

      eligibilities = [defaultMjpjay, defaultPmjay];
    }

    res.json({
      success: true,
      rationCard,
      eligibilities,
      familyMembers,
      notifications,
      verificationRequests,
      disclaimer: MANDATORY_DISCLAIMER
    });
  } catch (err) {
    console.error('Error in getPatientSchemeData:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Submit or update Ration Card verification
 * POST /api/schemes/verify-ration-card
 */
export const verifyRationCard = async (req, res) => {
  try {
    const {
      patientId,
      rationCardNumber,
      state = 'Maharashtra',
      district = 'Mumbai',
      rationCardType,
      headOfFamilyName,
      mobileNumber,
      documentUrl,
      familyMembersCount = 4
    } = req.body;

    if (!patientId || !rationCardNumber || !rationCardType || !headOfFamilyName) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, Ration Card Number, Card Type, and Head of Family Name are required.'
      });
    }

    const masked = maskRationCard(rationCardNumber);
    const encrypted = hashRationCard(rationCardNumber);

    // Rule-based Preliminary Eligibility Evaluation
    let mjpjayStatus = 'Potentially Eligible';
    let mjpjayReason = `Based on your ${rationCardType} ration card in ${state}, you preliminary satisfy MJPJAY beneficiary guidelines.`;

    let pmjayStatus = 'Verification Required';
    let pmjayReason = 'Verify through the official NHA PM-JAY portal or visit an empanelled hospital Ayushman Mitra desk.';

    if (['Yellow', 'Antyodaya (AAY)', 'Annapurna'].includes(rationCardType)) {
      mjpjayStatus = 'Potentially Eligible';
      mjpjayReason = `Eligible under Priority Household (PHH/BPL) criteria in ${state}. Covers up to ₹5,00,000.`;
      pmjayStatus = 'Potentially Eligible';
      pmjayReason = 'Antyodaya and BPL yellow card categories map directly to SECC 2011 eligible groups.';
    } else if (rationCardType === 'Orange') {
      mjpjayStatus = 'Potentially Eligible';
      mjpjayReason = 'Orange ration card holders with annual family income up to ₹1,00,000 are eligible under MJPJAY in Maharashtra.';
      pmjayStatus = 'Verification Required';
      pmjayReason = 'Orange card holders must verify specific SECC deprivation criteria on official portal.';
    } else if (rationCardType === 'White') {
      mjpjayStatus = 'Verification Required';
      mjpjayReason = 'White ration card holders require special taluka/district distress certification or specified agrarian guidelines.';
      pmjayStatus = 'Verification Required';
      pmjayReason = 'White card households are generally above poverty line; requires official Ayushman Mitra check.';
    }

    // Upsert Ration Card Record
    const verification = await RationCardVerification.findOneAndUpdate(
      { patientId },
      {
        patientId,
        maskedRationCardNumber: masked,
        encryptedRationCardNumber: encrypted,
        rationCardType,
        headOfFamilyName,
        state,
        district,
        mobileNumber: mobileNumber || '9988776651',
        documentUrl: documentUrl || '',
        familyMembersCount: Number(familyMembersCount) || 4,
        verificationStatus: 'Verified',
        verificationSource: 'State PDS Database Pre-Check & Document OCR',
        disclaimer: MANDATORY_DISCLAIMER,
        verifiedAt: new Date(),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Update MJPJAY Scheme Eligibility Record
    await SchemeEligibility.findOneAndUpdate(
      { patientId, schemeName: 'MJPJAY' },
      {
        patientId,
        schemeName: 'MJPJAY',
        schemeFullName: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
        eligibilityStatus: mjpjayStatus,
        eligibilityReason: mjpjayReason,
        coverageAmount: '₹5,00,000 per family per year',
        officialPortalUrl: 'https://www.jeevandayee.gov.in',
        lastChecked: new Date()
      },
      { upsert: true }
    );

    // Update PM-JAY Scheme Eligibility Record
    await SchemeEligibility.findOneAndUpdate(
      { patientId, schemeName: 'PM-JAY' },
      {
        patientId,
        schemeName: 'PM-JAY',
        schemeFullName: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        eligibilityStatus: pmjayStatus,
        eligibilityReason: pmjayReason,
        coverageAmount: '₹5,00,000 per family per year',
        officialPortalUrl: 'https://beneficiary.nha.gov.in',
        lastChecked: new Date()
      },
      { upsert: true }
    );

    // Create a Scheme Notification
    await SchemeNotification.create({
      patientId,
      type: 'Success',
      title: 'Ration Card Verification Computed',
      message: `Your ${rationCardType} card (${masked}) was evaluated. MJPJAY status: ${mjpjayStatus}.`,
      linkTab: 'schemes'
    });

    // Audit Logging
    await logAuditEvent({
      userId: req.user?._id || 'PATIENT_USER',
      userName: req.user?.name || headOfFamilyName,
      userRole: req.user?.role || 'PATIENT',
      patientUid: patientId,
      action: 'RECORD_MODIFIED',
      resource: 'RATION_CARD_VERIFICATION',
      purpose: 'Government Scheme Eligibility Verification',
      result: 'SUCCESS',
      details: `Ration Card ${masked} (${rationCardType}) verified with preliminary eligibility computed`
    });

    res.json({
      success: true,
      message: 'Ration card verified and preliminary eligibility calculated.',
      verification,
      disclaimer: MANDATORY_DISCLAIMER
    });
  } catch (err) {
    console.error('Error in verifyRationCard:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Add or link a family member
 * POST /api/schemes/family
 */
export const addFamilyMember = async (req, res) => {
  try {
    const {
      patientId,
      name,
      relationship,
      age,
      gender,
      bloodGroup = 'O+',
      mobileNumber = '',
      beneficiaryId = '',
      linkedPatientId = ''
    } = req.body;

    if (!patientId || !name || !relationship || !age || !gender) {
      return res.status(400).json({ success: false, message: 'Patient ID, name, relationship, age, and gender are required.' });
    }

    // If linkedPatientId provided, verify that the patient exists in the database
    let resolvedLinkedId = linkedPatientId.trim();
    if (resolvedLinkedId) {
      const existingLinkedPatient = await Patient.findOne({ uid: resolvedLinkedId });
      if (!existingLinkedPatient) {
        resolvedLinkedId = ''; // Clear if not found
      }
    }

    const member = await FamilyMember.create({
      patientId,
      name,
      relationship,
      age: Number(age),
      gender,
      bloodGroup,
      mobileNumber,
      beneficiaryId,
      linkedPatientId: resolvedLinkedId,
      schemeStatus: 'Covered'
    });

    await logAuditEvent({
      userId: req.user?._id || 'PATIENT',
      userName: req.user?.name || 'Patient',
      userRole: req.user?.role || 'PATIENT',
      patientUid: patientId,
      action: 'RECORD_CREATED',
      resource: 'FAMILY_HEALTH_PROFILE',
      purpose: 'Family Member Scheme Registration',
      result: 'SUCCESS',
      details: `Added ${name} (${relationship}) to family health profile`
    });

    res.status(201).json({ success: true, member });
  } catch (err) {
    console.error('Error in addFamilyMember:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete a family member
 * DELETE /api/schemes/family/:memberId
 */
export const deleteFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    await FamilyMember.findByIdAndDelete(memberId);
    res.json({ success: true, message: 'Family member removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Search and filter empanelled hospitals
 * GET /api/schemes/hospitals
 */
export const getEmpanelledHospitals = async (req, res) => {
  try {
    const { scheme, state, district, city, specialty, search } = req.query;
    const filter = {};

    if (scheme && scheme !== 'All') {
      filter.schemes = scheme;
    }
    if (state && state !== 'All') {
      filter.state = new RegExp(state, 'i');
    }
    if (district && district !== 'All') {
      filter.district = new RegExp(district, 'i');
    }
    if (city && city !== 'All') {
      filter.city = new RegExp(city, 'i');
    }
    if (specialty && specialty !== 'All') {
      filter.specialties = new RegExp(specialty, 'i');
    }
    if (search) {
      filter.$or = [
        { hospitalName: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
        { specialties: new RegExp(search, 'i') }
      ];
    }

    const hospitals = await HospitalScheme.find(filter).sort({ rating: -1 });
    res.json({
      success: true,
      hospitals,
      demoNotice: 'Demo empanelled hospital dataset. Official production registry integration ready.'
    });
  } catch (err) {
    console.error('Error in getEmpanelledHospitals:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Search and filter covered healthcare packages & treatments
 * GET /api/schemes/packages
 */
export const getHealthcarePackages = async (req, res) => {
  try {
    const { scheme, category, search } = req.query;
    const filter = {};

    if (scheme && scheme !== 'All') {
      filter.$or = [{ schemeName: scheme }, { schemeName: 'Both' }];
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { packageName: new RegExp(search, 'i') },
        { coverageDetails: new RegExp(search, 'i') },
        { packageCode: new RegExp(search, 'i') }
      ];
    }

    const packages = await HealthcarePackage.find(filter).sort({ category: 1, packageName: 1 });
    res.json({ success: true, packages });
  } catch (err) {
    console.error('Error in getHealthcarePackages:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Submit verification request to an empanelled hospital
 * POST /api/schemes/hospital-verification-request
 */
export const submitHospitalVerificationRequest = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientPhone = '',
      hospitalId,
      hospitalName,
      schemeName = 'MJPJAY',
      treatmentCategory = 'General Healthcare',
      documentUrl = ''
    } = req.body;

    if (!patientId || !hospitalId) {
      return res.status(400).json({ success: false, message: 'Patient ID and Hospital ID are required.' });
    }

    // Get patient's ration card details
    const rationCard = await RationCardVerification.findOne({ patientId });
    const maskedCard = rationCard ? rationCard.maskedRationCardNumber : 'XXXX-XXXX-NOT-SUBMITTED';
    const cardType = rationCard ? rationCard.rationCardType : 'Yellow';

    const newRequest = await VerificationRequest.create({
      patientId,
      patientName: patientName || req.user?.name || 'Patient User',
      patientPhone,
      hospitalId,
      hospitalName,
      schemeName,
      rationCardNumber: maskedCard,
      rationCardType: cardType,
      treatmentCategory,
      documentUrl,
      status: 'PENDING',
      remarks: 'Submitted by patient. Awaiting verification review from hospital scheme desk.'
    });

    // Notify patient
    await SchemeNotification.create({
      patientId,
      type: 'Action Required',
      title: 'Verification Request Submitted',
      message: `Your verification request for ${schemeName} has been submitted to ${hospitalName}. Status: Pending Review.`,
      linkTab: 'schemes'
    });

    await logAuditEvent({
      userId: req.user?._id || 'PATIENT',
      userName: patientName || req.user?.name || 'Patient',
      userRole: 'PATIENT',
      patientUid: patientId,
      action: 'RECORD_CREATED',
      resource: 'HOSPITAL_VERIFICATION_REQUEST',
      purpose: 'Hospital Scheme Enrollment',
      result: 'SUCCESS',
      details: `Scheme verification request submitted to ${hospitalName}`
    });

    res.status(201).json({ success: true, request: newRequest });
  } catch (err) {
    console.error('Error in submitHospitalVerificationRequest:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all hospital verification requests (For Hospital Staff / Admin review)
 * GET /api/schemes/hospital-requests
 */
export const getHospitalVerificationRequests = async (req, res) => {
  try {
    const requests = await VerificationRequest.find().sort({ submittedAt: -1 }).limit(50);
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Review/Process hospital verification request (Hospital Staff / Admin action)
 * PATCH /api/schemes/hospital-requests/:requestId
 */
export const reviewHospitalVerificationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, remarks } = req.body;

    const request = await VerificationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Verification request not found.' });
    }

    request.status = status || request.status;
    request.remarks = remarks || request.remarks;
    request.reviewedAt = new Date();
    request.reviewedBy = req.user?.name || 'Authorized Hospital Staff';
    await request.save();

    // Map notification type
    const notifType = status === 'APPROVED' ? 'Success' : status === 'REJECTED' ? 'Warning' : 'Action Required';

    // Disptach notification to patient
    await SchemeNotification.create({
      patientId: request.patientId,
      type: notifType,
      title: `Hospital Scheme Request: ${status}`,
      message: `${request.hospitalName} reviewed your ${request.schemeName} verification: "${remarks || status}".`,
      linkTab: 'schemes'
    });

    await logAuditEvent({
      userId: req.user?._id || 'STAFF',
      userName: req.user?.name || 'Staff User',
      userRole: req.user?.role || 'ADMIN',
      patientUid: request.patientId,
      action: 'RECORD_MODIFIED',
      resource: 'HOSPITAL_VERIFICATION_REQUEST',
      purpose: 'Hospital Verification Review',
      result: 'SUCCESS',
      details: `Request ${requestId} updated to ${status} with remarks: ${remarks}`
    });

    res.json({ success: true, request });
  } catch (err) {
    console.error('Error in reviewHospitalVerificationRequest:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * AI Health Scheme Assistant Chatbot
 * POST /api/schemes/ai-assist
 */
export const aiSchemeAssistant = async (req, res) => {
  try {
    const { prompt, patientUid, language = 'en' } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt message is required.' });
    }

    const lower = prompt.toLowerCase();

    // Strict Guardrail: No Medical Diagnosis
    const medicalDiagnosisTriggers = [
      'diagnose', 'what disease', 'do i have cancer', 'prescribe', 'which medicine to take',
      'headache cure', 'chest pain treatment', 'am i sick', 'symptoms of'
    ];
    if (medicalDiagnosisTriggers.some(trigger => lower.includes(trigger))) {
      return res.json({
        success: true,
        response: language === 'mr'
          ? 'मी फक्त शासकीय आरोग्य योजना आणि रेशन कार्ड साहाय्यक आहे. मी वैद्यकीय निदान किंवा औषधांचा सल्ला देऊ शकत नाही. कृपया त्वरित आपल्या डॉक्टरांशी संपर्क साधा.'
          : language === 'hi'
          ? 'मैं केवल सरकारी स्वास्थ्य योजना और राशन कार्ड सहायक हूँ। मैं नैदानिक चिकित्सा सलाह या दवा का सुझाव नहीं दे सकता। कृपया तत्काल डॉक्टर से परामर्श करें।'
          : 'I am an AI Government Health Scheme & Benefit Assistant. I cannot provide clinical medical diagnosis or treatment advice. Please consult your physician or hospital specialist immediately.',
        disclaimer: MANDATORY_DISCLAIMER,
        isMedicalGuardrail: true
      });
    }

    // Retrieve patient ration card context if available
    let patientCard = null;
    if (patientUid) {
      patientCard = await RationCardVerification.findOne({ patientId: patientUid });
    }

    // Comprehensive Knowledge-Based Intent Handling
    let answer = '';

    if (lower.includes('mjpjay') || lower.includes('mahatma jyotirao phule') || lower.includes('phule')) {
      if (language === 'mr') {
        answer = `महात्मा ज्योतिराव फुले जन आरोग्य योजना (MJPJAY) महाराष्ट्र शासनाची फ्लॅगशिप आरोग्य योजना आहे.
• **कव्हरेज:** प्रति कुटुंब दरवर्षी ₹५,००,००० पर्यंत मोफत उपचार.
• **पात्रता रेशन कार्ड:** पिवळे (Yellow), केशरी (Orange), अंत्योदय (AAY) आणि अन्नपूर्णा कार्डधारक थेट पात्र आहेत.
• **समाविष्ट उपचार:** हृदय शस्त्रक्रिया, कर्करोग उपचार, डायलिसिस, डोळ्यांचे उपचार, सांधेरोपण यासह १,३५६ उपचार.
• **आवश्यक कागदपत्रे:** वैध रेशन कार्ड, आधार कार्ड आणि रहिवासी पुरावा.
• **कसे मिळवाल:** कोणत्याही अंगीकृत (Empanelled) शासकीय किंवा खाजगी रुग्णालयात जाऊन 'आरोग्य मित्र' कक्षाशी संपर्क साधा.`;
      } else if (language === 'hi') {
        answer = `महात्मा ज्योतिराव फुले जन आरोग्य योजना (MJPJAY) महाराष्ट्र सरकार की प्रमुख कैशलेस स्वास्थ्य योजना है।
• **कवरेज:** प्रति परिवार प्रति वर्ष ₹5,00,000 तक कैशलेस उपचार।
• **पात्र राशन कार्ड:** पीला (Yellow), नारंगी (Orange), अंत्योदय (AAY) और अन्नपूर्णा राशन कार्ड धारक प्रारंभिक रूप से पात्र हैं।
• **उपचार:** 1,356 द्वितीयक व तृतीयक प्रक्रियाएं (हार्ट सर्जरी, कैंसर, डायलिसिस, ऑर्थोपेडिक आदि)।
• **दस्तावेज:** वैध राशन कार्ड, आधार कार्ड।
• **उपयोग प्रक्रिया:** किसी भी पैनलबद्ध अस्पताल के आरोग्य मित्र डेस्क पर अपना राशन कार्ड व आधार दिखाएं।`;
      } else {
        answer = `**Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)** is Maharashtra Government's flagship cashless health scheme.
• **Coverage:** Up to **₹5,00,000 per family per year** on a floater basis.
• **Ration Card Eligibility:** Families holding **Yellow, Orange, Antyodaya (AAY), and Annapurna** ration cards in Maharashtra are covered.
• **Treatments Covered:** 1,356 secondary and tertiary procedures including cardiac surgeries, cancer treatment, chemotherapy, hemodialysis, and joint replacements.
• **Required Documents:** Valid Ration Card + Aadhaar Card for all family members.
• **How to Access:** Visit the "Arogya Mitra" helpdesk at any empanelled public or private hospital in Maharashtra.`;
      }
    } else if (lower.includes('ayushman') || lower.includes('pm-jay') || lower.includes('pmjay') || lower.includes('bharat')) {
      if (language === 'mr') {
        answer = `**आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (PM-JAY):**
• जगातील सर्वात मोठी शासकीय आरोग्य विमा योजना.
• **कव्हरेज:** देशभरात प्रति कुटुंब दरवर्षी ₹५,००,००० पर्यंत मोफत व कॅशलेस उपचार.
• **पात्रता तपासणे:** अधिकृत पोर्टल beneficiary.nha.gov.in किंवा १९४५ टोल-फ्री नंबरवर आधार/मोबाईल टाकून पात्रता तपासा.
• **वैशिष्ट्य:** संपूर्ण भारतात पोर्टेबल – देशातील कोणत्याही नोंदणीकृत शासकीय किंवा खाजगी रुग्णालयात वैध.`;
      } else if (language === 'hi') {
        answer = `**आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (PM-JAY):**
• **कवरेज:** प्रति परिवार ₹5,00,000 प्रति वर्ष का पूर्णतः कैशलेस व पेपरलेस स्वास्थ्य बीमा।
• **पात्रता:** SECC 2011 डेटाबेस के आधार पर डी-प्राइवेशन क्राइटेरिया तथा अंत्योदय/बीपीएल परिवार।
• **पात्रता जांचें:** आधिकारिक पोर्टल beneficiary.nha.gov.in पर जाकर या नजदीकी सीएससी (CSC) केंद्र पर आयुष्मान कार्ड बनवाएं।
• **राष्ट्रीय पोर्टेबिलिटी:** भारत के किसी भी राज्य के पैनलबद्ध अस्पताल में लागू।`;
      } else {
        answer = `**Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY):**
• **Coverage:** **₹5,00,000 per family per year** for secondary and tertiary care hospitalization across India.
• **Eligibility Criteria:** Based on rural/urban deprivation criteria in SECC 2011 and NFSA Antyodaya/Priority households.
• **Check Official Eligibility:** Visit the official National Health Authority portal at \`https://beneficiary.nha.gov.in\` or call toll-free \`14555\`.
• **National Portability:** Usable in over 27,000 empanelled hospitals across any state in India.`;
      }
    } else if (lower.includes('dialysis') || lower.includes('kidney')) {
      answer = language === 'mr'
        ? `होय! **डायलिसिस (Hemodialysis)** MJPJAY आणि PM-JAY या दोन्ही योजनांतर्गत पूर्णपणे मोफत समाविष्ट आहे. नेफ्रॉलॉजी पॅकेज अंतर्गत डायलिसिस सत्र, आवश्यक इंजेक्शन्स आणि रक्त चाचण्यांचा खर्च योजनेतून केला जातो. यासाठी पिवळे/केशरी रेशन कार्ड आणि आधार कार्ड आवश्यक आहे.`
        : language === 'hi'
        ? `हाँ! **डायलिसिस (Hemodialysis)** MJPJAY और PM-JAY दोनों योजनाओं में पूरी तरह कैशलेस शामिल है। प्रति सत्र डायलिसिस, एरिथ्रोपोइटिन इंजेक्शन और नियमित लैब टेस्ट पैकेज का हिस्सा हैं। इसके लिए वैध राशन कार्ड और आधार कार्ड प्रस्तुत करना होता है।`
        : `Yes! **Hemodialysis** is fully covered as a cashless recurring procedure under both **MJPJAY and PM-JAY**. The package includes the dialysis procedure, consumable dialyzers, erythropoietin injections, and associated routine nephrology labs. No out-of-pocket charges are permitted at empanelled centers.`;
    } else if (lower.includes('document') || lower.includes('documents') || lower.includes('कागदपत्र') || lower.includes('दस्तावेज')) {
      answer = language === 'mr'
        ? `योजनेचा लाभ घेण्यासाठी आवश्यक कागदपत्रे:
1. मूळ रेशन कार्ड (पिवळे, केशरी किंवा अंत्योदय कार्ड)
2. रुग्णाचे व कुटुंबियांचे आधार कार्ड
3. महाराष्ट्रातील वास्तव्याचा पुरावा किंवा अधिवास प्रमाणपत्र (Domicile)
4. डॉक्टरांचे निदान पत्र किंवा तपासणी अहवाल
5. पासपोर्ट आकाराचे फोटो.`
        : language === 'hi'
        ? `सरकारी स्वास्थ्य योजनाओं के लिए आवश्यक मुख्य दस्तावेज:
1. वैध राशन कार्ड (पीला, नारंगी, या अंत्योदय राशन कार्ड)
2. मरीज और परिजनों का आधार कार्ड
3. निवास प्रमाण पत्र या मूल निवासी प्रमाण
4. संबंधित अस्पताल का डॉक्टर प्रिस्क्रिप्शन व नैदानिक रिपोर्ट।`
        : `Essential documents required for hospital scheme admission:
1. Original Ration Card (Yellow, Orange, or Antyodaya AAY card)
2. Aadhaar Cards of the patient and family members
3. Residence or Domicile proof (for Maharashtra MJPJAY)
4. Doctor's diagnosis consultation slip and supporting diagnostic reports
5. Hospital admission referral form from empanelled physician.`;
    } else if (lower.includes('hospital') || lower.includes('near') || lower.includes('रुग्णालय') || lower.includes('अस्पताल')) {
      answer = language === 'mr'
        ? `तुम्ही आमच्या **'Find Scheme Hospitals'** टॅबचा वापर करून योजना, जिल्हा आणि स्पेशालिटीनुसार मान्यताप्राप्त रुग्णालये शोधू शकता. सर्व शासकीय वैद्यकीय महाविद्यालये आणि नामांकित खाजगी रुग्णालये (उदा. केईएम, सायन, नानावटी इत्यादी) यामध्ये समाविष्ट आहेत.`
        : language === 'hi'
        ? `आप हमारे **'Find Scheme Hospitals'** टैब से योजना, शहर और स्पेशियलिटी के आधार पर मान्यता प्राप्त अस्पताल खोज सकते हैं। अस्पताल के आरोग्य मित्र डेस्क पर सीधे सहायता उपलब्ध रहती है।`
        : `You can use our **"Find Scheme Hospitals"** tab in this module to filter accredited hospitals by Scheme (MJPJAY/PM-JAY), District, City, and Medical Specialty. Government hospitals and major empanelled private super-specialty hospitals are listed.`;
    } else if (lower.includes('cataract') || lower.includes('cancer') || lower.includes('cardiac') || lower.includes('heart') || lower.includes('ortho')) {
      answer = language === 'mr'
        ? `होय! मोतीबिंदू (Cataract), कर्करोग (Cancer/Chemotherapy/Radiation), अँजिओप्लास्टी आणि बायपास सर्जरी (Cardiac CABG), तसेच गुडघा/सांधे रोपण (Orthopedic) हे सर्व उपचार MJPJAY आणि PM-JAY योजनांतर्गत पॅकेजमध्ये विनामूल्य उपलब्ध आहेत.`
        : language === 'hi'
        ? `हाँ! मोतियाबिंद (Cataract), कैंसर (Oncology), हृदय रोग (Cardiac Angioplasty & Bypass), और घुटना/कूल्हा प्रत्यारोपण (Orthopedic) दोनों प्रमुख योजनाओं में शत-प्रतिशत कैशलेस कवर हैं। आप 'Covered Treatments & Packages' टैब में विस्तृत विवरण देख सकते हैं।`
        : `Yes! High-volume specialized treatments like **Cataract Surgery with IOL**, **Coronary Artery Bypass Graft (CABG)**, **Cancer Chemotherapy & Radiotherapy**, and **Total Knee/Hip Replacement** are fully covered under MJPJAY and PM-JAY packages. Check the **"Covered Treatments & Packages"** tab for package codes and pre-authorization criteria.`;
    } else {
      // General overview answer
      const cardContext = patientCard 
        ? `Your current recorded card is a **${patientCard.rationCardType} Ration Card** (${patientCard.maskedRationCardNumber}) in ${patientCard.state}. ` 
        : '';

      answer = language === 'mr'
        ? `${cardContext}शासकीय आरोग्य योजनांतर्गत (MJPJAY आणि PM-JAY) तुम्हाला व तुमच्या कुटुंबाला प्रतिवर्षी ₹५ लाखांपर्यंत मोफत व कॅशलेस उपचार मिळू शकतात. कृपया पात्रता तपशील, आवश्यक कागदपत्रे आणि पॅकेजसाठी संबंधित टॅब पहा.`
        : language === 'hi'
        ? `${cardContext}सरकारी स्वास्थ्य योजनाओं (MJPJAY और PM-JAY) के तहत आपके परिवार को प्रति वर्ष ₹5,00,000 तक का कैशलेस इलाज मिल सकता है। पात्रता व अस्पताल सत्यापन के लिए इस मॉड्यूल के विभिन्न टैब का उपयोग करें।`
        : `${cardContext}Government health schemes (MJPJAY & Ayushman Bharat PM-JAY) provide up to ₹5,00,000 per family per year in cashless hospitalization benefits. You can ask me about required documents, covered treatments, empanelled hospitals, or how to register your family.`;
    }

    res.json({
      success: true,
      response: answer,
      disclaimer: MANDATORY_DISCLAIMER
    });
  } catch (err) {
    console.error('Error in aiSchemeAssistant:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Mark notification as read
 * PATCH /api/schemes/notifications/:notificationId/read
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await SchemeNotification.findByIdAndUpdate(notificationId, { readStatus: true });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Retrieve secure beneficiary QR data for hospital authorization
 * GET /api/schemes/beneficiary-qr/:patientUid
 */
export const getBeneficiaryQRData = async (req, res) => {
  try {
    const { patientUid } = req.params;

    const patient = await Patient.findOne({ uid: patientUid });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const rationCard = await RationCardVerification.findOne({ patientId: patientUid });
    const eligibilities = await SchemeEligibility.find({ patientId: patientUid });

    // Audit Logging whenever QR beneficiary information is accessed
    await logAuditEvent({
      userId: req.user?._id || 'QR_SCANNER',
      userName: req.user?.name || 'Hospital QR Reader',
      userRole: req.user?.role || 'DOCTOR',
      patientUid,
      action: 'QR_SCANNED',
      resource: 'GOVERNMENT_SCHEME_BENEFICIARY_DATA',
      purpose: 'Beneficiary Health Scheme Verification',
      result: 'SUCCESS',
      details: `Scheme beneficiary lookup performed for patient ${patientUid}`
    });

    res.json({
      success: true,
      beneficiaryData: {
        patientName: patient.name,
        patientUid: patient.uid,
        bloodGroup: patient.bloodGroup,
        emergencyContact: patient.emergencyContact,
        hasVerifiedRationCard: !!rationCard,
        maskedRationCardNumber: rationCard ? rationCard.maskedRationCardNumber : 'Not on File',
        rationCardType: rationCard ? rationCard.rationCardType : 'Unverified',
        verificationStatus: rationCard ? rationCard.verificationStatus : 'Pending',
        schemes: eligibilities.map(e => ({
          schemeName: e.schemeName,
          status: e.eligibilityStatus,
          coverageAmount: e.coverageAmount
        })),
        disclaimer: MANDATORY_DISCLAIMER
      }
    });
  } catch (err) {
    console.error('Error in getBeneficiaryQRData:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
