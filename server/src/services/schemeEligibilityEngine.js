/**
 * Rule-Based Government Scheme Eligibility Engine
 * 
 * Evaluates patient demographic, socio-economic, and supporting document profiles
 * against official published scheme criteria.
 * 
 * Status Categories:
 * - POTENTIALLY_ELIGIBLE: All confirmed rules satisfied.
 * - INSUFFICIENT_INFORMATION: Crucial information or mandatory supporting document missing.
 * - INELIGIBLE: One or more confirmed published rules failed (e.g. age < minAge, income > ceiling).
 * 
 * Guardrail: Clearly states preliminary AI assessment nature and prohibits unauthorized government decisions.
 */

export const MANDATORY_LEGAL_DISCLAIMER = 
  'Preliminary AI evaluation based on published government criteria. Final eligibility must be verified by official government authorities through authorized portals or hospital Arogya Mitra desks.';

export const evaluatePatientEligibility = (profile, schemes, rules = []) => {
  if (!profile) {
    return {
      recommendations: [],
      summary: { eligibleCount: 0, infoNeededCount: 0, ineligibleCount: 0, totalEvaluated: 0 },
      disclaimer: MANDATORY_LEGAL_DISCLAIMER,
      evaluatedAt: new Date()
    };
  }

  const { demographics = {}, address = {}, socioEconomic = {}, documentsSummary = {} } = profile;

  const age = demographics.age ?? (demographics.dob ? calculateAge(demographics.dob) : null);
  const gender = demographics.gender || 'Unknown';
  const state = address.state || 'Maharashtra';
  const isMaharashtraResident = address.isMaharashtraDomicile ?? (state.toLowerCase().includes('maharashtra'));
  const annualIncome = socioEconomic.annualIncome;
  const rationType = socioEconomic.rationCardType || 'None';
  const casteCategory = socioEconomic.casteCategory || 'General';
  const isDisabilityApplicable = socioEconomic.isDisabilityApplicable || (socioEconomic.disabilityPercentage > 0);
  const disabilityPercentage = socioEconomic.disabilityPercentage || 0;
  const isPregnant = socioEconomic.isPregnantOrLactating || false;

  const recommendations = schemes.map(scheme => {
    const reasons = [];
    const missingFields = [];
    const missingDocuments = [];
    const ruleEvaluations = [];

    let hasConfirmedFailure = false;
    let hasMissingInfo = false;
    let passedRuleScore = 0;
    let totalRuleScore = 0;

    // 1. AGE CHECK
    if (scheme.ageRequirements) {
      const { minAge = 0, maxAge = 120, description } = scheme.ageRequirements;
      totalRuleScore += 20;

      if (age === null || age === undefined) {
        hasMissingInfo = true;
        missingFields.push('Age / Date of Birth');
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_AGE_CHECK`,
          name: 'Age Requirement',
          passed: false,
          isMandatory: true,
          note: `Age not specified in profile. Required: ${description || `${minAge}-${maxAge} years`}`
        });
      } else if (age < minAge) {
        hasConfirmedFailure = true;
        reasons.push(`Current age (${age} years) is below minimum age requirement of ${minAge} years.`);
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_AGE_CHECK`,
          name: 'Age Requirement',
          passed: false,
          isMandatory: true,
          note: `Age (${age}) is below minimum of ${minAge} years`
        });
      } else if (age > maxAge) {
        hasConfirmedFailure = true;
        reasons.push(`Current age (${age} years) exceeds maximum age limit of ${maxAge} years.`);
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_AGE_CHECK`,
          name: 'Age Requirement',
          passed: false,
          isMandatory: true,
          note: `Age (${age}) exceeds maximum of ${maxAge} years`
        });
      } else {
        passedRuleScore += 20;
        reasons.push(`Age requirement satisfied (${age} years; required: ${minAge} - ${maxAge} years).`);
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_AGE_CHECK`,
          name: 'Age Requirement',
          passed: true,
          isMandatory: true,
          note: `Age ${age} falls within ${minAge} to ${maxAge} years`
        });
      }
    }

    // 2. RESIDENCE / DOMICILE CHECK
    if (scheme.residenceRequirements) {
      const { maharashtraDomicileRequired = true, description } = scheme.residenceRequirements;
      totalRuleScore += 20;

      if (maharashtraDomicileRequired && !isMaharashtraResident) {
        hasConfirmedFailure = true;
        reasons.push('Requires permanent domicile / residence in Maharashtra.');
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_RESIDENCE_CHECK`,
          name: 'State Residence / Domicile',
          passed: false,
          isMandatory: true,
          note: 'Non-resident of Maharashtra'
        });
      } else {
        passedRuleScore += 20;
        reasons.push('Maharashtra state domicile requirement satisfied.');
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_RESIDENCE_CHECK`,
          name: 'State Residence / Domicile',
          passed: true,
          isMandatory: true,
          note: 'Verified Maharashtra residence / domicile'
        });
      }
    }

    // 3. INCOME & RATION CARD CHECK
    if (scheme.incomeRequirements) {
      const { maxAnnualIncome, incomeCertificateRequired, allowedRationCardTypes = [] } = scheme.incomeRequirements;
      totalRuleScore += 25;

      // Ration card check
      const rationAllowed = allowedRationCardTypes.length === 0 || allowedRationCardTypes.includes(rationType);

      if (maxAnnualIncome !== null && maxAnnualIncome !== undefined) {
        if (annualIncome === null || annualIncome === undefined) {
          // If Yellow/AAY ration card is present, that indicates BPL status in Maharashtra
          if (rationType === 'Yellow' || rationType === 'Antyodaya (AAY)') {
            passedRuleScore += 25;
            reasons.push(`BPL status demonstrated via ${rationType} ration card.`);
            ruleEvaluations.push({
              ruleCode: `${scheme.shortCode}_INCOME_CHECK`,
              name: 'Income & Welfare Category',
              passed: true,
              isMandatory: true,
              note: `Covered under BPL criterion via ${rationType} ration card`
            });
          } else {
            hasMissingInfo = true;
            missingFields.push('Annual Family Income');
            if (incomeCertificateRequired && !documentsSummary.incomeCertVerified) {
              missingDocuments.push('Income Certificate issued by Tahsildar');
            }
            ruleEvaluations.push({
              ruleCode: `${scheme.shortCode}_INCOME_CHECK`,
              name: 'Income Limit',
              passed: false,
              isMandatory: true,
              note: `Annual income not specified. Scheme ceiling is ₹${maxAnnualIncome.toLocaleString('en-IN')}`
            });
          }
        } else if (annualIncome > maxAnnualIncome) {
          hasConfirmedFailure = true;
          reasons.push(`Annual income ₹${annualIncome.toLocaleString('en-IN')} exceeds the scheme ceiling of ₹${maxAnnualIncome.toLocaleString('en-IN')}.`);
          ruleEvaluations.push({
            ruleCode: `${scheme.shortCode}_INCOME_CHECK`,
            name: 'Income Limit',
            passed: false,
            isMandatory: true,
            note: `Annual income (₹${annualIncome.toLocaleString('en-IN')}) exceeds ceiling of ₹${maxAnnualIncome.toLocaleString('en-IN')}`
          });
        } else {
          passedRuleScore += 25;
          reasons.push(`Annual income ₹${annualIncome.toLocaleString('en-IN')} is within the scheme ceiling of ₹${maxAnnualIncome.toLocaleString('en-IN')}.`);
          ruleEvaluations.push({
            ruleCode: `${scheme.shortCode}_INCOME_CHECK`,
            name: 'Income Limit',
            passed: true,
            isMandatory: true,
            note: `Income ₹${annualIncome.toLocaleString('en-IN')} is within ₹${maxAnnualIncome.toLocaleString('en-IN')}`
          });
        }
      } else if (allowedRationCardTypes.length > 0) {
        if (rationAllowed) {
          passedRuleScore += 25;
          reasons.push(`Ration card category (${rationType}) is eligible for coverage.`);
          ruleEvaluations.push({
            ruleCode: `${scheme.shortCode}_RATION_CHECK`,
            name: 'Ration Card Category',
            passed: true,
            isMandatory: true,
            note: `Covered under ${rationType} ration card category`
          });
        } else {
          hasConfirmedFailure = true;
          reasons.push(`Ration card category (${rationType}) is not listed under covered categories (${allowedRationCardTypes.join(', ')}).`);
          ruleEvaluations.push({
            ruleCode: `${scheme.shortCode}_RATION_CHECK`,
            name: 'Ration Card Category',
            passed: false,
            isMandatory: true,
            note: `Ration card type ${rationType} not eligible`
          });
        }
      } else {
        passedRuleScore += 25;
        reasons.push('Universal / No strict income ceiling applicable.');
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_INCOME_CHECK`,
          name: 'Income Requirement',
          passed: true,
          isMandatory: false,
          note: 'Universal health coverage criteria'
        });
      }
    }

    // 4. DISABILITY CHECK
    if (scheme.disabilityRequirements && scheme.disabilityRequirements.minDisabilityPercentage > 0) {
      const minDisability = scheme.disabilityRequirements.minDisabilityPercentage;
      const isMandatoryDisability = scheme.disabilityRequirements.disabilityCertificateRequired;
      totalRuleScore += 20;

      if (!isDisabilityApplicable && disabilityPercentage === 0) {
        if (isMandatoryDisability) {
          hasConfirmedFailure = true;
          reasons.push(`Scheme specifically requires minimum ${minDisability}% certified disability.`);
          ruleEvaluations.push({
            ruleCode: `${scheme.shortCode}_DISABILITY_CHECK`,
            name: 'Disability Benchmark Requirement',
            passed: false,
            isMandatory: true,
            note: `Requires certified benchmark disability of at least ${minDisability}%`
          });
        } else {
          // Optional criteria (e.g. SGNAY which covers destitute / widows / orphans / disabled)
          ruleEvaluations.push({
            ruleCode: `${scheme.shortCode}_DISABILITY_CHECK`,
            name: 'Disability Benchmark (Optional)',
            passed: true,
            isMandatory: false,
            note: 'Applicable via destitute / widow / orphan provision'
          });
        }
      } else if (disabilityPercentage < minDisability) {
        hasConfirmedFailure = true;
        reasons.push(`Certified disability (${disabilityPercentage}%) is below required threshold of ${minDisability}%.`);
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_DISABILITY_CHECK`,
          name: 'Disability Benchmark Requirement',
          passed: false,
          isMandatory: isMandatoryDisability,
          note: `Disability percentage (${disabilityPercentage}%) is below ${minDisability}%`
        });
      } else {
        passedRuleScore += 20;
        reasons.push(`Disability percentage (${disabilityPercentage}%) satisfies benchmark requirement (>= ${minDisability}%).`);
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_DISABILITY_CHECK`,
          name: 'Disability Benchmark Requirement',
          passed: true,
          isMandatory: isMandatoryDisability,
          note: `Certified disability (${disabilityPercentage}%) meets ${minDisability}% benchmark`
        });
      }
    }

    // 5. GENDER CHECK (e.g. Maternal / Women welfare schemes)
    if (scheme.genderRequirements && scheme.genderRequirements !== 'ALL') {
      totalRuleScore += 15;
      const targetGender = scheme.genderRequirements.toUpperCase();
      const userGender = gender.toUpperCase();

      if (userGender === 'UNKNOWN') {
        hasMissingInfo = true;
        missingFields.push('Gender');
      } else if (userGender !== targetGender && !userGender.startsWith(targetGender[0])) {
        hasConfirmedFailure = true;
        reasons.push(`Scheme is exclusively for ${scheme.genderRequirements.toLowerCase()} beneficiaries.`);
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_GENDER_CHECK`,
          name: 'Gender Requirement',
          passed: false,
          isMandatory: true,
          note: `Beneficiary gender must be ${scheme.genderRequirements}`
        });
      } else {
        passedRuleScore += 15;
        reasons.push(`Gender requirement satisfied (${gender}).`);
        ruleEvaluations.push({
          ruleCode: `${scheme.shortCode}_GENDER_CHECK`,
          name: 'Gender Requirement',
          passed: true,
          isMandatory: true,
          note: `Gender (${gender}) matches scheme criteria`
        });
      }
    }

    // 6. REQUIRED DOCUMENTS CHECK
    if (scheme.requiredDocuments && scheme.requiredDocuments.length > 0) {
      scheme.requiredDocuments.forEach(doc => {
        let isUploaded = false;
        if (doc.docType === 'aadhaar_card' || doc.docType === 'aadhaar') {
          isUploaded = Boolean(documentsSummary.aadhaarVerified || demographics.maskedAadhaar);
        } else if (doc.docType === 'ration_card' || doc.docType === 'ration') {
          isUploaded = Boolean(documentsSummary.rationCardVerified || socioEconomic.rationCardNumber);
        } else if (doc.docType === 'income_certificate' || doc.docType === 'income') {
          isUploaded = Boolean(documentsSummary.incomeCertVerified);
        } else if (doc.docType === 'caste_certificate' || doc.docType === 'caste') {
          isUploaded = Boolean(documentsSummary.casteCertVerified);
        } else if (doc.docType === 'disability_certificate' || doc.docType === 'disability' || doc.docType === 'udid') {
          isUploaded = Boolean(documentsSummary.disabilityCertVerified || socioEconomic.udidNumber);
        } else if (doc.docType === 'birth_certificate' || doc.docType === 'birth' || doc.docType === 'age_proof') {
          isUploaded = Boolean(documentsSummary.birthCertVerified || demographics.dob);
        } else if (doc.docType === 'bank_passbook' || doc.docType === 'bank_proof' || doc.docType === 'bank') {
          isUploaded = Boolean(documentsSummary.bankProofVerified || socioEconomic.bankDetails?.accountNumberMasked);
        }

        if (!isUploaded && doc.isMandatory) {
          missingDocuments.push(doc.docName);
          if (scheme.incomeRequirements?.incomeCertificateRequired && doc.docType === 'income_certificate') {
            hasMissingInfo = true;
          }
        }
      });
    }

    // 7. COMPUTE FINAL ELIGIBILITY STATUS
    let eligibilityStatus = 'POTENTIALLY_ELIGIBLE';
    if (hasConfirmedFailure) {
      eligibilityStatus = 'INELIGIBLE';
    } else if (hasMissingInfo || missingDocuments.length > 2) {
      eligibilityStatus = 'INSUFFICIENT_INFORMATION';
    }

    const matchScore = totalRuleScore > 0 ? Math.round((passedRuleScore / totalRuleScore) * 100) : 75;

    return {
      schemeId: scheme.schemeId,
      schemeName: scheme.schemeName,
      shortCode: scheme.shortCode,
      governmentDepartment: scheme.governmentDepartment,
      state: scheme.state,
      eligibilityStatus,
      matchScore: hasConfirmedFailure ? Math.min(matchScore, 35) : matchScore,
      coverageBenefit: scheme.coverageBenefit,
      officialUrl: scheme.officialApplicationUrl,
      reasons,
      missingFields,
      missingDocuments,
      ruleEvaluations
    };
  });

  // Sort: POTENTIALLY_ELIGIBLE first (by match score desc), then INSUFFICIENT_INFORMATION, then INELIGIBLE
  const statusRank = {
    'POTENTIALLY_ELIGIBLE': 1,
    'INSUFFICIENT_INFORMATION': 2,
    'INELIGIBLE': 3
  };

  recommendations.sort((a, b) => {
    if (statusRank[a.eligibilityStatus] !== statusRank[b.eligibilityStatus]) {
      return statusRank[a.eligibilityStatus] - statusRank[b.eligibilityStatus];
    }
    return b.matchScore - a.matchScore;
  });

  const summary = {
    eligibleCount: recommendations.filter(r => r.eligibilityStatus === 'POTENTIALLY_ELIGIBLE').length,
    infoNeededCount: recommendations.filter(r => r.eligibilityStatus === 'INSUFFICIENT_INFORMATION').length,
    ineligibleCount: recommendations.filter(r => r.eligibilityStatus === 'INELIGIBLE').length,
    totalEvaluated: recommendations.length
  };

  return {
    recommendations,
    summary,
    disclaimer: MANDATORY_LEGAL_DISCLAIMER,
    evaluatedAt: new Date()
  };
};

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const parts = dobString.split(/[-/]/);
  let birthDate;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  } else {
    birthDate = new Date(dobString);
  }

  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
