import pytest
from app.aadhaar.secure_qr_verification import SecureQRVerificationService
from app.ocr.text_extraction import TextExtractionService
from app.aadhaar.offline_ekyc import OfflineEKYCVerifier

def test_aadhaar_masking():
    raw_num = "987654321098"
    masked = TextExtractionService.mask_aadhaar_number(raw_num)
    assert masked == "XXXX-XXXX-1098"
    assert "98765432" not in masked

def test_legacy_xml_qr_decoding():
    sample_qr = '<PrintLetterBarcodeData uid="234567890123" name="Ramesh Patil" gender="M" yob="1985" co="S/O Suresh" dist="Mumbai" state="Maharashtra" pc="400001"/>'
    res = SecureQRVerificationService.parse_and_verify(sample_qr)
    assert res["is_valid_format"] is True
    assert res["qr_type"] == "LEGACY_TEXT_XML"
    assert res["name"] == "Ramesh Patil"
    assert res["gender"] == "Male"
    assert res["masked_aadhaar"] == "XXXX-XXXX-0123"
    assert res["state"] == "Maharashtra"
    assert res["pincode"] == "400001"

def test_offline_ekyc_verifier():
    sample_xml = """<?xml version="1.0" encoding="UTF-8"?>
    <KycRes>
      <UidData>
        <Poi name="Sita Sharma" dob="12-04-1994" gender="F"/>
        <Poa dist="Pune" state="Maharashtra" pc="411001"/>
      </UidData>
    </KycRes>"""
    res = OfflineEKYCVerifier.verify_xml(sample_xml)
    assert res["success"] is True
    assert res["name"] == "Sita Sharma"
    assert res["gender"] == "Female"
    assert res["district"] == "Pune"

def test_aadhaar_scheme_determination_senior_citizen():
    from app.aadhaar.aadhaar_validation import AadhaarValidationService
    from app.api.schemas import AadhaarVerificationData

    # Beneficiary age 72, Male, resident of Maharashtra
    data = AadhaarVerificationData(
        masked_aadhaar_number="XXXX-XXXX-8921",
        name="Haribhau Kadam",
        dob="15/08/1952",
        gender="Male",
        state="Maharashtra",
        address="12, Shivaji Nagar, Pune, Maharashtra"
    )
    schemes = AadhaarValidationService.determine_schemes(data)
    scheme_names = [s.scheme_name for s in schemes]

    assert "PM-JAY" in scheme_names
    assert "ABHA" in scheme_names
    assert "MJPJAY" in scheme_names
    assert "PM-JAY Vayoshri" in scheme_names  # 70+ Senior Citizen cover
    assert "RAN" in scheme_names

def test_aadhaar_scheme_determination_female_beneficiary():
    from app.aadhaar.aadhaar_validation import AadhaarValidationService
    from app.api.schemas import AadhaarVerificationData

    # Beneficiary age 28, Female, resident of Mumbai
    data = AadhaarVerificationData(
        masked_aadhaar_number="XXXX-XXXX-4512",
        name="Pooja Deshmukh",
        dob="05/03/1998",
        gender="Female",
        state="Maharashtra",
        address="Bandra East, Mumbai, Maharashtra"
    )
    schemes = AadhaarValidationService.determine_schemes(data)
    scheme_names = [s.scheme_name for s in schemes]

    assert "PM-JAY" in scheme_names
    assert "ABHA" in scheme_names
    assert "MJPJAY" in scheme_names
    assert "PMMVY" in scheme_names  # Maternal cash assistance & free delivery
    assert "PM-JAY Vayoshri" not in scheme_names

