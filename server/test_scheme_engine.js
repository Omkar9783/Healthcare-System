import { evaluatePatientEligibility, MANDATORY_LEGAL_DISCLAIMER } from './src/services/schemeEligibilityEngine.js';
import { OFFICIAL_SCHEMES } from './src/seedSchemes.js';

console.log('🧪 Starting Rule-Based Scheme Eligibility Engine Tests...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// Test 1: Legal Disclaimer presence
assert(
  typeof MANDATORY_LEGAL_DISCLAIMER === 'string' && MANDATORY_LEGAL_DISCLAIMER.includes('Preliminary AI evaluation'),
  'Mandatory legal disclaimer is properly defined and includes preliminary assessment clause'
);

// Test 2: BPL Yellow card holder in Maharashtra (Age 38, Income ₹48,000)
const bplProfile = {
  demographics: { fullName: 'Rahul Patil', age: 38, dob: '1988-04-12', gender: 'Male' },
  address: { state: 'Maharashtra', isMaharashtraDomicile: true },
  socioEconomic: {
    rationCardType: 'Yellow',
    annualIncome: 48000,
    isDisabilityApplicable: false,
    disabilityPercentage: 0
  },
  documentsSummary: { aadhaarVerified: true, rationCardVerified: true, incomeCertVerified: true }
};

const res1 = evaluatePatientEligibility(bplProfile, OFFICIAL_SCHEMES);
const mjpjay1 = res1.recommendations.find(r => r.schemeId === 'mjpjay');
const pmjay1 = res1.recommendations.find(r => r.schemeId === 'pmjay');
const sbsny1 = res1.recommendations.find(r => r.schemeId === 'sbsny');

assert(mjpjay1 && mjpjay1.eligibilityStatus === 'POTENTIALLY_ELIGIBLE', 'BPL resident is POTENTIALLY_ELIGIBLE for MJPJAY 2.0');
assert(pmjay1 && pmjay1.eligibilityStatus === 'POTENTIALLY_ELIGIBLE', 'BPL yellow card holder is POTENTIALLY_ELIGIBLE for PM-JAY');
assert(sbsny1 && sbsny1.eligibilityStatus === 'INELIGIBLE', 'Age 38 is INELIGIBLE for Senior Citizen Shravan Bal Yojana (requires >= 65)');
assert(sbsny1 && sbsny1.reasons.some(r => r.includes('below minimum age')), 'SBSNY ineligible reason clearly cites age constraint');

// Test 3: Senior Citizen (Age 68, Income ₹18,000, Maharashtra Resident)
const seniorProfile = {
  demographics: { fullName: 'Tukaram Patil', age: 68, dob: '1958-01-01', gender: 'Male' },
  address: { state: 'Maharashtra', isMaharashtraDomicile: true },
  socioEconomic: {
    rationCardType: 'Orange',
    annualIncome: 18000,
    isDisabilityApplicable: false,
    disabilityPercentage: 0
  },
  documentsSummary: { aadhaarVerified: true, rationCardVerified: true, incomeCertVerified: true, birthCertVerified: true }
};

const res2 = evaluatePatientEligibility(seniorProfile, OFFICIAL_SCHEMES);
const sbsny2 = res2.recommendations.find(r => r.schemeId === 'sbsny');
assert(sbsny2 && sbsny2.eligibilityStatus === 'POTENTIALLY_ELIGIBLE', 'Senior citizen aged 68 with income ₹18,000 is POTENTIALLY_ELIGIBLE for SBSNY');

// Test 4: Divyang Benchmark (50% Locomotor Disability, Income ₹35,000)
const divyangProfile = {
  demographics: { fullName: 'Ramesh Varma', age: 32, dob: '1994-06-15', gender: 'Male' },
  address: { state: 'Maharashtra', isMaharashtraDomicile: true },
  socioEconomic: {
    rationCardType: 'Orange',
    annualIncome: 35000,
    isDisabilityApplicable: true,
    disabilityPercentage: 50,
    udidNumber: 'MH1234567890123456'
  },
  documentsSummary: { aadhaarVerified: true, disabilityCertVerified: true, incomeCertVerified: true }
};

const res3 = evaluatePatientEligibility(divyangProfile, OFFICIAL_SCHEMES);
const divyang3 = res3.recommendations.find(r => r.schemeId === 'divyang_swavalamban');
assert(divyang3 && divyang3.eligibilityStatus === 'POTENTIALLY_ELIGIBLE', '50% disability patient is POTENTIALLY_ELIGIBLE for Divyang Swavalamban Yojana');

// Test 5: High Income Earner (Income ₹4,00,000)
const highIncomeProfile = {
  demographics: { fullName: 'Vikram Joshi', age: 40, dob: '1986-02-10', gender: 'Male' },
  address: { state: 'Maharashtra', isMaharashtraDomicile: true },
  socioEconomic: {
    rationCardType: 'White',
    annualIncome: 400000,
    isDisabilityApplicable: false,
    disabilityPercentage: 0
  },
  documentsSummary: { aadhaarVerified: true, rationCardVerified: true }
};

const res4 = evaluatePatientEligibility(highIncomeProfile, OFFICIAL_SCHEMES);
const mjpjay4 = res4.recommendations.find(r => r.schemeId === 'mjpjay');
const sgnay4 = res4.recommendations.find(r => r.schemeId === 'sgnay');
assert(mjpjay4 && mjpjay4.eligibilityStatus === 'POTENTIALLY_ELIGIBLE', 'MJPJAY 2.0 covers White card holders under universal Maharashtra mandate');
assert(sgnay4 && sgnay4.eligibilityStatus === 'INELIGIBLE', 'SGNAY is INELIGIBLE due to income exceeding ₹21,000 ceiling');

// Test 6: Missing Income information when required
const missingInfoProfile = {
  demographics: { fullName: 'Anita Shinde', age: 45, dob: '1981-08-20', gender: 'Female' },
  address: { state: 'Maharashtra', isMaharashtraDomicile: true },
  socioEconomic: {
    rationCardType: 'Orange',
    annualIncome: null // Missing income
  },
  documentsSummary: { aadhaarVerified: true, incomeCertVerified: false }
};

const res5 = evaluatePatientEligibility(missingInfoProfile, OFFICIAL_SCHEMES);
const sgnay5 = res5.recommendations.find(r => r.schemeId === 'sgnay');
assert(sgnay5 && sgnay5.eligibilityStatus === 'INSUFFICIENT_INFORMATION', 'Missing income marks scheme as INSUFFICIENT_INFORMATION');
assert(sgnay5 && sgnay5.missingDocuments.some(d => d.includes('Income Certificate')), 'Identifies missing Income Certificate');

console.log(`\n🎉 Results: ${passedTests}/${totalTests} tests passed successfully!\n`);

