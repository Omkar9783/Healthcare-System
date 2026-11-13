import re
from typing import Dict, Any, List, Tuple
from app.api.schemas import RationCardVerificationData, StatusFlag

class RationValidationService:
    @staticmethod
    def validate_ration_card(data: RationCardVerificationData) -> Tuple[bool, List[str]]:
        """
        Validates Maharashtra Ration Card against state guidelines & schema.
        Returns: (is_valid, validation_messages)
        """
        messages = []
        is_valid = True

        # Check card number
        if not data.masked_ration_card_number:
            messages.append("Ration card number could not be extracted.")
            is_valid = False
        else:
            messages.append(f"Detected Ration Card ID: {data.masked_ration_card_number}")

        # Check category
        valid_types = ['Yellow', 'Orange', 'White', 'Antyodaya (AAY)', 'Annapurna']
        if data.card_type not in valid_types:
            messages.append(f"Unusual ration category '{data.card_type}'. Requires administrative verification.")
        else:
            messages.append(f"Recognized Maharashtra PDS Category: {data.card_type}")

        # Head of family check
        if not data.head_of_family:
            messages.append("Head of family name could not be identified automatically.")
            is_valid = False
        else:
            messages.append(f"Identified Head of Family: {data.head_of_family}")

        # Automatically determine government health scheme entitlements
        data.eligible_schemes = RationValidationService.determine_schemes(data)
        for s in data.eligible_schemes:
            messages.append(f"Scheme Identified: {s.scheme_name} ({s.eligibility_status}) - {s.coverage_amount}")

        return is_valid, messages

    @staticmethod
    def determine_schemes(data: RationCardVerificationData) -> List[Any]:
        from app.api.schemas import EligibleSchemeItem
        card_type = data.card_type or "Orange"
        state = data.state or "Maharashtra"
        schemes = []

        # 1. MJPJAY Scheme
        if card_type in ['Yellow', 'Antyodaya (AAY)', 'Annapurna']:
            mjpjay_status = "Eligible - Priority BPL"
            mjpjay_reason = f"Verified under Maharashtra Priority Household (PHH/BPL / AAY). Covers up to ₹5,00,000 per family/year."
            pmjay_status = "Eligible - Priority Household"
            pmjay_reason = "Antyodaya & BPL yellow cardholders automatically map to SECC 2011 priority beneficiary database."
        elif card_type == 'Orange':
            mjpjay_status = "Eligible - MJPJAY 2.0"
            mjpjay_reason = "Orange ration card holders with annual income up to ₹1,00,000 receive full cashless coverage under MJPJAY 2.0 across 1,356 procedures."
            pmjay_status = "Verification Required"
            pmjay_reason = "Orange cardholders must confirm deprivation criteria or Golden Card ID on PM-JAY NHA portal."
        elif card_type == 'White':
            mjpjay_status = "Conditional / Verification Required"
            mjpjay_reason = "White card holders require designated taluka distress certification or acute emergency procedure clearance."
            pmjay_status = "Verification Required"
            pmjay_reason = "Non-priority white card households require special exception evaluation."
        else:
            mjpjay_status = "Potentially Eligible"
            mjpjay_reason = f"Resident with valid {state} ration card preliminary satisfies scheme criteria."
            pmjay_status = "Verification Required"
            pmjay_reason = "Requires Ayushman Mitra desk verification at empanelled hospital."

        schemes.append(EligibleSchemeItem(
            scheme_name="MJPJAY",
            scheme_full_name="Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY 2.0)",
            eligibility_status=mjpjay_status,
            eligibility_reason=mjpjay_reason,
            coverage_amount="₹5,00,000 per family per year",
            official_portal_url="https://www.jeevandayee.gov.in",
            procedures_count=1356,
            benefits=[
                "100% cashless treatment across 1,356 secondary & tertiary procedures",
                "Includes ₹5,00,000 annual family floater benefit",
                "Covers pre-existing medical conditions from Day 1",
                "Free diagnostic lab tests and 10 days post-discharge medications"
            ]
        ))

        schemes.append(EligibleSchemeItem(
            scheme_name="PM-JAY",
            scheme_full_name="Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
            eligibility_status=pmjay_status,
            eligibility_reason=pmjay_reason,
            coverage_amount="₹5,00,000 per family per year",
            official_portal_url="https://beneficiary.nha.gov.in",
            procedures_count=1949,
            benefits=[
                "All-India portability: Valid across 28,000+ empanelled hospitals nationwide",
                "1,949 high-end surgical and critical care treatment packages",
                "Zero out-of-pocket expenses for surgery, ICU, and medicines"
            ]
        ))

        return schemes
