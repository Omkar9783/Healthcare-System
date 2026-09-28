import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Patient from './models/Patient.js';
import MedicalRecord from './models/MedicalRecord.js';
import Prescription from './models/Prescription.js';
import LabReport from './models/LabReport.js';
import Vitals from './models/Vitals.js';
import Appointment from './models/Appointment.js';
import Consent from './models/Consent.js';
import AuditLog from './models/AuditLog.js';
import RationCardVerification from './models/RationCardVerification.js';
import SchemeEligibility from './models/SchemeEligibility.js';
import FamilyMember from './models/FamilyMember.js';
import HospitalScheme from './models/HospitalScheme.js';
import HealthcarePackage from './models/HealthcarePackage.js';
import VerificationRequest from './models/VerificationRequest.js';
import SchemeNotification from './models/SchemeNotification.js';
import { generateSecureToken } from './services/qrService.js';

export const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('⚡ Database already contains data. Skipping re-seeding.');
      return;
    }

    console.log('🌱 Seeding database with synthetic healthcare demo data...');

    const defaultPassword = await bcrypt.hash('password123', 10);

    // 1. Create Core Demo Accounts
    const adminUser = await User.create({
      name: 'System Admin (Dr. V. Rao)',
      email: 'admin@demo.health',
      password: defaultPassword,
      role: 'ADMIN',
      phone: '9876543200',
      hospital: 'MediSecure Super Specialty Hospital',
      department: 'Hospital IT & Governance'
    });

    const doc1 = await User.create({
      name: 'Dr. Amit Sharma',
      email: 'doctor@demo.health',
      password: defaultPassword,
      role: 'DOCTOR',
      phone: '9876543201',
      hospital: 'MediSecure Super Specialty Hospital',
      department: 'Cardiology',
      specialization: 'Senior Cardiologist'
    });

    const doc2 = await User.create({
      name: 'Dr. Neha Kulkarni',
      email: 'doctor2@demo.health',
      password: defaultPassword,
      role: 'DOCTOR',
      phone: '9876543202',
      hospital: 'MediSecure Super Specialty Hospital',
      department: 'Endocrinology',
      specialization: 'Diabetologist'
    });

    const doc3 = await User.create({
      name: 'Dr. Rajesh Mehta',
      email: 'doctor3@demo.health',
      password: defaultPassword,
      role: 'DOCTOR',
      phone: '9876543203',
      hospital: 'MediSecure Super Specialty Hospital',
      department: 'General Medicine',
      specialization: 'Internal Medicine'
    });

    const nurse1 = await User.create({
      name: 'Nurse Priya Singh',
      email: 'nurse@demo.health',
      password: defaultPassword,
      role: 'NURSE',
      phone: '9876543204',
      hospital: 'MediSecure Super Specialty Hospital',
      department: 'ICU / Cardiac Care'
    });

    const nurse2 = await User.create({
      name: 'Nurse Sunita Pawar',
      email: 'nurse2@demo.health',
      password: defaultPassword,
      role: 'NURSE',
      phone: '9876543205',
      hospital: 'MediSecure Super Specialty Hospital',
      department: 'Outpatient Clinic'
    });

    const lab1 = await User.create({
      name: 'Lab Tech Suresh Verma',
      email: 'lab@demo.health',
      password: defaultPassword,
      role: 'LAB_TECHNICIAN',
      phone: '9876543206',
      hospital: 'MediSecure Super Specialty Hospital',
      department: 'Pathology Diagnostics'
    });

    const pharm1 = await User.create({
      name: 'Pharmacist Vikram Joshi',
      email: 'pharmacy@demo.health',
      password: defaultPassword,
      role: 'PHARMACIST',
      phone: '9876543207',
      hospital: 'MediSecure Super Specialty Hospital',
      department: 'Central Hospital Pharmacy'
    });

    const emergency1 = await User.create({
      name: 'Officer Response Team A',
      email: 'emergency@demo.health',
      password: defaultPassword,
      role: 'EMERGENCY_STAFF',
      phone: '9876543208',
      hospital: 'MediSecure Trauma Unit',
      department: 'Emergency & Casualty'
    });

    // 2. Create Synthetic Patients (10 Patients)
    const patientDataList = [
      { name: 'Rahul Patil', email: 'patient@demo.health', dob: '1988-04-12', gender: 'Male', blood: 'B+', phone: '9988776651', address: 'Flat 402, Green Park, Mumbai' },
      { name: 'Ananya Deshmukh', email: 'ananya@demo.health', dob: '1992-09-23', gender: 'Female', blood: 'O+', phone: '9988776652', address: 'Plot 12, FC Road, Pune' },
      { name: 'Sanjay Kumar', email: 'sanjay@demo.health', dob: '1975-11-05', gender: 'Male', blood: 'A+', phone: '9988776653', address: 'Block C, Vashi, Navi Mumbai' },
      { name: 'Meera Kulkarni', email: 'meera@demo.health', dob: '1983-02-18', gender: 'Female', blood: 'AB+', phone: '9988776654', address: '15 Civil Lines, Nagpur' },
      { name: 'Vikram Shinde', email: 'vikram.s@demo.health', dob: '1996-07-30', gender: 'Male', blood: 'O-', phone: '9988776655', address: '45 MG Road, Nashik' },
      { name: 'Pooja Agarwal', email: 'pooja@demo.health', dob: '1990-12-14', gender: 'Female', blood: 'A-', phone: '9988776656', address: '78 Sector 17, Thane' },
      { name: 'Rohan Gupta', email: 'rohan@demo.health', dob: '1981-06-08', gender: 'Male', blood: 'B-', phone: '9988776657', address: '22 Park Street, Solapur' },
      { name: 'Kavita Roy', email: 'kavita@demo.health', dob: '1998-01-25', gender: 'Female', blood: 'O+', phone: '9988776658', address: '10 Marine Drive, Mumbai' },
      { name: 'Devendra More', email: 'devendra@demo.health', dob: '1968-08-19', gender: 'Male', blood: 'AB-', phone: '9988776659', address: '88 Station Road, Kolhapur' },
      { name: 'Sneha Jadhav', email: 'sneha@demo.health', dob: '2001-03-11', gender: 'Female', blood: 'B+', phone: '9988776660', address: '34 Karve Nagar, Pune' }
    ];

    const createdPatients = [];
    for (let i = 0; i < patientDataList.length; i++) {
      const p = patientDataList[i];
      const uid = `PAT-2026-${String(i + 1).padStart(6, '0')}`;
      const token = generateSecureToken(uid);

      const patientDoc = await Patient.create({
        uid,
        name: p.name,
        email: p.email,
        phone: p.phone,
        dateOfBirth: p.dob,
        gender: p.gender,
        bloodGroup: p.blood,
        address: p.address,
        emergencyContact: {
          name: `${p.name.split(' ')[0]}'s Relative`,
          relation: 'Spouse/Parent',
          phone: `998877${6661 + i}`
        },
        allergies: i % 2 === 0 ? [{ allergen: 'Penicillin', severity: 'Moderate', reaction: 'Skin Rash' }] : [],
        chronicConditions: i === 0 ? ['Essential Hypertension', 'Type 2 Diabetes'] : ['Mild Asthma'],
        qrToken: token,
        qrExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // Link main demo patient account if email is patient@demo.health
      const patientUser = await User.create({
        name: p.name,
        email: p.email,
        password: defaultPassword,
        role: 'PATIENT',
        patientUid: uid,
        phone: p.phone
      });

      createdPatients.push(patientDoc);
    }

    const mainPatient = createdPatients[0]; // PAT-2026-000001 (Rahul Patil)

    // 3. Seed Medical Records for Rahul Patil
    await MedicalRecord.create({
      patientUid: mainPatient.uid,
      doctorUserId: doc1._id,
      doctorName: doc1.name,
      department: 'Cardiology',
      chiefComplaint: 'Chest tightness after exertion and periodic shortness of breath',
      diagnosis: 'Essential Hypertension & Stage 1 Angina Symptoms',
      treatmentNotes: 'Advised ECG, Echocardiogram, and 24-hr Ambulatory BP Monitoring. Low sodium diet prescribed.',
      recommendedFollowUp: 'Follow up in 2 weeks with ECG report'
    });

    await MedicalRecord.create({
      patientUid: mainPatient.uid,
      doctorUserId: doc2._id,
      doctorName: doc2.name,
      department: 'Endocrinology',
      chiefComplaint: 'Routine Type 2 Diabetes Glycemic Review',
      diagnosis: 'Type 2 Diabetes Mellitus - Moderately Controlled',
      treatmentNotes: 'HbA1c levels 7.2%. Adjusted Metformin dosage to 500mg BD after breakfast and dinner.',
      recommendedFollowUp: 'HbA1c test in 3 months'
    });

    // 4. Seed Prescriptions
    const pres1 = await Prescription.create({
      patientUid: mainPatient.uid,
      patientName: mainPatient.name,
      doctorUserId: doc1._id,
      doctorName: doc1.name,
      diagnosis: 'Essential Hypertension',
      medicines: [
        { name: 'Telmisartan', dosage: '40mg', frequency: '1-0-0 (Morning)', duration: '30 Days', instructions: 'Take on empty stomach' },
        { name: 'Amlodipine', dosage: '5mg', frequency: '0-0-1 (Night)', duration: '30 Days', instructions: 'Take before sleep' }
      ],
      dispensingStatus: 'Pending'
    });

    const pres2 = await Prescription.create({
      patientUid: mainPatient.uid,
      patientName: mainPatient.name,
      doctorUserId: doc2._id,
      doctorName: doc2.name,
      diagnosis: 'Type 2 Diabetes Mellitus',
      medicines: [
        { name: 'Metformin SR', dosage: '500mg', frequency: '1-0-1 (After Meals)', duration: '60 Days', instructions: 'Take with food' }
      ],
      dispensingStatus: 'Dispensed',
      dispensedByPharmacist: pharm1.name,
      dispensedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    // 5. Seed Lab Reports
    await LabReport.create({
      patientUid: mainPatient.uid,
      patientName: mainPatient.name,
      testName: 'Complete Blood Count (CBC)',
      testCategory: 'Pathology',
      requestedByDoctor: doc1.name,
      status: 'Completed',
      labTechnicianName: lab1.name,
      resultSummary: 'Hemoglobin 14.5 g/dL, WBC count normal, Platelets 250,000 /mcL.',
      findings: [
        { parameter: 'Hemoglobin', value: '14.5', unit: 'g/dL', referenceRange: '13.5 - 17.5', status: 'Normal' },
        { parameter: 'WBC Count', value: '7,800', unit: '/mcL', referenceRange: '4,500 - 11,000', status: 'Normal' },
        { parameter: 'Platelets', value: '250,000', unit: '/mcL', referenceRange: '150,000 - 450,000', status: 'Normal' }
      ],
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    await LabReport.create({
      patientUid: mainPatient.uid,
      patientName: mainPatient.name,
      testName: 'Lipid Profile & HbA1c Panel',
      testCategory: 'Biochemistry',
      requestedByDoctor: doc2.name,
      status: 'Requested'
    });

    // 6. Seed Vitals
    await Vitals.create({
      patientUid: mainPatient.uid,
      recordedByUserId: nurse1._id,
      recordedByName: nurse1.name,
      recordedByRole: 'NURSE',
      temperature: 36.8,
      bloodPressure: '138/88',
      heartRate: 78,
      spO2: 98,
      respiratoryRate: 16,
      weight: 76,
      notes: 'Patient resting comfortably. BP slightly elevated.'
    });

    await Vitals.create({
      patientUid: mainPatient.uid,
      recordedByUserId: nurse2._id,
      recordedByName: nurse2.name,
      recordedByRole: 'NURSE',
      temperature: 37.0,
      bloodPressure: '130/84',
      heartRate: 72,
      spO2: 99,
      respiratoryRate: 15,
      weight: 75.5,
      notes: 'Morning routine checkup'
    });

    // 7. Seed Appointments
    const todayStr = new Date().toISOString().split('T')[0];
    await Appointment.create({
      patientUid: mainPatient.uid,
      patientName: mainPatient.name,
      doctorId: doc1._id,
      doctorName: doc1.name,
      department: 'Cardiology',
      date: todayStr,
      time: '10:30 AM',
      reason: 'Hypertension Follow-Up',
      status: 'Confirmed'
    });

    await Appointment.create({
      patientUid: createdPatients[1].uid,
      patientName: createdPatients[1].name,
      doctorId: doc2._id,
      doctorName: doc2.name,
      department: 'Endocrinology',
      date: todayStr,
      time: '11:45 AM',
      reason: 'Thyroid Evaluation',
      status: 'Scheduled'
    });

    // 8. Seed Consents
    await Consent.create({
      patientUid: mainPatient.uid,
      grantedToUserId: doc1._id,
      grantedToName: doc1.name,
      grantedToRole: 'DOCTOR',
      resourceType: 'ALL',
      purpose: 'Cardiology Evaluation & Treatment',
      durationHours: 72,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: 'ACTIVE'
    });

    // 9. Seed Audit Logs
    await AuditLog.create({
      auditId: `AUD-SEED-001`,
      userId: doc1._id,
      userName: doc1.name,
      userRole: doc1.role,
      patientUid: mainPatient.uid,
      action: 'QR_SCANNED',
      resource: 'PATIENT_IDENTITY',
      purpose: 'Identity Assertion',
      result: 'SUCCESS',
      details: 'Patient QR scanned in OPD clinic'
    });

    await AuditLog.create({
      auditId: `AUD-SEED-002`,
      userId: doc1._id,
      userName: doc1.name,
      userRole: doc1.role,
      patientUid: mainPatient.uid,
      action: 'PATIENT_VIEWED',
      resource: 'MEDICAL_RECORDS',
      purpose: 'Consultation',
      result: 'SUCCESS',
      details: 'Viewed medical history and lab reports'
    });

    // 10. Seed Government Health Scheme Empanelled Hospitals
    await HospitalScheme.insertMany([
      {
        hospitalId: 'HOSP-MUM-001',
        hospitalName: 'KEM Hospital & Seth GS Medical College',
        state: 'Maharashtra',
        district: 'Mumbai',
        city: 'Parel, Mumbai',
        address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012',
        contactPhone: '+91 22 2410 7000',
        schemes: ['MJPJAY', 'PM-JAY'],
        empanelmentStatus: 'Empanelled - Active',
        specialties: ['Cardiology', 'Oncology', 'Nephrology', 'General Surgery', 'Orthopedics', 'Pediatrics'],
        isGovernmentHospital: true,
        rating: 4.8,
        latitude: 19.0028,
        longitude: 72.8427
      },
      {
        hospitalId: 'HOSP-MUM-002',
        hospitalName: 'Tata Memorial Hospital (Apex Cancer Centre)',
        state: 'Maharashtra',
        district: 'Mumbai',
        city: 'Parel, Mumbai',
        address: 'Dr. Ernest Borges Rd, Parel, Mumbai, Maharashtra 400012',
        contactPhone: '+91 22 2417 7000',
        schemes: ['MJPJAY', 'PM-JAY'],
        empanelmentStatus: 'Empanelled - Active',
        specialties: ['Oncology', 'Surgical Oncology', 'Radiation Oncology', 'Hematology'],
        isGovernmentHospital: true,
        rating: 4.9,
        latitude: 19.0055,
        longitude: 72.8432
      },
      {
        hospitalId: 'HOSP-MUM-003',
        hospitalName: 'MediSecure Super Specialty Hospital',
        state: 'Maharashtra',
        district: 'Mumbai',
        city: 'Dadar, Mumbai',
        address: '402 Health Express Tower, Senapati Bapat Marg, Dadar, Mumbai 400028',
        contactPhone: '+91 22 6123 4567',
        schemes: ['MJPJAY', 'PM-JAY'],
        empanelmentStatus: 'Empanelled - Active',
        specialties: ['Cardiology', 'Orthopedics', 'Nephrology', 'Ophthalmology', 'General Surgery'],
        isGovernmentHospital: false,
        rating: 4.7,
        latitude: 19.0178,
        longitude: 72.8478
      },
      {
        hospitalId: 'HOSP-PUN-004',
        hospitalName: 'Sassoon General Hospital & B.J. Govt Medical College',
        state: 'Maharashtra',
        district: 'Pune',
        city: 'Pune Station, Pune',
        address: 'Near Pune Railway Station, Sassoon Road, Pune, Maharashtra 411001',
        contactPhone: '+91 20 2612 8000',
        schemes: ['MJPJAY', 'PM-JAY'],
        empanelmentStatus: 'Empanelled - Active',
        specialties: ['Cardiology', 'Nephrology', 'General Surgery', 'Orthopedics', 'Pediatrics'],
        isGovernmentHospital: true,
        rating: 4.6,
        latitude: 18.5284,
        longitude: 73.8743
      },
      {
        hospitalId: 'HOSP-NAG-005',
        hospitalName: 'Government Medical College & Hospital (GMCH)',
        state: 'Maharashtra',
        district: 'Nagpur',
        city: 'Medical Square, Nagpur',
        address: 'Hanuman Nagar, Medical Square, Nagpur, Maharashtra 440003',
        contactPhone: '+91 712 274 4400',
        schemes: ['MJPJAY', 'PM-JAY'],
        empanelmentStatus: 'Empanelled - Active',
        specialties: ['Cardiology', 'Oncology', 'Nephrology', 'Orthopedics'],
        isGovernmentHospital: true,
        rating: 4.5,
        latitude: 21.1275,
        longitude: 79.0982
      },
      {
        hospitalId: 'HOSP-MUM-006',
        hospitalName: 'Lilavati Hospital & Research Centre',
        state: 'Maharashtra',
        district: 'Mumbai',
        city: 'Bandra West, Mumbai',
        address: 'A-791, Bandra Reclamation, Bandra West, Mumbai 400050',
        contactPhone: '+91 22 2675 1000',
        schemes: ['MJPJAY'],
        empanelmentStatus: 'Empanelled - Active',
        specialties: ['Cardiology', 'Neurosurgery', 'Oncology', 'Nephrology'],
        isGovernmentHospital: false,
        rating: 4.8,
        latitude: 19.0514,
        longitude: 72.8295
      }
    ]);

    // 11. Seed Covered Healthcare Packages & Treatments
    await HealthcarePackage.insertMany([
      {
        schemeName: 'Both',
        packageCode: 'CARD-CABG-01',
        packageName: 'Coronary Artery Bypass Graft (CABG) / Open Heart Surgery',
        category: 'Cardiology',
        coverageDetails: 'Full surgical bypass graft, ICU stay up to 7 days, pre-op angiography, consumable graft vessels, and post-op care.',
        officialRateGuideline: '₹1,50,000 - ₹2,10,000 (100% Cashless under Scheme)',
        requiredDocuments: ['Coronary Angiogram (CAG) CD/Report', '2D Echocardiogram', 'Ration Card & Aadhaar'],
        preAuthRequired: true,
        hospitalTier: 'Super Specialty Cardiac Centers'
      },
      {
        schemeName: 'Both',
        packageCode: 'NEPH-DIAL-02',
        packageName: 'Hemodialysis (Per Session & Routine Nephrology Protocol)',
        category: 'Nephrology',
        coverageDetails: 'Recurring maintenance hemodialysis, specialized dialyzer tubing, routine EPO/iron injections, and weekly serum creatinine/electrolytes.',
        officialRateGuideline: '₹1,800 per session (100% Cashless for Beneficiary)',
        requiredDocuments: ['Nephrologist prescription', 'Serum Creatinine & Blood Urea Report', 'Valid Ration Card'],
        preAuthRequired: false,
        hospitalTier: 'Secondary & Dialysis Empanelled Centers'
      },
      {
        schemeName: 'Both',
        packageCode: 'OPHTH-CAT-03',
        packageName: 'Cataract Surgery with Foldable Intraocular Lens (Phaco/SICS)',
        category: 'Ophthalmology',
        coverageDetails: 'Daycare cataract removal with ultrasound emulsification, posterior chamber foldable IOL implantation, pre-op A-scan biometry.',
        officialRateGuideline: '₹12,000 - ₹18,000 (100% Cashless)',
        requiredDocuments: ['Slit-lamp examination report', 'Biometry A-scan sheet', 'Patient Aadhaar Card'],
        preAuthRequired: true,
        hospitalTier: 'Eye Hospitals & General Surgical Centers'
      },
      {
        schemeName: 'Both',
        packageCode: 'ONCO-CHEM-04',
        packageName: 'Chemotherapy Cycle & Targeted Oncology Infusion',
        category: 'Oncology',
        coverageDetails: 'Administration of anti-neoplastic cytotoxic regimens, premedication anti-emetics, daycare bed admission, and complete blood count monitoring.',
        officialRateGuideline: '₹15,000 - ₹45,000 per cycle (100% Cashless)',
        requiredDocuments: ['Biopsy / Histopathology Report (HPR)', 'Medical Oncologist Protocol Prescription', 'Ration Card'],
        preAuthRequired: true,
        hospitalTier: 'Designated Comprehensive Cancer Centers'
      },
      {
        schemeName: 'Both',
        packageCode: 'ORTHO-TKR-05',
        packageName: 'Total Knee Replacement (TKR) / Hip Arthroplasty',
        category: 'Orthopedic Surgery',
        coverageDetails: 'Unilateral or bilateral total joint replacement with FDA/CE approved implants, 5-7 days hospital stay, and initial physiotherapy.',
        officialRateGuideline: '₹95,000 - ₹1,40,000 (100% Cashless)',
        requiredDocuments: ['Weight-bearing digital X-rays', 'Orthopedic evaluation certificate', 'Ration Card'],
        preAuthRequired: true,
        hospitalTier: 'Empanelled Orthopedic Centers'
      },
      {
        schemeName: 'MJPJAY',
        packageCode: 'SURG-APP-06',
        packageName: 'Laparoscopic Appendectomy & Hernia Repair',
        category: 'General Surgery',
        coverageDetails: 'Minimally invasive laparoscopic resection/hernioplasty, general anesthesia, 2-3 days hospital admission, post-op dressings.',
        officialRateGuideline: '₹28,000 - ₹38,000 (100% Cashless)',
        requiredDocuments: ['Ultrasound Abdomen Report', 'Surgical Admission Note', 'Aadhaar & Ration Card'],
        preAuthRequired: true,
        hospitalTier: 'General Surgical Hospitals'
      }
    ]);

    // 12. Seed Demo Patient Ration Card & Scheme Data
    await RationCardVerification.create({
      patientId: mainPatient.uid,
      maskedRationCardNumber: 'XXXX-XXXX-8921',
      encryptedRationCardNumber: 'sha256-hash-sample-8921',
      rationCardType: 'Yellow',
      headOfFamilyName: 'Rahul Patil',
      state: 'Maharashtra',
      district: 'Mumbai',
      mobileNumber: '9988776651',
      familyMembersCount: 4,
      verificationStatus: 'Verified',
      verificationSource: 'State PDS Database Pre-Check & Document OCR',
      verifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    await SchemeEligibility.create({
      patientId: mainPatient.uid,
      schemeName: 'MJPJAY',
      schemeFullName: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
      eligibilityStatus: 'Potentially Eligible',
      eligibilityReason: 'Based on your Yellow ration card in Maharashtra, you satisfy Priority Household (BPL) guidelines. Covers up to ₹5,00,000.',
      coverageAmount: '₹5,00,000 per family per year',
      officialPortalUrl: 'https://www.jeevandayee.gov.in',
      requiredDocuments: ['Valid Ration Card (Yellow/Orange/AAY)', 'Aadhaar Card', 'Domicile / Residence Certificate'],
      benefits: [
        'Cashless hospitalization across 1,356 secondary and tertiary procedures',
        'Free pre-hospitalization tests and 10 days post-discharge medications',
        'Covers pre-existing medical conditions from day one'
      ]
    });

    await SchemeEligibility.create({
      patientId: mainPatient.uid,
      schemeName: 'PM-JAY',
      schemeFullName: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
      eligibilityStatus: 'Potentially Eligible',
      eligibilityReason: 'Yellow BPL card households map to SECC 2011 deprivation criteria under National Health Authority guidelines.',
      coverageAmount: '₹5,00,000 per family per year',
      officialPortalUrl: 'https://beneficiary.nha.gov.in',
      requiredDocuments: ['Aadhaar Card', 'Ration Card', 'PM-JAY Beneficiary Letter / Family ID'],
      benefits: [
        'All India portability: Valid in any empanelled hospital across India',
        '1,949 specialized medical procedures and high-end surgeries',
        'Zero co-payment and zero cost for medicines, diagnostics, and ICU'
      ]
    });

    await FamilyMember.insertMany([
      {
        patientId: mainPatient.uid,
        name: 'Sunita Patil',
        relationship: 'Spouse',
        age: 34,
        gender: 'Female',
        bloodGroup: 'B+',
        mobileNumber: '9988776652',
        beneficiaryId: 'MJP-BEN-2026-091',
        schemeStatus: 'Covered'
      },
      {
        patientId: mainPatient.uid,
        name: 'Amit Patil',
        relationship: 'Son',
        age: 12,
        gender: 'Male',
        bloodGroup: 'B+',
        mobileNumber: '9988776651',
        beneficiaryId: 'MJP-BEN-2026-092',
        schemeStatus: 'Covered'
      },
      {
        patientId: mainPatient.uid,
        name: 'Suman Patil',
        relationship: 'Mother',
        age: 65,
        gender: 'Female',
        bloodGroup: 'O+',
        mobileNumber: '9988776653',
        beneficiaryId: 'MJP-BEN-2026-093',
        schemeStatus: 'Covered'
      }
    ]);

    await SchemeNotification.insertMany([
      {
        patientId: mainPatient.uid,
        type: 'Success',
        title: 'Ration Card Verified (XXXX-XXXX-8921)',
        message: 'Your Yellow ration card was successfully verified. You are preliminary eligible for MJPJAY & PM-JAY.',
        linkTab: 'schemes',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: mainPatient.uid,
        type: 'Information',
        title: 'MJPJAY 2.0 Coverage Limit Enhanced',
        message: 'The government has increased the MJPJAY treatment coverage limit to ₹5,00,000 per family per year.',
        linkTab: 'schemes',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ]);

    await VerificationRequest.create({
      patientId: mainPatient.uid,
      patientName: mainPatient.name,
      patientPhone: '9988776651',
      hospitalId: 'HOSP-MUM-001',
      hospitalName: 'KEM Hospital & Seth GS Medical College',
      schemeName: 'MJPJAY',
      rationCardNumber: 'XXXX-XXXX-8921',
      rationCardType: 'Yellow',
      treatmentCategory: 'Cardiology',
      status: 'APPROVED',
      remarks: 'Verified against Maharashtra Food & Civil Supplies Database. Beneficiary authorized for cashless cardiology consultation.',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      reviewedBy: 'Dr. V. Rao (Chief Medical IT & Governance)'
    });

    console.log('✅ Synthetic healthcare demo data successfully seeded!');
  } catch (err) {
    console.error('❌ Failed to seed database:', err);
  }
};
