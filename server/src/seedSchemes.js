import GovernmentScheme from './models/GovernmentScheme.js';
import SchemeEligibilityRule from './models/SchemeEligibilityRule.js';
import PatientSchemeProfile from './models/PatientSchemeProfile.js';
import SchemeRecommendation from './models/SchemeRecommendation.js';
import { evaluatePatientEligibility } from './services/schemeEligibilityEngine.js';

export const OFFICIAL_SCHEMES = [
  {
    schemeId: 'mjpjay',
    schemeName: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY 2.0)',
    shortCode: 'MJPJAY',
    governmentDepartment: 'State Health Assurance Society, Public Health Department, Government of Maharashtra',
    state: 'Maharashtra',
    purpose: 'Universal cashless healthcare hospitalization scheme covering 1,356 medical procedures for citizens holding valid ration cards or state domicile in Maharashtra.',
    coverageBenefit: 'Up to ₹5,00,000 cashless hospitalization coverage per family per year.',
    eligibilityCriteriaSummary: 'Resident of Maharashtra with valid Ration Card (Yellow, Orange, White, AAY) or Maharashtra Domicile Certificate along with Aadhaar Card.',
    ageRequirements: {
      minAge: 0,
      maxAge: 120,
      description: 'Open to all age groups from infants to senior citizens'
    },
    incomeRequirements: {
      maxAnnualIncome: null, // Universal coverage in Maharashtra under MJPJAY 2.0
      incomeCertificateRequired: false,
      allowedRationCardTypes: ['Yellow', 'Orange', 'White', 'Antyodaya (AAY)', 'Annapurna'],
      description: 'All valid Maharashtra ration card holders (Yellow/Orange/White/AAY) qualify for universal healthcare coverage'
    },
    categoryRequirements: {
      allowedCategories: ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'Other'],
      casteCertificateRequired: false,
      description: 'Open to all social categories and communities'
    },
    disabilityRequirements: {
      minDisabilityPercentage: 0,
      disabilityCertificateRequired: false,
      description: 'No disability restriction'
    },
    genderRequirements: 'ALL',
    residenceRequirements: {
      maharashtraDomicileRequired: true,
      minYearsInState: 0,
      description: 'Permanent resident of Maharashtra with state ration card or domicile certificate'
    },
    requiredDocuments: [
      { docType: 'aadhaar_card', docName: 'Aadhaar Card (UIDAI)', isMandatory: true, description: 'Primary identity and demographic proof' },
      { docType: 'ration_card', docName: 'Maharashtra Ration Card (SRC)', isMandatory: true, description: 'Family membership and category mapping' },
      { docType: 'age_proof', docName: 'Age Proof / Birth Certificate', isMandatory: false, description: 'Secondary verification for pediatric cases' }
    ],
    applicationFormFields: [
      { fieldKey: 'applicantName', label: 'Beneficiary Full Name', type: 'text', required: true, placeholder: 'e.g. Rahul Patil', helpText: 'As appearing on Aadhaar card' },
      { fieldKey: 'maskedAadhaar', label: 'Masked Aadhaar Number', type: 'text', required: true, placeholder: 'XXXX-XXXX-1234', helpText: 'Only masked format allowed' },
      { fieldKey: 'dob', label: 'Date of Birth', type: 'date', required: true, placeholder: 'YYYY-MM-DD', helpText: 'Birth date for identity matching' },
      { fieldKey: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'], placeholder: 'Select Gender', helpText: 'Official gender' },
      { fieldKey: 'rationCardNumber', label: 'State Ration Card (SRC) Number', type: 'text', required: true, placeholder: 'e.g. RC-XXXX-XXXX-8921', helpText: '12-digit ration card number' },
      { fieldKey: 'rationCardType', label: 'Ration Card Category', type: 'select', required: true, options: ['Yellow', 'Orange', 'White', 'Antyodaya (AAY)'], placeholder: 'Select Card Category', helpText: 'Category printed on booklet' },
      { fieldKey: 'district', label: 'District', type: 'text', required: true, placeholder: 'e.g. Pune, Mumbai, Nagpur', helpText: 'Residential district in Maharashtra' },
      { fieldKey: 'hospitalName', label: 'Empanelled Hospital Name', type: 'text', required: true, placeholder: 'e.g. KEM Hospital Mumbai', helpText: 'Network hospital for treatment' },
      { fieldKey: 'treatmentPackage', label: 'Required Treatment / Procedure', type: 'text', required: false, placeholder: 'e.g. Cardiac Surgery, Cataract', helpText: 'Medical specialty procedure' }
    ],
    officialApplicationUrl: 'https://www.jeevandayee.gov.in',
    lastVerifiedDate: '2026-01-15',
    sourceOfEligibilityRules: 'Government of Maharashtra Public Health Department GR No. MJPJAY-2023/CR-146/PHD',
    isActive: true
  },
  {
    schemeId: 'pmjay',
    schemeName: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    shortCode: 'PM-JAY',
    governmentDepartment: 'National Health Authority (NHA), Ministry of Health & Family Welfare, Government of India',
    state: 'Central / All India',
    purpose: 'Flagship national health protection scheme providing secondary and tertiary cashless hospitalization across 1,949 medical packages in over 28,000 empanelled hospitals nationwide.',
    coverageBenefit: 'Up to ₹5,00,000 cashless health insurance cover per family per year.',
    eligibilityCriteriaSummary: 'Families identified under SECC 2011 deprivation criteria, Antyodaya Anna Yojana (AAY) / BPL priority cardholders, and enrolled RSBY beneficiaries.',
    ageRequirements: {
      minAge: 0,
      maxAge: 120,
      description: 'Universal family floater coverage for all age groups'
    },
    incomeRequirements: {
      maxAnnualIncome: 120000,
      incomeCertificateRequired: false,
      allowedRationCardTypes: ['Yellow', 'Antyodaya (AAY)', 'Annapurna'],
      description: 'Priority BPL / SECC 2011 identified households or Yellow/AAY ration card holders'
    },
    categoryRequirements: {
      allowedCategories: ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'Other'],
      casteCertificateRequired: false,
      description: 'All social categories included based on economic vulnerability'
    },
    disabilityRequirements: {
      minDisabilityPercentage: 0,
      disabilityCertificateRequired: false,
      description: 'No disability restriction'
    },
    genderRequirements: 'ALL',
    residenceRequirements: {
      maharashtraDomicileRequired: false,
      minYearsInState: 0,
      description: 'Nationwide all-India portability across any state or union territory'
    },
    requiredDocuments: [
      { docType: 'aadhaar_card', docName: 'Aadhaar Card (UIDAI)', isMandatory: true, description: 'Mandatory Aadhaar e-KYC verification' },
      { docType: 'ration_card', docName: 'NFSA / Priority Ration Card', isMandatory: true, description: 'Family entitlement roster verification' },
      { docType: 'income_certificate', docName: 'Income Certificate (if BPL card unavailable)', isMandatory: false, description: 'For non-ration mapped SECC households' }
    ],
    applicationFormFields: [
      { fieldKey: 'applicantName', label: 'Beneficiary Name', type: 'text', required: true, placeholder: 'e.g. Rahul Patil', helpText: 'UIDAI verified name' },
      { fieldKey: 'maskedAadhaar', label: 'Masked Aadhaar Number', type: 'text', required: true, placeholder: 'XXXX-XXXX-1234', helpText: 'Zero-storage masked Aadhaar' },
      { fieldKey: 'dob', label: 'Date of Birth', type: 'date', required: true, placeholder: 'YYYY-MM-DD', helpText: 'Official date of birth' },
      { fieldKey: 'mobile', label: 'Mobile Number', type: 'text', required: true, placeholder: '9876543210', helpText: 'Aadhaar linked mobile' },
      { fieldKey: 'state', label: 'State / UT', type: 'text', required: true, placeholder: 'Maharashtra', helpText: 'Domicile state' },
      { fieldKey: 'district', label: 'District', type: 'text', required: true, placeholder: 'Pune', helpText: 'Residential district' },
      { fieldKey: 'pmjayFamilyId', label: 'PM-JAY Family ID / Ration Card No', type: 'text', required: true, placeholder: 'e.g. HHD/RC Number', helpText: 'Beneficiary family identification number' },
      { fieldKey: 'rationCardType', label: 'Ration Category', type: 'select', required: true, options: ['Yellow', 'Antyodaya (AAY)', 'Orange', 'White'], placeholder: 'Select category', helpText: 'Card tier' }
    ],
    officialApplicationUrl: 'https://beneficiary.nha.gov.in',
    lastVerifiedDate: '2026-01-15',
    sourceOfEligibilityRules: 'National Health Authority (NHA) PM-JAY Operational Guidelines 2024-2026',
    isActive: true
  },
  {
    schemeId: 'sgnay',
    schemeName: 'Sanjay Gandhi Niradhar Anudan Yojana (SGNAY)',
    shortCode: 'SGNAY',
    governmentDepartment: 'Department of Social Justice and Special Assistance, Government of Maharashtra',
    state: 'Maharashtra',
    purpose: 'Monthly financial pension assistance of ₹1,500 for destitute persons, blind, disabled, orphans, widows, and persons with major critical illness who have no source of livelihood.',
    coverageBenefit: 'Monthly direct benefit transfer (DBT) pension of ₹1,500 per month (₹18,000 annually).',
    eligibilityCriteriaSummary: 'Age below 65 years, permanent resident of Maharashtra for at least 15 years, annual family income not exceeding ₹21,000, and certified destitute/disabled.',
    ageRequirements: {
      minAge: 18,
      maxAge: 64,
      description: 'Age between 18 and 64 years (Senior citizens >= 65 transition to Shravan Bal Yojana)'
    },
    incomeRequirements: {
      maxAnnualIncome: 21000,
      incomeCertificateRequired: true,
      allowedRationCardTypes: ['Yellow', 'Antyodaya (AAY)', 'Orange'],
      description: 'Annual family income must not exceed ₹21,000 as certified by Tahsildar'
    },
    categoryRequirements: {
      allowedCategories: ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'Other'],
      casteCertificateRequired: false,
      description: 'Open to all categories; preferential consideration for destitute SC/ST'
    },
    disabilityRequirements: {
      minDisabilityPercentage: 40,
      disabilityCertificateRequired: false, // only required if applying under disability category
      description: 'If applying under disability criteria, minimum 40% certified disability required'
    },
    genderRequirements: 'ALL',
    residenceRequirements: {
      maharashtraDomicileRequired: true,
      minYearsInState: 15,
      description: 'Continuous residence in Maharashtra for minimum 15 years'
    },
    requiredDocuments: [
      { docType: 'income_certificate', docName: 'Income Certificate issued by Tahsildar (<= ₹21,000)', isMandatory: true, description: 'Valid income certificate for current financial year' },
      { docType: 'aadhaar_card', docName: 'Aadhaar Card', isMandatory: true, description: 'Identity and biometric authentication' },
      { docType: 'age_proof', docName: 'Age Proof / School Leaving / Birth Certificate', isMandatory: true, description: 'Proof of age 18-64' },
      { docType: 'bank_passbook', docName: 'Bank Passbook (Single/DBT enabled)', isMandatory: true, description: 'For direct monthly pension credit' },
      { docType: 'disability_certificate', docName: 'Disability Certificate (if applying under Divyang criteria)', isMandatory: false, description: 'Medical board certificate showing >= 40%' }
    ],
    applicationFormFields: [
      { fieldKey: 'applicantName', label: 'Applicant Full Name', type: 'text', required: true, placeholder: 'e.g. Suresh Kadam', helpText: 'Name as in bank account' },
      { fieldKey: 'maskedAadhaar', label: 'Masked Aadhaar Number', type: 'text', required: true, placeholder: 'XXXX-XXXX-1234', helpText: 'Aadhaar number' },
      { fieldKey: 'dob', label: 'Date of Birth', type: 'date', required: true, placeholder: 'YYYY-MM-DD', helpText: 'Age must be 18-64' },
      { fieldKey: 'annualIncome', label: 'Annual Family Income (₹)', type: 'number', required: true, placeholder: 'e.g. 18000', helpText: 'Must not exceed ₹21,000' },
      { fieldKey: 'tahsildarCertificateNo', label: 'Income Certificate Number', type: 'text', required: true, placeholder: 'e.g. INC/2026/89421', helpText: 'Tahsildar certificate number' },
      { fieldKey: 'yearsInMaharashtra', label: 'Years of Residence in Maharashtra', type: 'number', required: true, placeholder: 'e.g. 20', helpText: 'Minimum 15 years required' },
      { fieldKey: 'bankAccountNumber', label: 'Bank Account Number (Masked)', type: 'text', required: true, placeholder: 'XXXX-XXXX-5678', helpText: 'Aadhaar seeded bank account' },
      { fieldKey: 'bankIfsc', label: 'Bank IFSC Code', type: 'text', required: true, placeholder: 'MAHB0000123', helpText: 'Branch IFSC code' },
      { fieldKey: 'bankName', label: 'Bank Name & Branch', type: 'text', required: true, placeholder: 'Bank of Maharashtra, Pune', helpText: 'Bank details' }
    ],
    officialApplicationUrl: 'https://aaplesarkar.mahaonline.gov.in',
    lastVerifiedDate: '2026-01-15',
    sourceOfEligibilityRules: 'Government of Maharashtra Social Justice Department Resolution No. SGN-2021/CR-88/SJD',
    isActive: true
  },
  {
    schemeId: 'sbsny',
    schemeName: 'Shravan Bal Seva Nivruttivetan Yojana (SBSNY)',
    shortCode: 'SBSNY',
    governmentDepartment: 'Department of Social Justice and Special Assistance, Government of Maharashtra',
    state: 'Maharashtra',
    purpose: 'Monthly pension welfare assistance (₹1,500/month) specifically designed for senior citizens aged 65 years and above residing in Maharashtra.',
    coverageBenefit: 'Monthly direct benefit transfer (DBT) pension of ₹1,500 per month (₹18,000 annually).',
    eligibilityCriteriaSummary: 'Age 65 years or above, permanent resident of Maharashtra for at least 15 years, belonging to BPL category or annual family income not exceeding ₹21,000.',
    ageRequirements: {
      minAge: 65,
      maxAge: 120,
      description: 'Senior citizens aged 65 years and above'
    },
    incomeRequirements: {
      maxAnnualIncome: 21000,
      incomeCertificateRequired: true,
      allowedRationCardTypes: ['Yellow', 'Antyodaya (AAY)', 'Orange'],
      description: 'BPL family card or annual income up to ₹21,000 certified by Tahsildar'
    },
    categoryRequirements: {
      allowedCategories: ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'Other'],
      casteCertificateRequired: false,
      description: 'Open to all senior citizens of Maharashtra'
    },
    disabilityRequirements: {
      minDisabilityPercentage: 0,
      disabilityCertificateRequired: false,
      description: 'No disability restriction'
    },
    genderRequirements: 'ALL',
    residenceRequirements: {
      maharashtraDomicileRequired: true,
      minYearsInState: 15,
      description: 'Continuous residence in Maharashtra for minimum 15 years'
    },
    requiredDocuments: [
      { docType: 'age_proof', docName: 'Age Proof (Birth Certificate / School Leaving / Voter ID)', isMandatory: true, description: 'Confirming age >= 65 years' },
      { docType: 'income_certificate', docName: 'Tahsildar Income Certificate (<= ₹21,000) or BPL Card', isMandatory: true, description: 'Income eligibility proof' },
      { docType: 'aadhaar_card', docName: 'Aadhaar Card', isMandatory: true, description: 'Identity verification' },
      { docType: 'bank_passbook', docName: 'Bank Passbook with Aadhaar Seeding', isMandatory: true, description: 'For direct monthly DBT pension credits' }
    ],
    applicationFormFields: [
      { fieldKey: 'applicantName', label: 'Senior Citizen Full Name', type: 'text', required: true, placeholder: 'e.g. Tukaram Patil', helpText: 'Name as in Aadhaar card' },
      { fieldKey: 'maskedAadhaar', label: 'Masked Aadhaar Number', type: 'text', required: true, placeholder: 'XXXX-XXXX-1234', helpText: 'Masked UIDAI ID' },
      { fieldKey: 'dob', label: 'Date of Birth', type: 'date', required: true, placeholder: 'YYYY-MM-DD', helpText: 'Age must be >= 65' },
      { fieldKey: 'annualIncome', label: 'Annual Income (₹)', type: 'number', required: true, placeholder: 'e.g. 15000', helpText: 'Must not exceed ₹21,000' },
      { fieldKey: 'district', label: 'District', type: 'text', required: true, placeholder: 'e.g. Kolhapur, Solapur', helpText: 'Residential district' },
      { fieldKey: 'bankAccountNumber', label: 'Bank Account Number (Masked)', type: 'text', required: true, placeholder: 'XXXX-XXXX-9911', helpText: 'Aadhaar linked account' },
      { fieldKey: 'bankIfsc', label: 'Bank IFSC Code', type: 'text', required: true, placeholder: 'SBIN0001234', helpText: 'Branch IFSC' }
    ],
    officialApplicationUrl: 'https://aaplesarkar.mahaonline.gov.in',
    lastVerifiedDate: '2026-01-15',
    sourceOfEligibilityRules: 'Government of Maharashtra Social Justice Department Resolution No. SBS-2022/CR-45',
    isActive: true
  },
  {
    schemeId: 'jsy',
    schemeName: 'Janani Suraksha Yojana (JSY) / Matrushakti',
    shortCode: 'JSY',
    governmentDepartment: 'National Health Mission, Public Health Department, Government of Maharashtra',
    state: 'Maharashtra',
    purpose: 'Safe motherhood initiative promoting institutional deliveries among poor pregnant women through direct conditional cash assistance (₹1,000 to ₹1,400) and post-natal care support.',
    coverageBenefit: 'Direct financial assistance of ₹1,000 (urban) to ₹1,400 (rural) for institutional delivery plus free obstetric care and medications.',
    eligibilityCriteriaSummary: 'Pregnant women aged 19 years and above delivering in government or accredited private health facilities, belonging to BPL/SC/ST households.',
    ageRequirements: {
      minAge: 19,
      maxAge: 45,
      description: 'Pregnant women aged 19 years and above'
    },
    incomeRequirements: {
      maxAnnualIncome: 100000,
      incomeCertificateRequired: false,
      allowedRationCardTypes: ['Yellow', 'Antyodaya (AAY)', 'Orange'],
      description: 'BPL cardholders or SC/ST or low-income households'
    },
    categoryRequirements: {
      allowedCategories: ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'Other'],
      casteCertificateRequired: false,
      description: 'All BPL mothers; universal coverage for SC/ST pregnant women'
    },
    disabilityRequirements: {
      minDisabilityPercentage: 0,
      disabilityCertificateRequired: false,
      description: 'No disability restriction'
    },
    genderRequirements: 'FEMALE',
    residenceRequirements: {
      maharashtraDomicileRequired: true,
      minYearsInState: 0,
      description: 'Resident of Maharashtra'
    },
    requiredDocuments: [
      { docType: 'aadhaar_card', docName: 'Aadhaar Card', isMandatory: true, description: 'Identity and age verification' },
      { docType: 'age_proof', docName: 'Age Proof (DOB confirming >= 19 years)', isMandatory: true, description: 'Mother age proof' },
      { docType: 'bank_passbook', docName: 'Bank Passbook / Account Proof', isMandatory: true, description: 'Direct transfer to mother account' },
      { docType: 'ration_card', docName: 'BPL Ration Card or Caste Certificate (SC/ST)', isMandatory: true, description: 'Entitlement verification' }
    ],
    applicationFormFields: [
      { fieldKey: 'applicantName', label: 'Mother Full Name', type: 'text', required: true, placeholder: 'e.g. Sunita Pawar', helpText: 'Pregnant mother name' },
      { fieldKey: 'maskedAadhaar', label: 'Masked Aadhaar Number', type: 'text', required: true, placeholder: 'XXXX-XXXX-1234', helpText: 'UIDAI ID' },
      { fieldKey: 'dob', label: 'Date of Birth', type: 'date', required: true, placeholder: 'YYYY-MM-DD', helpText: 'Must be >= 19 years' },
      { fieldKey: 'mcpCardNo', label: 'Mother-Child Protection (MCP) / RCH ID', type: 'text', required: true, placeholder: 'e.g. RCH-2026-99881', helpText: 'ANC registered card number' },
      { fieldKey: 'deliveryFacility', label: 'Delivery Healthcare Facility', type: 'text', required: true, placeholder: 'e.g. Sub-District Hospital, Pune', helpText: 'Institutional delivery hospital' },
      { fieldKey: 'bankAccountNumber', label: 'Bank Account Number (Masked)', type: 'text', required: true, placeholder: 'XXXX-XXXX-4421', helpText: 'Mother individual account' },
      { fieldKey: 'bankIfsc', label: 'Bank IFSC Code', type: 'text', required: true, placeholder: 'MAHB0000456', helpText: 'Branch IFSC' }
    ],
    officialApplicationUrl: 'https://arogya.maharashtra.gov.in',
    lastVerifiedDate: '2026-01-15',
    sourceOfEligibilityRules: 'National Health Mission (NHM) Maharashtra Maternal Health Guidelines',
    isActive: true
  },
  {
    schemeId: 'divyang_swavalamban',
    schemeName: 'Divyang Swavalamban & Disability Pension Yojana',
    shortCode: 'DIVYANG',
    governmentDepartment: 'Department of Divyangjan Welfare, Government of Maharashtra',
    state: 'Maharashtra',
    purpose: 'Specialized welfare assistance, prosthetic/assistive aids, and monthly pension support for persons with benchmark disabilities (>= 40%) residing in Maharashtra.',
    coverageBenefit: 'Monthly pension of ₹1,500 plus 100% subsidy for specialized assistive equipment, prosthetic limbs, and medical rehabilitative devices.',
    eligibilityCriteriaSummary: 'Permanent resident of Maharashtra with minimum 40% certified disability confirmed via official Unique Disability ID (UDID) or Competent Medical Board Certificate.',
    ageRequirements: {
      minAge: 6,
      maxAge: 120,
      description: 'Children and adults aged 6 years and above'
    },
    incomeRequirements: {
      maxAnnualIncome: 50000,
      incomeCertificateRequired: true,
      allowedRationCardTypes: ['Yellow', 'Orange', 'Antyodaya (AAY)'],
      description: 'Annual family income not exceeding ₹50,000 for full monthly pension'
    },
    categoryRequirements: {
      allowedCategories: ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'Other'],
      casteCertificateRequired: false,
      description: 'Open to all categories'
    },
    disabilityRequirements: {
      minDisabilityPercentage: 40,
      disabilityCertificateRequired: true,
      description: 'Mandatory minimum 40% certified benchmark disability with UDID'
    },
    genderRequirements: 'ALL',
    residenceRequirements: {
      maharashtraDomicileRequired: true,
      minYearsInState: 5,
      description: 'Resident of Maharashtra for minimum 5 years'
    },
    requiredDocuments: [
      { docType: 'disability_certificate', docName: 'Disability Certificate / UDID Card (>= 40%)', isMandatory: true, description: 'Medical board verified certificate' },
      { docType: 'aadhaar_card', docName: 'Aadhaar Card', isMandatory: true, description: 'Identity verification' },
      { docType: 'income_certificate', docName: 'Income Certificate (<= ₹50,000)', isMandatory: true, description: 'Financial eligibility' },
      { docType: 'bank_passbook', docName: 'Bank Passbook', isMandatory: true, description: 'Direct DBT bank transfer' }
    ],
    applicationFormFields: [
      { fieldKey: 'applicantName', label: 'Divyangjan Beneficiary Name', type: 'text', required: true, placeholder: 'e.g. Ramesh Varma', helpText: 'Name as on UDID card' },
      { fieldKey: 'maskedAadhaar', label: 'Masked Aadhaar Number', type: 'text', required: true, placeholder: 'XXXX-XXXX-1234', helpText: 'Masked UIDAI ID' },
      { fieldKey: 'udidNumber', label: 'Unique Disability ID (UDID) Number', type: 'text', required: true, placeholder: 'e.g. MH1234567890123456', helpText: '18-digit UDID' },
      { fieldKey: 'disabilityType', label: 'Disability Category', type: 'select', required: true, options: ['Locomotor Disability', 'Visual Impairment', 'Hearing Impairment', 'Intellectual Disability', 'Cerebral Palsy', 'Multiple Disabilities'], placeholder: 'Select disability type', helpText: 'Medical board diagnosed category' },
      { fieldKey: 'disabilityPercentage', label: 'Certified Disability Percentage (%)', type: 'number', required: true, placeholder: 'e.g. 50', helpText: 'Must be >= 40%' },
      { fieldKey: 'issuingHospital', label: 'Issuing Medical Board / Hospital', type: 'text', required: true, placeholder: 'Civil Surgeon, District Hospital Thane', helpText: 'Authorized medical board' },
      { fieldKey: 'bankAccountNumber', label: 'Bank Account Number (Masked)', type: 'text', required: true, placeholder: 'XXXX-XXXX-1234', helpText: 'Account number for pension' },
      { fieldKey: 'bankIfsc', label: 'Bank IFSC Code', type: 'text', required: true, placeholder: 'MAHB0000123', helpText: 'Branch IFSC code' }
    ],
    officialApplicationUrl: 'https://divyangjan.maharashtra.gov.in',
    lastVerifiedDate: '2026-01-15',
    sourceOfEligibilityRules: 'Rights of Persons with Disabilities Rules & Dept of Divyangjan Welfare GoM Notification',
    isActive: true
  }
];

export const seedGovernmentSchemes = async () => {
  try {
    const existingCount = await GovernmentScheme.countDocuments();
    if (existingCount >= 6) {
      console.log(`🏛️ Government schemes already seeded (${existingCount} active schemes found).`);
      return;
    }

    console.log('🏛️ Seeding official Government Schemes database and eligibility rules...');

    // Upsert official schemes
    for (const scheme of OFFICIAL_SCHEMES) {
      await GovernmentScheme.findOneAndUpdate(
        { schemeId: scheme.schemeId },
        scheme,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Seed Demo PatientSchemeProfile for PAT-2026-000001 (Rahul Patil)
    const existingProfile = await PatientSchemeProfile.findOne({ patientId: 'PAT-2026-000001' });
    if (!existingProfile) {
      const demoProfile = await PatientSchemeProfile.create({
        patientId: 'PAT-2026-000001',
        demographics: {
          fullName: 'Rahul Patil',
          maskedAadhaar: 'XXXX-XXXX-1234',
          aadhaarHash: '8f4c2e6b1a9d3e5f7c8b0a2d4f6e8a1c3e5b7d9f0a2c4e6b8d0a2f4c6e8b0a2d',
          dob: '1988-04-12',
          age: 38,
          gender: 'Male',
          mobile: '9988776651',
          email: 'patient@demo.health'
        },
        address: {
          fullAddress: 'Flat 402, Shivshrusti Heights, Shivaji Nagar, Pune - 411005',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '411005',
          isMaharashtraDomicile: true,
          yearsResidentInState: 25
        },
        socioEconomic: {
          rationCardNumber: 'RC-XXXX-XXXX-8921',
          rationCardType: 'Yellow', // BPL priority
          annualIncome: 48000,
          casteCategory: 'OBC',
          casteName: 'Mali',
          isDisabilityApplicable: false,
          disabilityType: 'None',
          disabilityPercentage: 0,
          udidNumber: '',
          isPregnantOrLactating: false,
          bankDetails: {
            bankName: 'Bank of Maharashtra',
            accountNumberMasked: 'XXXX-XXXX-6789',
            ifscCode: 'MAHB0000123',
            branch: 'Shivaji Nagar Branch, Pune'
          }
        },
        documentsSummary: {
          aadhaarVerified: true,
          rationCardVerified: true,
          incomeCertVerified: true,
          casteCertVerified: true,
          disabilityCertVerified: false,
          birthCertVerified: true,
          bankProofVerified: true
        },
        consentGiven: true,
        consentTimestamp: new Date(),
        lastSynthesizedAt: new Date()
      });

      // Run eligibility engine for the demo profile
      const allSchemes = await GovernmentScheme.find({ isActive: true });
      const evaluationResult = evaluatePatientEligibility(demoProfile, allSchemes);

      await SchemeRecommendation.findOneAndUpdate(
        { patientId: 'PAT-2026-000001' },
        {
          patientId: 'PAT-2026-000001',
          recommendations: evaluationResult.recommendations,
          summary: evaluationResult.summary,
          disclaimer: evaluationResult.disclaimer,
          evaluatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log('✅ Demo PatientSchemeProfile & SchemeRecommendations seeded successfully for PAT-2026-000001!');
    }

    console.log('✅ Official Government Scheme database and rule configs seeded successfully!');
  } catch (err) {
    console.error('❌ Failed to seed Government Schemes:', err);
  }
};

