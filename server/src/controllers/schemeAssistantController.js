import crypto from 'crypto';
import GovernmentScheme from '../models/GovernmentScheme.js';
import SchemeEligibilityRule from '../models/SchemeEligibilityRule.js';
import PatientSchemeProfile from '../models/PatientSchemeProfile.js';
import SchemeRecommendation from '../models/SchemeRecommendation.js';
import SchemeApplication from '../models/SchemeApplication.js';
import ApplicationDocument from '../models/ApplicationDocument.js';
import Patient from '../models/Patient.js';
import RationCardVerification from '../models/RationCardVerification.js';
import SchemeNotification from '../models/SchemeNotification.js';
import { logAuditEvent } from '../middleware/audit.js';
import { extractSupportingDocumentWithAI } from '../services/aiService.js';
import { evaluatePatientEligibility, MANDATORY_LEGAL_DISCLAIMER } from '../services/schemeEligibilityEngine.js';

// Helper to mask raw numbers e.g. XXXX-XXXX-1234
const maskSensitiveId = (raw) => {
  if (!raw) return 'XXXX-XXXX-0000';
  const clean = String(raw).replace(/[\s-]/g, '');
  if (clean.length <= 4) return `XXXX-XXXX-${clean}`;
  return `XXXX-XXXX-${clean.slice(-4)}`;
};

/**
 * 1. Get all active Government Schemes in the database
 * GET /api/schemes/assistant/schemes
 */
export const getSchemes = async (req, res) => {
  try {
    const { department, state, category } = req.query;
    const filter = { isActive: true };

    if (department) filter.governmentDepartment = new RegExp(department, 'i');
    if (state && state !== 'All') filter.state = new RegExp(state, 'i');

    const schemes = await GovernmentScheme.find(filter).sort({ shortCode: 1 });
    res.json({
      success: true,
      count: schemes.length,
      schemes,
      disclaimer: MANDATORY_LEGAL_DISCLAIMER
    });
  } catch (err) {
    console.error('Error fetching government schemes:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 2. Get specific Government Scheme by ID
 * GET /api/schemes/assistant/schemes/:schemeId
 */
export const getSchemeById = async (req, res) => {
  try {
    const { schemeId } = req.params;
    const scheme = await GovernmentScheme.findOne({ schemeId });
    if (!scheme) {
      return res.status(404).json({ success: false, message: `Scheme '${schemeId}' not found.` });
    }

    const rules = await SchemeEligibilityRule.find({ schemeId });
    res.json({
      success: true,
      scheme,
      rules,
      disclaimer: MANDATORY_LEGAL_DISCLAIMER
    });
  } catch (err) {
    console.error('Error fetching scheme by ID:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3. Get or synthesize Patient Scheme Profile
 * GET /api/schemes/assistant/profile/:patientUid
 */
export const getPatientProfile = async (req, res) => {
  try {
    const { patientUid } = req.params;
    let profile = await PatientSchemeProfile.findOne({ patientId: patientUid });

    // If profile does not exist yet, initialize it from Patient and RationCard records
    if (!profile) {
      const patient = await Patient.findOne({ uid: patientUid });
      const rationCard = await RationCardVerification.findOne({ patientId: patientUid });

      profile = await PatientSchemeProfile.create({
        patientId: patientUid,
        demographics: {
          fullName: patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'Rahul Patil',
          maskedAadhaar: 'XXXX-XXXX-1234',
          dob: patient?.dateOfBirth ? patient.dateOfBirth.toISOString().split('T')[0] : '1988-04-12',
          gender: patient?.gender || 'Male',
          mobile: patient?.phone || '9988776651',
          email: patient?.email || 'patient@demo.health'
        },
        address: {
          fullAddress: patient?.address ? `${patient.address.street}, ${patient.address.city}` : 'Pune, Maharashtra',
          district: patient?.address?.city || 'Pune',
          state: patient?.address?.state || 'Maharashtra',
          pincode: patient?.address?.postalCode || '411005',
          isMaharashtraDomicile: true
        },
        socioEconomic: {
          rationCardNumber: rationCard?.maskedRationCardNumber || 'RC-XXXX-XXXX-8921',
          rationCardType: rationCard?.rationCardType || 'Yellow',
          annualIncome: 48000,
          casteCategory: 'OBC',
          casteName: 'Mali',
          isDisabilityApplicable: false,
          disabilityPercentage: 0,
          bankDetails: {
            bankName: 'Bank of Maharashtra',
            accountNumberMasked: 'XXXX-XXXX-6789',
            ifscCode: 'MAHB0000123',
            branch: 'Pune Main Branch'
          }
        },
        documentsSummary: {
          aadhaarVerified: true,
          rationCardVerified: Boolean(rationCard),
          incomeCertVerified: false,
          casteCertVerified: false,
          disabilityCertVerified: false,
          birthCertVerified: true,
          bankProofVerified: true
        },
        consentGiven: true
      });
    }

    res.json({
      success: true,
      profile,
      disclaimer: MANDATORY_LEGAL_DISCLAIMER
    });
  } catch (err) {
    console.error('Error fetching patient scheme profile:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 4. Update Patient Scheme Profile manually
 * PUT /api/schemes/assistant/profile/:patientUid
 */
export const updatePatientProfile = async (req, res) => {
  try {
    const { patientUid } = req.params;
    const updateData = req.body;

    // Guard: Enforce Aadhaar masking
    if (updateData.demographics?.maskedAadhaar) {
      updateData.demographics.maskedAadhaar = maskSensitiveId(updateData.demographics.maskedAadhaar);
    }
    if (updateData.socioEconomic?.bankDetails?.accountNumberMasked) {
      updateData.socioEconomic.bankDetails.accountNumberMasked = maskSensitiveId(updateData.socioEconomic.bankDetails.accountNumberMasked);
    }

    updateData.updatedAt = new Date();

    const updatedProfile = await PatientSchemeProfile.findOneAndUpdate(
      { patientId: patientUid },
      { $set: updateData },
      { new: true, upsert: true }
    );

    // Re-evaluate eligibility automatically
    const schemes = await GovernmentScheme.find({ isActive: true });
    const evaluation = evaluatePatientEligibility(updatedProfile, schemes);

    await SchemeRecommendation.findOneAndUpdate(
      { patientId: patientUid },
      {
        patientId: patientUid,
        recommendations: evaluation.recommendations,
        summary: evaluation.summary,
        disclaimer: evaluation.disclaimer,
        evaluatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await logAuditEvent(req, 'UPDATE_SCHEME_PROFILE', {
      patientId: patientUid,
      updatedSections: Object.keys(updateData)
    });

    res.json({
      success: true,
      profile: updatedProfile,
      evaluation,
      message: 'Profile updated and recommendations refreshed successfully.'
    });
  } catch (err) {
    console.error('Error updating patient scheme profile:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 5. Upload Supporting Document & Extract fields with YOLO & OCR
 * POST /api/schemes/assistant/upload-document
 */
export const uploadSupportingDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Document image file is required.' });
    }

    const {
      patientUid,
      docType = 'income_certificate',
      userConsent = 'true'
    } = req.body;

    if (userConsent !== 'true' && userConsent !== true) {
      return res.status(400).json({
        success: false,
        message: 'Explicit user informed consent is required to process identity and supporting documents.'
      });
    }

    if (!patientUid) {
      return res.status(400).json({ success: false, message: 'Patient UID is required.' });
    }

    // Hash file buffer for audit & tamper resistance
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Call FastAPI AI service for YOLO detection + PaddleOCR field extraction
    const aiResult = await extractSupportingDocumentWithAI(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      docType,
      true
    );

    const docId = `DOC-${Date.now().toString().slice(-8)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const supportingData = aiResult.supporting_document_data || {};

    // Map extracted fields according to document type
    let extractedFields = {};
    if (docType.includes('income') && supportingData.income_data) {
      extractedFields = supportingData.income_data;
    } else if (docType.includes('caste') && supportingData.caste_data) {
      extractedFields = supportingData.caste_data;
    } else if (docType.includes('disability') && supportingData.disability_data) {
      extractedFields = supportingData.disability_data;
    } else if (docType.includes('birth') && supportingData.birth_data) {
      extractedFields = supportingData.birth_data;
    } else if (docType.includes('bank') && supportingData.bank_data) {
      extractedFields = supportingData.bank_data;
    } else if (docType.includes('ration') && supportingData.ration_data) {
      extractedFields = supportingData.ration_data;
    } else if (docType.includes('aadhaar') && (supportingData.aadhaar_data || aiResult.aadhaar_data)) {
      extractedFields = supportingData.aadhaar_data || aiResult.aadhaar_data;
    }

    // Save ApplicationDocument metadata (with zero raw PII retention)
    const appDoc = await ApplicationDocument.create({
      docId,
      patientId: patientUid,
      docType: docType.includes('income') ? 'income_certificate'
        : docType.includes('caste') ? 'caste_certificate'
        : docType.includes('disability') ? 'disability_certificate'
        : docType.includes('birth') ? 'birth_certificate'
        : docType.includes('bank') ? 'bank_passbook'
        : docType.includes('ration') ? 'ration_card'
        : docType.includes('aadhaar') ? 'aadhaar_card' : 'other',
      docName: req.file.originalname,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash,
      ocrExtractedFields: extractedFields,
      verificationStatus: aiResult.verification_status === 'VERIFIED' ? 'VERIFIED' : 'OCR_EXTRACTED',
      confidenceScore: aiResult.detection_confidence || 0.90,
      userConsent: true
    });

    // Update PatientSchemeProfile with extracted values
    const profileUpdate = {};
    if (docType.includes('income')) {
      profileUpdate['documentsSummary.incomeCertVerified'] = true;
      if (extractedFields.annual_income) {
        profileUpdate['socioEconomic.annualIncome'] = extractedFields.annual_income;
      }
    } else if (docType.includes('caste')) {
      profileUpdate['documentsSummary.casteCertVerified'] = true;
      if (extractedFields.category) {
        profileUpdate['socioEconomic.casteCategory'] = extractedFields.category;
      }
      if (extractedFields.caste_name) {
        profileUpdate['socioEconomic.casteName'] = extractedFields.caste_name;
      }
    } else if (docType.includes('disability')) {
      profileUpdate['documentsSummary.disabilityCertVerified'] = true;
      profileUpdate['socioEconomic.isDisabilityApplicable'] = true;
      if (extractedFields.disability_percentage) {
        profileUpdate['socioEconomic.disabilityPercentage'] = extractedFields.disability_percentage;
      }
      if (extractedFields.disability_type) {
        profileUpdate['socioEconomic.disabilityType'] = extractedFields.disability_type;
      }
      if (extractedFields.udid_number) {
        profileUpdate['socioEconomic.udidNumber'] = extractedFields.udid_number;
      }
    } else if (docType.includes('bank')) {
      profileUpdate['documentsSummary.bankProofVerified'] = true;
      if (extractedFields.masked_account_number) {
        profileUpdate['socioEconomic.bankDetails.accountNumberMasked'] = extractedFields.masked_account_number;
      }
      if (extractedFields.ifsc_code) {
        profileUpdate['socioEconomic.bankDetails.ifscCode'] = extractedFields.ifsc_code;
      }
      if (extractedFields.bank_name) {
        profileUpdate['socioEconomic.bankDetails.bankName'] = extractedFields.bank_name;
      }
    } else if (docType.includes('birth')) {
      profileUpdate['documentsSummary.birthCertVerified'] = true;
      if (extractedFields.dob) {
        profileUpdate['demographics.dob'] = extractedFields.dob;
      }
    }

    const updatedProfile = await PatientSchemeProfile.findOneAndUpdate(
      { patientId: patientUid },
      { $set: profileUpdate },
      { new: true, upsert: true }
    );

    // Re-evaluate eligibility recommendations
    const schemes = await GovernmentScheme.find({ isActive: true });
    const evaluation = evaluatePatientEligibility(updatedProfile, schemes);

    await SchemeRecommendation.findOneAndUpdate(
      { patientId: patientUid },
      {
        patientId: patientUid,
        recommendations: evaluation.recommendations,
        summary: evaluation.summary,
        disclaimer: evaluation.disclaimer,
        evaluatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await logAuditEvent(req, 'SCHEME_DOCUMENT_PROCESSED', {
      patientId: patientUid,
      docId,
      docType,
      verificationStatus: appDoc.verificationStatus
    });

    res.json({
      success: true,
      document: appDoc,
      aiResult,
      extractedFields,
      updatedProfile,
      evaluation,
      message: `Document processed successfully with AI YOLO detection and OCR extraction.`
    });
  } catch (err) {
    console.error('Error processing supporting document:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 6. Get uploaded documents for a patient
 * GET /api/schemes/assistant/documents/:patientUid
 */
export const getPatientDocuments = async (req, res) => {
  try {
    const { patientUid } = req.params;
    const documents = await ApplicationDocument.find({ patientId: patientUid }).sort({ uploadedAt: -1 });
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (err) {
    console.error('Error fetching patient documents:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 7. Run Rule-based Eligibility Engine
 * POST /api/schemes/assistant/evaluate/:patientUid
 */
export const evaluateEligibility = async (req, res) => {
  try {
    const { patientUid } = req.params;
    let profile = await PatientSchemeProfile.findOne({ patientId: patientUid });

    if (!profile) {
      // Trigger default profile fetch
      await getPatientProfile(req, {
        json: (data) => { profile = data.profile; },
        status: () => ({ json: () => {} })
      });
    }

    const schemes = await GovernmentScheme.find({ isActive: true });
    const evaluation = evaluatePatientEligibility(profile, schemes);

    const savedRec = await SchemeRecommendation.findOneAndUpdate(
      { patientId: patientUid },
      {
        patientId: patientUid,
        recommendations: evaluation.recommendations,
        summary: evaluation.summary,
        disclaimer: evaluation.disclaimer,
        evaluatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      recommendation: savedRec,
      disclaimer: MANDATORY_LEGAL_DISCLAIMER
    });
  } catch (err) {
    console.error('Error evaluating scheme eligibility:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 8. Auto-fill Application Form
 * POST /api/schemes/assistant/autofill
 */
export const autofillApplicationForm = async (req, res) => {
  try {
    const { patientUid, schemeId } = req.body;
    if (!patientUid || !schemeId) {
      return res.status(400).json({ success: false, message: 'patientUid and schemeId are required.' });
    }

    const scheme = await GovernmentScheme.findOne({ schemeId });
    if (!scheme) {
      return res.status(404).json({ success: false, message: `Scheme '${schemeId}' not found.` });
    }

    let profile = await PatientSchemeProfile.findOne({ patientId: patientUid });
    if (!profile) {
      profile = await PatientSchemeProfile.create({
        patientId: patientUid,
        demographics: { fullName: 'Rahul Patil', maskedAadhaar: 'XXXX-XXXX-1234' }
      });
    }

    const uploadedDocs = await ApplicationDocument.find({ patientId: patientUid });

    // Map profile values to scheme application form fields
    const prefilledData = {};
    const missingFields = [];

    const p = profile;
    const mapping = {
      applicantName: p.demographics?.fullName || '',
      maskedAadhaar: p.demographics?.maskedAadhaar || 'XXXX-XXXX-1234',
      dob: p.demographics?.dob || '',
      gender: p.demographics?.gender || 'Male',
      mobile: p.demographics?.mobile || '',
      district: p.address?.district || 'Pune',
      state: p.address?.state || 'Maharashtra',
      annualIncome: p.socioEconomic?.annualIncome || '',
      rationCardNumber: p.socioEconomic?.rationCardNumber || '',
      rationCardType: p.socioEconomic?.rationCardType || 'Yellow',
      udidNumber: p.socioEconomic?.udidNumber || '',
      disabilityType: p.socioEconomic?.disabilityType || '',
      disabilityPercentage: p.socioEconomic?.disabilityPercentage || '',
      bankAccountNumber: p.socioEconomic?.bankDetails?.accountNumberMasked || 'XXXX-XXXX-6789',
      bankIfsc: p.socioEconomic?.bankDetails?.ifscCode || 'MAHB0000123',
      bankName: p.socioEconomic?.bankDetails?.bankName || 'Bank of Maharashtra',
      yearsInMaharashtra: p.address?.yearsResidentInState || 15
    };

    scheme.applicationFormFields.forEach(field => {
      const val = mapping[field.fieldKey];
      if (val !== undefined && val !== null && val !== '') {
        prefilledData[field.fieldKey] = val;
      } else {
        prefilledData[field.fieldKey] = '';
        if (field.required) {
          missingFields.push(field.label);
        }
      }
    });

    res.json({
      success: true,
      schemeId: scheme.schemeId,
      schemeName: scheme.schemeName,
      officialPortalUrl: scheme.officialApplicationUrl,
      formFields: scheme.applicationFormFields,
      prefilledData,
      missingFields,
      availableDocuments: uploadedDocs.map(d => ({
        docId: d.docId,
        docType: d.docType,
        docName: d.docName,
        verified: d.verificationStatus === 'VERIFIED'
      })),
      disclaimer: MANDATORY_LEGAL_DISCLAIMER
    });
  } catch (err) {
    console.error('Error auto-filling application form:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 9. Submit Application with Explicit User Approval
 * POST /api/schemes/assistant/submit-application
 */
export const submitApplication = async (req, res) => {
  try {
    const {
      patientUid,
      schemeId,
      formData,
      attachedDocuments = [],
      userConsent
    } = req.body;

    if (!userConsent || !userConsent.approvedByUser) {
      return res.status(400).json({
        success: false,
        message: 'Explicit user confirmation and approval is required before saving or submitting application forms.'
      });
    }

    const scheme = await GovernmentScheme.findOne({ schemeId });
    if (!scheme) {
      return res.status(404).json({ success: false, message: `Scheme '${schemeId}' not found.` });
    }

    // Identify any remaining missing mandatory fields
    const missingFields = [];
    scheme.applicationFormFields.forEach(f => {
      if (f.required && (!formData[f.fieldKey] || String(formData[f.fieldKey]).trim() === '')) {
        missingFields.push(f.label);
      }
    });

    const applicationId = `APP-2026-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Mask sensitive fields in formData
    const sanitizedFormData = { ...formData };
    if (sanitizedFormData.maskedAadhaar) {
      sanitizedFormData.maskedAadhaar = maskSensitiveId(sanitizedFormData.maskedAadhaar);
    }
    if (sanitizedFormData.bankAccountNumber) {
      sanitizedFormData.bankAccountNumber = maskSensitiveId(sanitizedFormData.bankAccountNumber);
    }

    const newApplication = await SchemeApplication.create({
      applicationId,
      patientId: patientUid,
      schemeId: scheme.schemeId,
      schemeName: scheme.schemeName,
      formData: sanitizedFormData,
      missingFields,
      attachedDocuments,
      userConsent: {
        approvedByUser: true,
        consentTimestamp: new Date(),
        userDeclaration: userConsent.userDeclaration || 'I approve this application form data.'
      },
      applicationStatus: missingFields.length === 0 ? 'READY_FOR_PORTAL_SUBMISSION' : 'DRAFT',
      officialPortalUrl: scheme.officialApplicationUrl,
      deskNotes: 'Form completed via AI Government Scheme Assistant. Ready for review or official portal submission.'
    });

    // Notify patient
    await SchemeNotification.create({
      patientId: patientUid,
      title: `Application Prepared for ${scheme.shortCode}`,
      message: `Your application (${applicationId}) for ${scheme.schemeName} has been saved with user approval. Status: ${newApplication.applicationStatus}.`,
      type: 'approval'
    });

    await logAuditEvent(req, 'SCHEME_APPLICATION_CREATED', {
      applicationId,
      patientId: patientUid,
      schemeId,
      status: newApplication.applicationStatus
    });

    res.json({
      success: true,
      application: newApplication,
      message: 'Application form successfully saved with user confirmation.',
      disclaimer: MANDATORY_LEGAL_DISCLAIMER
    });
  } catch (err) {
    console.error('Error submitting scheme application:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 10. Get all applications for a patient
 * GET /api/schemes/assistant/applications/:patientUid
 */
export const getPatientApplications = async (req, res) => {
  try {
    const { patientUid } = req.params;
    const applications = await SchemeApplication.find({ patientId: patientUid }).sort({ submittedAt: -1 });
    res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (err) {
    console.error('Error fetching patient applications:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 11. Update Application Status (for Hospital Desk / Admin)
 * PATCH /api/schemes/assistant/applications/:applicationId/status
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { applicationStatus, officialReferenceNumber, deskNotes } = req.body;

    const app = await SchemeApplication.findOne({ applicationId });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (applicationStatus) app.applicationStatus = applicationStatus;
    if (officialReferenceNumber) app.officialReferenceNumber = officialReferenceNumber;
    if (deskNotes) app.deskNotes = deskNotes;
    app.updatedAt = new Date();

    await app.save();

    await logAuditEvent(req, 'SCHEME_APPLICATION_STATUS_UPDATED', {
      applicationId,
      newStatus: app.applicationStatus
    });

    res.json({
      success: true,
      application: app,
      message: `Application status updated to ${app.applicationStatus}`
    });
  } catch (err) {
    console.error('Error updating application status:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

