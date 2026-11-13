from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class DocumentType(str, Enum):
    AADHAAR_FRONT = "aadhaar_front"
    AADHAAR_BACK = "aadhaar_back"
    RATION_FRONT = "ration_front"
    RATION_BACK = "ration_back"
    INCOME_CERTIFICATE = "income_certificate"
    CASTE_CERTIFICATE = "caste_certificate"
    DISABILITY_CERTIFICATE = "disability_certificate"
    BIRTH_CERTIFICATE = "birth_certificate"
    BANK_PASSBOOK = "bank_passbook"
    OTHER_DOCUMENT = "other_document"
    UNKNOWN = "unknown"

class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    NOT_VERIFIED = "NOT_VERIFIED"
    PENDING = "PENDING"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    UNSUPPORTED_DOCUMENT = "UNSUPPORTED_DOCUMENT"
    ANOMALY_DETECTED_REQUIRES_REVIEW = "ANOMALY_DETECTED_REQUIRES_REVIEW"

class StatusFlag(str, Enum):
    SUCCESS = "SUCCESS"
    DETECTED = "DETECTED"
    VALID = "VALID"
    DECODED = "DECODED"
    MATCHED = "MATCHED"
    PARTIAL = "PARTIAL"
    PARTIAL_MATCH = "PARTIAL_MATCH"
    MISMATCH = "MISMATCH"
    FAILED = "FAILED"
    INVALID = "INVALID"
    CLEAN = "CLEAN"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    UNSUPPORTED = "UNSUPPORTED"
    NOT_FOUND = "NOT_FOUND"
    NOT_PRESENT = "NOT_PRESENT"
    PENDING = "PENDING"
    PENDING_OFFICIAL_VERIFICATION = "PENDING_OFFICIAL_VERIFICATION"
    NOT_AVAILABLE = "NOT_AVAILABLE"
    ANOMALY_DETECTED = "ANOMALY_DETECTED"
    SUSPICIOUS = "SUSPICIOUS"
    NOT_CHECKED = "NOT_CHECKED"

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float
    class_name: str

class DetectionResponse(BaseModel):
    success: bool
    document_type: DocumentType
    detection_confidence: float
    side: Optional[str] = None
    all_detections: List[BoundingBox] = []
    field_regions: List[BoundingBox] = []
    message: str = ""

class OCRFieldExtraction(BaseModel):
    field_name: str
    text: str
    confidence: float
    box: Optional[List[int]] = None

class OCRResponse(BaseModel):
    success: bool
    document_type: DocumentType
    extracted_text: str
    fields: Dict[str, Any] = {}
    ocr_status: StatusFlag = StatusFlag.NOT_CHECKED
    raw_lines: List[OCRFieldExtraction] = []

class EligibleSchemeItem(BaseModel):
    scheme_name: str # e.g. "MJPJAY", "PM-JAY", "ABHA"
    scheme_full_name: str
    eligibility_status: str # "Eligible", "Potentially Eligible", "Verification Required"
    eligibility_reason: str
    coverage_amount: str = "₹5,00,000 per family per year"
    official_portal_url: str = ""
    procedures_count: int = 1356
    benefits: List[str] = []

class AadhaarVerificationData(BaseModel):
    masked_aadhaar_number: Optional[str] = None # e.g. "XXXX-XXXX-1234"
    name: Optional[str] = None
    dob: Optional[str] = None
    year_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    qr_data_type: Optional[str] = None # "SECURE_QR_V2", "SECURE_QR_V3", "LEGACY_TEXT", "NONE"
    is_qr_signature_valid: bool = False
    is_xml_signature_valid: bool = False
    eligible_schemes: List[EligibleSchemeItem] = []

class RationCardVerificationData(BaseModel):
    masked_ration_card_number: Optional[str] = None
    card_type: Optional[str] = None # Yellow, Orange, White, Antyodaya (AAY)
    head_of_family: Optional[str] = None
    state: Optional[str] = "Maharashtra"
    district: Optional[str] = None
    fair_price_shop_no: Optional[str] = None
    family_members_count: int = 0
    family_members: List[str] = []
    address: Optional[str] = None
    eligible_schemes: List[EligibleSchemeItem] = []

class IncomeCertificateData(BaseModel):
    certificate_number: Optional[str] = None
    applicant_name: Optional[str] = None
    annual_income: Optional[float] = None
    formatted_annual_income: Optional[str] = None
    issuing_authority: Optional[str] = None # e.g. Tahsildar / Sub-Divisional Officer
    issue_date: Optional[str] = None
    validity_period: Optional[str] = None
    financial_year: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Maharashtra"

class CasteCertificateData(BaseModel):
    certificate_number: Optional[str] = None
    applicant_name: Optional[str] = None
    caste_name: Optional[str] = None
    category: Optional[str] = None # SC, ST, VJNT, OBC, SBC, General
    issuing_authority: Optional[str] = None
    issue_date: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Maharashtra"

class DisabilityCertificateData(BaseModel):
    certificate_number: Optional[str] = None
    udid_number: Optional[str] = None
    applicant_name: Optional[str] = None
    disability_type: Optional[str] = None # Locomotor, Visual, Hearing, Intellectual, etc.
    disability_percentage: Optional[int] = None
    is_permanent: bool = True
    issuing_hospital_or_board: Optional[str] = None
    issue_date: Optional[str] = None

class BirthCertificateData(BaseModel):
    registration_number: Optional[str] = None
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    place_of_birth: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    registration_date: Optional[str] = None
    issuing_authority: Optional[str] = None

class BankProofData(BaseModel):
    account_holder_name: Optional[str] = None
    masked_account_number: Optional[str] = None # e.g. "XXXX-XXXX-1234"
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    branch_name: Optional[str] = None
    account_type: Optional[str] = "Savings"

class SupportingDocumentVerifyData(BaseModel):
    doc_type: DocumentType
    income_data: Optional[IncomeCertificateData] = None
    caste_data: Optional[CasteCertificateData] = None
    disability_data: Optional[DisabilityCertificateData] = None
    birth_data: Optional[BirthCertificateData] = None
    bank_data: Optional[BankProofData] = None
    ration_data: Optional[RationCardVerificationData] = None
    aadhaar_data: Optional[AadhaarVerificationData] = None

class PatientMatchDetails(BaseModel):
    name_match_score: float = 0.0
    dob_matched: bool = False
    gender_matched: bool = False
    address_match_score: float = 0.0
    overall_match_score: float = 0.0
    matched_patient_uid: Optional[str] = None
    notes: List[str] = []

class AnomalyReport(BaseModel):
    is_blurred: bool = False
    blur_score: float = 0.0
    is_low_resolution: bool = False
    dimensions: List[int] = [0, 0]
    is_duplicate: bool = False
    image_hash: str = ""
    boundary_detected: bool = True
    suspicious_editing: bool = False
    anomalies: List[str] = []

class DocumentVerifyResponse(BaseModel):
    success: bool
    verification_id: str
    document_type: DocumentType
    side: Optional[str] = None
    detection_confidence: float

    # Independent Verification Flags (Requirement 11)
    document_detection_status: StatusFlag
    ocr_status: StatusFlag
    qr_status: StatusFlag
    signature_status: StatusFlag
    official_verification_status: StatusFlag
    data_match_status: StatusFlag
    anomaly_status: StatusFlag

    # Central Decision Engine Status
    verification_status: VerificationStatus

    # Extracted Details
    aadhaar_data: Optional[AadhaarVerificationData] = None
    ration_data: Optional[RationCardVerificationData] = None
    supporting_document_data: Optional[SupportingDocumentVerifyData] = None
    patient_match: Optional[PatientMatchDetails] = None
    anomaly_report: Optional[AnomalyReport] = None

    user_consent_recorded: bool = True
    decision_reasons: List[str] = []
    timestamp: str
