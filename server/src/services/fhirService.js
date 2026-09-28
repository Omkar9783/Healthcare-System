/**
 * FHIR-Ready Interoperability Transformation Service
 * Converts internal MediSecure models into standardized HL7 FHIR R4 JSON schemas.
 */

export const toFHIRPatient = (patient) => {
  return {
    resourceType: 'Patient',
    id: patient.uid,
    identifier: [
      {
        use: 'official',
        system: 'https://medisecure.health/fhir/uid',
        value: patient.uid
      }
    ],
    name: [
      {
        use: 'official',
        text: patient.name
      }
    ],
    gender: (patient.gender || 'other').toLowerCase(),
    birthDate: patient.dateOfBirth,
    telecom: [
      { system: 'phone', value: patient.phone, use: 'mobile' },
      { system: 'email', value: patient.email, use: 'home' }
    ],
    contact: patient.emergencyContact ? [
      {
        relationship: [{ text: patient.emergencyContact.relation }],
        name: { text: patient.emergencyContact.name },
        telecom: [{ system: 'phone', value: patient.emergencyContact.phone }]
      }
    ] : []
  };
};

export const toFHIRObservation = (vitals) => {
  return {
    resourceType: 'Observation',
    id: vitals._id,
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }]
    },
    subject: { reference: `Patient/${vitals.patientUid}` },
    effectiveDateTime: vitals.recordedAt,
    performer: [{ display: vitals.recordedByName }],
    component: [
      {
        code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
        valueQuantity: { value: parseInt(vitals.bloodPressure?.split('/')[0]) || 120, unit: 'mmHg' }
      },
      {
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
        valueQuantity: { value: vitals.heartRate, unit: 'beats/min' }
      },
      {
        code: { coding: [{ system: 'http://loinc.org', code: '59408-5', display: 'Oxygen saturation' }] },
        valueQuantity: { value: vitals.spO2, unit: '%' }
      }
    ]
  };
};

export const toFHIRMedicationRequest = (prescription) => {
  return {
    resourceType: 'MedicationRequest',
    id: prescription._id,
    status: prescription.dispensingStatus === 'Dispensed' ? 'completed' : 'active',
    intent: 'order',
    subject: { reference: `Patient/${prescription.patientUid}` },
    requester: { display: prescription.doctorName },
    authoredOn: prescription.createdAt,
    dosageInstruction: (prescription.medicines || []).map(m => ({
      text: `${m.name} ${m.dosage} - ${m.frequency} for ${m.duration}`,
      patientInstruction: m.instructions
    }))
  };
};
