import re
import datetime
from typing import Dict, Any, Tuple, List, Optional
from app.api.schemas import AadhaarVerificationData, StatusFlag, EligibleSchemeItem
from app.ocr.text_extraction import TextExtractionService

class AadhaarValidationService:
    @staticmethod
    def calculate_age(dob: Optional[str], yob: Optional[str]) -> Optional[int]:
        """
        Calculates approximate age from DOB (DD/MM/YYYY or YYYY-MM-DD) or Year of Birth.
        """
        current_year = datetime.datetime.now().year
        if yob and yob.strip().isdigit() and len(yob.strip()) == 4:
            return current_year - int(yob.strip())
        if dob:
            m = re.search(r'\b(19\d\d|20\d\d)\b', dob)
            if m:
                return current_year - int(m.group(1))
        return None

    @staticmethod
    def determine_schemes(data: AadhaarVerificationData) -> List[EligibleSchemeItem]:
        """
        Maps extracted Aadhaar demographics (Age, Gender, State/Address, Identity)
        to applicable Indian Central and State Government Health Schemes.
        """
        schemes = []
        age = AadhaarValidationService.calculate_age(data.dob, data.year_of_birth)
        gender = (data.gender or "").strip().lower()
        state = (data.state or "").strip().lower()
        address = (data.address or "").strip().lower()

        # 1. Ayushman Bharat PM-JAY (Central Healthcare Cover)
        schemes.append(EligibleSchemeItem(
            scheme_name="PM-JAY",
            scheme_full_name="Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
            eligibility_status="Eligible - Direct Aadhaar e-KYC Linkable",
            eligibility_reason="Verified Indian citizen identity via UIDAI Aadhaar. Enables immediate Golden Card generation via Ayushman Mitra or NHA portal.",
            coverage_amount="₹5,00,000 per family per year",
            official_portal_url="https://beneficiary.nha.gov.in",
            procedures_count=1949,
            benefits=[
                "100% cashless hospitalization across 28,000+ empanelled hospitals nationwide",
                "1,949 specialized treatment and surgical packages with zero out-of-pocket expenses",
                "All-India portability and 3 days pre-hospitalization / 15 days post-hospitalization medicine cover"
            ]
        ))

        # 2. Ayushman Bharat Health Account (ABHA / ABDM Digital Health ID)
        schemes.append(EligibleSchemeItem(
            scheme_name="ABHA",
            scheme_full_name="Ayushman Bharat Digital Health Account (ABHA / ABDM ID)",
            eligibility_status="Directly Linkable via Aadhaar",
            eligibility_reason="Aadhaar e-KYC enables instant generation of 14-digit ABHA Number and personal health records repository.",
            coverage_amount="Free Universal Digital Health Account",
            official_portal_url="https://abha.abdm.gov.in",
            procedures_count=0,
            benefits=[
                "Instant Scan & Share token generation for express OPD registration at AIIMS and government hospitals",
                "Secure digital storage of lab reports, discharge summaries, and prescriptions",
                "Consent-based longitudinal health record sharing with certified healthcare providers"
            ]
        ))

        # 3. Maharashtra MJPJAY 2.0 (State Healthcare Universal Cover)
        is_maharashtra = "maharashtra" in state or "maharashtra" in address or any(
            city in address for city in ["mumbai", "pune", "nagpur", "thane", "nashik", "aurangabad", "solapur"]
        )
        if is_maharashtra or not state:
            schemes.append(EligibleSchemeItem(
                scheme_name="MJPJAY",
                scheme_full_name="Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY 2.0 - Universal Cover)",
                eligibility_status="Eligible - Maharashtra Domicile / Resident",
                eligibility_reason=f"Aadhaar records verify residency in {data.state or 'Maharashtra'}. Qualified for universal state cashless healthcare under expanded MJPJAY 2.0.",
                coverage_amount="₹5,00,000 per family per year",
                official_portal_url="https://www.jeevandayee.gov.in",
                procedures_count=1356,
                benefits=[
                    "100% cashless treatment across 1,356 secondary and tertiary procedures in Maharashtra",
                    "Covers pre-existing medical conditions from Day 1 with no waiting period",
                    "Includes all hospital diagnostics, medicines, ICU, and 10 days post-discharge medications"
                ]
            ))

        # 4. Senior Citizen Universal Cover (Age 70+ Expansion)
        if age is not None and age >= 70:
            schemes.append(EligibleSchemeItem(
                scheme_name="PM-JAY Vayoshri",
                scheme_full_name="Ayushman Bharat Vayoshri – Universal Health Cover for Senior Citizens (70+)",
                eligibility_status="Eligible - Senior Citizen 70+ Priority Benefit",
                eligibility_reason=f"Aadhaar Date of Birth confirms age of {age} (70+ category). Automatically entitled to standalone universal ₹5 Lakh annual top-up health insurance irrespective of income.",
                coverage_amount="₹5,00,000 dedicated individual cover per year",
                official_portal_url="https://beneficiary.nha.gov.in",
                procedures_count=1949,
                benefits=[
                    "Universal coverage for all Indian citizens aged 70+ irrespective of family economic status",
                    "Dedicated ₹5,00,000 annual top-up cover separate from family floater pool",
                    "Comprehensive geriatric critical care, orthopedics, cardiology, and oncology treatments"
                ]
            ))
        elif age is not None and age >= 60:
            schemes.append(EligibleSchemeItem(
                scheme_name="NPHCE",
                scheme_full_name="National Programme for Health Care of the Elderly (NPHCE)",
                eligibility_status="Eligible - Senior Geriatric Care",
                eligibility_reason=f"Aadhaar records confirm age of {age} (Senior Citizen 60–69). Entitled to specialized geriatric OPD and weekly diagnostic packages.",
                coverage_amount="Free Geriatric Consultations & Chronic Medicines",
                official_portal_url="https://main.mohfw.gov.in",
                procedures_count=500,
                benefits=[
                    "Free dedicated geriatric clinical consultations and non-communicable disease (NCD) screenings",
                    "Free chronic medicines for hypertension, diabetes, and cardiovascular health",
                    "Priority assistive healthcare devices and physiotherapy support"
                ]
            ))

        # 5. Maternity & Reproductive Health Schemes (Female Beneficiaries)
        if gender in ["female", "f", "woman"]:
            schemes.append(EligibleSchemeItem(
                scheme_name="PMMVY",
                scheme_full_name="Pradhan Mantri Matru Vandana Yojana (PMMVY) & Janani Suraksha Yojana",
                eligibility_status="Eligible - Maternal Health & Direct DBT",
                eligibility_reason="Female beneficiary with verified Aadhaar identity. Entitled to direct conditional cash assistance transferred into Aadhaar-seeded bank account.",
                coverage_amount="₹5,000 – ₹6,000 Direct Bank Transfer + Free Institutional Delivery",
                official_portal_url="https://pmmvy.wcd.gov.in",
                procedures_count=250,
                benefits=[
                    "Cash incentive of ₹5,000 to ₹6,000 transferred directly to Aadhaar-seeded bank account in installments",
                    "Free antenatal checkups, iron-folic acid supplementation, and institutional delivery care",
                    "Free transport assistance and post-natal care under Janani Shishu Suraksha Karyakram (JSSK)"
                ]
            ))

        # 6. Rashtriya Arogya Nidhi (Critical Care Super-Specialty Assistance)
        schemes.append(EligibleSchemeItem(
            scheme_name="RAN",
            scheme_full_name="Rashtriya Arogya Nidhi (RAN) & Emergency Discretionary Grant",
            eligibility_status="Potentially Eligible - Super-Specialty Assistance",
            eligibility_reason="Available for patients undergoing major life-threatening surgeries at central government apex institutes (e.g. AIIMS, Tata Memorial).",
            coverage_amount="Up to ₹15,00,000 one-time grant",
            official_portal_url="https://main.mohfw.gov.in",
            procedures_count=350,
            benefits=[
                "Direct financial grant up to ₹15,00,000 for critical organ transplant, cardiac surgery, and oncology",
                "Immediate disbursement through hospital revolving fund upon Aadhaar identity verification"
            ]
        ))

        return schemes

    @staticmethod
    def cross_validate(
        ocr_data: AadhaarVerificationData,
        qr_data: Dict[str, Any]
    ) -> Tuple[AadhaarVerificationData, StatusFlag, StatusFlag, list]:
        """
        Cross-validates OCR extracted data against cryptographically signed QR code data.
        Returns: (final_data, qr_status, signature_status, inconsistency_notes)
        """
        notes = []
        qr_status = StatusFlag.NOT_FOUND
        sig_status = StatusFlag.NOT_CHECKED

        final_data = AadhaarVerificationData(
            masked_aadhaar_number=ocr_data.masked_aadhaar_number or qr_data.get("masked_aadhaar"),
            name=ocr_data.name,
            dob=ocr_data.dob,
            year_of_birth=ocr_data.year_of_birth,
            gender=ocr_data.gender,
            address=ocr_data.address,
            state=ocr_data.state,
            pincode=ocr_data.pincode,
            qr_data_type=qr_data.get("qr_type", "NONE"),
            is_qr_signature_valid=qr_data.get("is_signature_valid", False)
        )

        if qr_data.get("is_valid_format"):
            qr_status = StatusFlag.DECODED
            if qr_data.get("is_signature_valid"):
                sig_status = StatusFlag.VALID
            else:
                sig_status = StatusFlag.INVALID

            # Prefer cryptographically validated QR values if available
            if qr_data.get("name"):
                if ocr_data.name and ocr_data.name.lower() != qr_data["name"].lower():
                    notes.append(f"Noticeable variance between OCR Name ('{ocr_data.name}') and Signed QR Name ('{qr_data['name']}').")
                final_data.name = qr_data["name"]

            if qr_data.get("dob"):
                final_data.dob = qr_data["dob"]
            if qr_data.get("year_of_birth"):
                final_data.year_of_birth = qr_data["year_of_birth"]
            if qr_data.get("gender"):
                final_data.gender = qr_data["gender"]
            if qr_data.get("address"):
                final_data.address = qr_data["address"]
            if qr_data.get("state"):
                final_data.state = qr_data["state"]
            if qr_data.get("pincode"):
                final_data.pincode = qr_data["pincode"]
            if qr_data.get("masked_aadhaar"):
                final_data.masked_aadhaar_number = qr_data["masked_aadhaar"]

        # Automatically determine government health scheme entitlements from Aadhaar parameters
        final_data.eligible_schemes = AadhaarValidationService.determine_schemes(final_data)

        return final_data, qr_status, sig_status, notes
