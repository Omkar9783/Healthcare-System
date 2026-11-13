import pytest
from app.api.schemas import RationCardVerificationData
from app.ration.ration_validation import RationValidationService
from app.ration.ration_verification import RationOfficialVerificationService
from app.ocr.text_extraction import TextExtractionService

def test_ration_card_masking():
    raw_num = "271234567890"
    masked = TextExtractionService.mask_ration_number(raw_num)
    assert masked == "RC-XXXX-XXXX-7890"

def test_ration_card_validation():
    data = RationCardVerificationData(
        masked_ration_card_number="RC-XXXX-XXXX-1234",
        card_type="Yellow",
        head_of_family="Ramesh Patil",
        state="Maharashtra",
        district="Mumbai",
        family_members_count=4
    )
    is_valid, messages = RationValidationService.validate_ration_card(data)
    assert is_valid is True
    assert any("Yellow" in m for m in messages)

def test_ration_official_verification_pending():
    rcms = RationOfficialVerificationService()
    data = RationCardVerificationData(masked_ration_card_number="RC-XXXX-XXXX-1234")
    flag, note = rcms.verify_with_portal(data)
    assert flag.value == "PENDING_OFFICIAL_VERIFICATION"
    assert "PENDING_OFFICIAL_VERIFICATION" in note

def test_ration_health_schemes_determination():
    # Test Yellow (BPL / Antyodaya) Priority card
    yellow_data = RationCardVerificationData(
        masked_ration_card_number="RC-XXXX-XXXX-1234",
        card_type="Yellow",
        head_of_family="Sunita Patil"
    )
    is_valid, messages = RationValidationService.validate_ration_card(yellow_data)
    assert is_valid is True
    assert len(yellow_data.eligible_schemes) >= 2
    
    mjpjay = next(s for s in yellow_data.eligible_schemes if s.scheme_name == "MJPJAY")
    assert "Priority BPL" in mjpjay.eligibility_status
    assert "₹5,00,000" in mjpjay.coverage_amount
    assert mjpjay.procedures_count == 1356

    # Test Orange (APL income <= 1L) card
    orange_data = RationCardVerificationData(
        masked_ration_card_number="RC-XXXX-XXXX-5678",
        card_type="Orange",
        head_of_family="Ramesh Deshmukh"
    )
    schemes = RationValidationService.determine_schemes(orange_data)
    mjpjay_orange = next(s for s in schemes if s.scheme_name == "MJPJAY")
    assert "MJPJAY 2.0" in mjpjay_orange.eligibility_status
    assert "1,356" in mjpjay_orange.eligibility_reason

