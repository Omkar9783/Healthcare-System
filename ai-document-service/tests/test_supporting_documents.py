import io
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ocr.text_extraction import TextExtractionService
from app.api.schemas import DocumentType

client = TestClient(app)

def test_aadhaar_masking():
    # Never expose raw Aadhaar
    raw = "9876 5432 1098"
    masked = TextExtractionService.mask_aadhaar_number(raw)
    assert masked == "XXXX-XXXX-1098"
    assert "9876" not in masked

def test_bank_account_masking():
    raw_acc = "12345678901234"
    masked = TextExtractionService.mask_bank_account_number(raw_acc)
    assert masked == "XXXX-XXXX-1234"
    assert "123456" not in masked

def test_income_certificate_parsing_english():
    sample_text = """
    GOVERNMENT OF MAHARASHTRA
    OFFICE OF THE TAHSILDAR, PUNE
    Certificate No: INC/2026/89421
    Date: 15/01/2026
    INCOME CERTIFICATE
    This is to certify that applicant Rahul Patil, resident of Pune, Maharashtra.
    Annual Income of the family is Rs. 50,000/- (Fifty Thousand Only).
    Financial Year: 2025-2026
    Tahsildar, Revenue Department
    """
    data = TextExtractionService.parse_income_certificate_text(sample_text)
    assert data.annual_income == 50000.0
    assert data.formatted_annual_income == "₹50,000"
    assert "Rahul Patil" in data.applicant_name or "Patil" in data.applicant_name
    assert "Tahsildar" in data.issuing_authority
    assert data.financial_year == "2025-2026"

def test_income_certificate_parsing_marathi():
    sample_text = """
    महाराष्ट्र शासन
    तहसीलदार कार्यालय, हवेली, पुणे
    प्रमाणपत्र क्रमांक: REV/2026/5541
    उत्पन्न प्रमाणपत्र
    अर्जदाराचे नाव: सुरेश तानाजी कदम
    वार्षिक उत्पन्न रुपये 45,000/-
    आर्थिक वर्ष: 2025-2026
    तहसीलदार
    """
    data = TextExtractionService.parse_income_certificate_text(sample_text)
    assert data.annual_income == 45000.0
    assert data.formatted_annual_income == "₹45,000"
    assert "Tahsildar" in data.issuing_authority

def test_caste_certificate_parsing():
    sample_text = """
    GOVERNMENT OF MAHARASHTRA
    Certificate No: MRC/2024/77889
    CASTE CERTIFICATE
    This is to certify that Smt Anita Shinde belongs to Scheduled Caste (SC) category.
    Caste: Mahar
    Sub-Divisional Officer (SDO), Satara
    Date: 12/03/2024
    """
    data = TextExtractionService.parse_caste_certificate_text(sample_text)
    assert data.category == "SC"
    assert data.caste_name == "Mahar"
    assert "Sub-Divisional" in data.issuing_authority

def test_disability_certificate_parsing():
    sample_text = """
    DEPARTMENT OF EMPOWERMENT OF PERSONS WITH DISABILITIES
    UDID: MH1234567890123456
    DISABILITY CERTIFICATE
    Name: Ramesh Varma
    Disability Type: Locomotor Disability
    Disability Percentage: 50%
    Issued by Civil Surgeon, District Hospital, Thane
    """
    data = TextExtractionService.parse_disability_certificate_text(sample_text)
    assert data.udid_number == "MH1234567890123456"
    assert data.disability_percentage == 50
    assert data.disability_type == "Locomotor Disability"
    assert "Civil Surgeon" in data.issuing_hospital_or_board

def test_birth_certificate_parsing():
    sample_text = """
    MUNICIPAL CORPORATION OF GREATER MUMBAI
    Registration No: BMC/B/2025/1234
    BIRTH CERTIFICATE
    Child Name: Aarav Sharma
    Date of Birth: 14/05/2025
    Gender: Male
    Father Name: Rajesh Sharma
    Mother Name: Priya Sharma
    """
    data = TextExtractionService.parse_birth_certificate_text(sample_text)
    assert data.dob == "14/05/2025"
    assert data.gender == "Male"
    assert "Sharma" in data.father_name
    assert "Municipal Corporation" in data.issuing_authority

def test_bank_proof_parsing():
    sample_text = """
    BANK OF MAHARASHTRA
    Shivajinagar Branch, Pune
    Passbook / Account Proof
    Account Holder: Rahul Patil
    Account No: 60123456789
    IFSC: MAHB0000123
    Account Type: Savings
    """
    data = TextExtractionService.parse_bank_proof_text(sample_text)
    assert data.masked_account_number == "XXXX-XXXX-6789"
    assert data.ifsc_code == "MAHB0000123"
    assert data.bank_name == "Bank of Maharashtra"

def test_extract_supporting_endpoint():
    img = np.zeros((500, 800, 3), dtype=np.uint8)
    _, encoded = cv2.imencode(".png", img)
    file_bytes = io.BytesIO(encoded.tobytes())

    response = client.post(
        "/api/document/extract-supporting",
        files={"file": ("income_cert.png", file_bytes, "image/png")},
        data={"doc_type_hint": "income certificate", "user_consent": "true"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user_consent_recorded"] is True
    assert "verification_status" in data

def test_consent_required():
    img = np.zeros((500, 800, 3), dtype=np.uint8)
    _, encoded = cv2.imencode(".png", img)
    file_bytes = io.BytesIO(encoded.tobytes())

    response = client.post(
        "/api/document/verify",
        files={"file": ("cert.png", file_bytes, "image/png")},
        data={"user_consent": "false"}
    )
    assert response.status_code == 400
    assert "consent" in response.json()["detail"].lower()

