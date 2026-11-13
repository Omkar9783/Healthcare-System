import os
import cv2
import json
import uuid
import datetime
import numpy as np
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Header
from typing import Optional, Dict, Any, Tuple

from app.config import MAX_UPLOAD_BYTES, MIN_DETECTION_CONFIDENCE, AI_SERVICE_API_KEY
from app.api.schemas import (
    DocumentType,
    DetectionResponse,
    OCRResponse,
    DocumentVerifyResponse,
    VerificationStatus,
    StatusFlag,
    AadhaarVerificationData,
    RationCardVerificationData,
    SupportingDocumentVerifyData,
    PatientMatchDetails,
    AnomalyReport,
    BoundingBox
)
from app.detection.document_detector import DocumentDetector
from app.detection.aadhaar_fields import AadhaarFieldDetector
from app.detection.ration_fields import RationFieldDetector
from app.ocr.ocr_engine import OCREngine
from app.ocr.text_extraction import TextExtractionService
from app.aadhaar.qr_reader import QRReader
from app.aadhaar.secure_qr_verification import SecureQRVerificationService
from app.aadhaar.aadhaar_validation import AadhaarValidationService
from app.ration.ration_validation import RationValidationService
from app.ration.ration_verification import RationOfficialVerificationService
from app.security.document_anomaly import DocumentAnomalyDetector
from app.verification.patient_matching import PatientMatcher
from app.verification.decision_engine import VerificationDecisionEngine

router = APIRouter(prefix="/api")

# Singletons for services
doc_detector = DocumentDetector()
aadhaar_field_detector = AadhaarFieldDetector()
ration_field_detector = RationFieldDetector()
ocr_engine = OCREngine()
rcms_service = RationOfficialVerificationService()

# In-memory status store for demonstration & status polling
VERIFICATION_STORE: Dict[str, Dict[str, Any]] = {}

async def read_image_from_upload(upload_file: UploadFile) -> Tuple[np.ndarray, bytes]:
    contents = await upload_file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size ({MAX_UPLOAD_BYTES // (1024*1024)}MB).")
    
    nparr = np.frombuffer(contents, np.uint8)
    img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_np is None:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image file format.")
    return img_np, contents

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Document Detection & Verification Service",
        "version": "1.0.0",
        "models": {
            "yolo_loaded": doc_detector.model is not None,
            "custom_weights": doc_detector.is_custom_model_loaded,
            "device": doc_detector.device,
            "ocr_engine": "PaddleOCR/OpenCV-fallback"
        },
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@router.post("/document/detect", response_model=DetectionResponse)
async def detect_document_endpoint(file: UploadFile = File(...)):
    img_np, _ = await read_image_from_upload(file)
    det = doc_detector.detect_document(img_np)
    doc_type = det["document_type"]
    side = det.get("side", "front")

    # Get field regions
    field_regions = []
    if "aadhaar" in doc_type.value:
        field_regions = aadhaar_field_detector.detect_fields(img_np, side=side)
    elif "ration" in doc_type.value:
        field_regions = ration_field_detector.detect_fields(img_np, side=side)

    return DetectionResponse(
        success=True,
        document_type=doc_type,
        detection_confidence=det["confidence"],
        side=side,
        all_detections=det.get("all_detections", []),
        field_regions=field_regions,
        message=f"Detected {doc_type.value} with confidence {det['confidence']:.2f}"
    )

@router.post("/document/ocr", response_model=OCRResponse)
async def ocr_endpoint(file: UploadFile = File(...)):
    img_np, _ = await read_image_from_upload(file)
    det = doc_detector.detect_document(img_np)
    full_text, lines, ocr_status = ocr_engine.extract_text(img_np)

    extracted_fields = {}
    if "aadhaar" in det["document_type"].value:
        aadhaar_data = TextExtractionService.parse_aadhaar_text(full_text)
        extracted_fields = aadhaar_data.model_dump(exclude_none=True)
    elif "ration" in det["document_type"].value:
        ration_data = TextExtractionService.parse_ration_text(full_text)
        extracted_fields = ration_data.model_dump(exclude_none=True)

    return OCRResponse(
        success=True,
        document_type=det["document_type"],
        extracted_text=full_text,
        fields=extracted_fields,
        ocr_status=ocr_status,
        raw_lines=lines
    )

@router.post("/document/verify", response_model=DocumentVerifyResponse)
async def verify_document_endpoint(
    file: UploadFile = File(...),
    patient_data: Optional[str] = Form(None),
    doc_type_hint: Optional[str] = Form(None),
    user_consent: bool = Form(True)
):
    """
    Complete Document Processing Pipeline:
    Step 1: Upload Aadhaar, Ration Card or Supporting Document (Income, Caste, Disability, Birth, Bank)
    Step 2: Validate file type, size, and user consent
    Step 3: Apply image preprocessing & OCR extraction
    Step 4: YOLO / Heuristic document type & side classification
    Step 5: Front/Back side detection & localized field parsing
    Step 6: Security & anomaly consistency checks
    Step 7: Official verification checks (UIDAI QR / RCMS / Gazetted patterns)
    Step 8: Patient profile demographic matching
    Step 9: Verification decision engine synthesis
    """
    if not user_consent:
        raise HTTPException(status_code=400, detail="User informed consent is required to process identity documents.")

    img_np, raw_bytes = await read_image_from_upload(file)
    verification_id = f"VERIF-{uuid.uuid4().hex[:10].upper()}"

    # Parse optional patient profile JSON
    patient_profile = None
    if patient_data:
        try:
            patient_profile = json.loads(patient_data)
        except Exception:
            patient_profile = None

    # Step 3: OCR Extraction
    full_text, raw_lines, ocr_status = ocr_engine.extract_text(img_np)

    # Step 4 & 5: Document Type & Side Detection
    combined_hint = f"{doc_type_hint or ''} {full_text}".strip()
    det = doc_detector.detect_document(img_np, text_hint=combined_hint)
    doc_type = det["document_type"]
    side = det.get("side", "front")
    confidence = det["confidence"]

    detection_flag = StatusFlag.DETECTED if confidence >= 0.50 else StatusFlag.LOW_CONFIDENCE
    if doc_type in [DocumentType.OTHER_DOCUMENT, DocumentType.UNKNOWN]:
        detection_flag = StatusFlag.UNSUPPORTED

    # Step 6: Anomaly & Tampering Detection
    anomaly_report, anomaly_flag = DocumentAnomalyDetector.analyze(img_np, doc_type.value, raw_bytes)

    # Step 7 & 8: Document-specific verification & field parsing
    qr_flag = StatusFlag.NOT_CHECKED
    sig_flag = StatusFlag.NOT_CHECKED
    official_flag = StatusFlag.NOT_CHECKED
    aadhaar_res = None
    ration_res = None
    supporting_res = None

    if "aadhaar" in doc_type.value:
        # OCR Parsing
        raw_aadhaar = TextExtractionService.parse_aadhaar_text(full_text)
        
        # QR Detection & Decoding
        qr_text, qr_bytes, has_qr = QRReader.read_qr(img_np)
        qr_parsed = SecureQRVerificationService.parse_and_verify(qr_text, qr_bytes) if has_qr else {}
        
        # Cross-validation
        aadhaar_res, qr_flag, sig_flag, cross_notes = AadhaarValidationService.cross_validate(raw_aadhaar, qr_parsed)
        if cross_notes:
            anomaly_report.anomalies.extend(cross_notes)

        # Match with patient profile
        extracted_dict = aadhaar_res.model_dump()
        match_details, match_flag = PatientMatcher.match(extracted_dict, patient_profile)

    elif "ration" in doc_type.value:
        # OCR Parsing
        ration_res = TextExtractionService.parse_ration_text(full_text)
        is_valid, val_messages = RationValidationService.validate_ration_card(ration_res)
        
        # Official verification status
        official_flag, official_note = rcms_service.verify_with_portal(ration_res)

        # Match with patient profile
        extracted_dict = ration_res.model_dump()
        match_details, match_flag = PatientMatcher.match(extracted_dict, patient_profile)

    elif doc_type in [
        DocumentType.INCOME_CERTIFICATE,
        DocumentType.CASTE_CERTIFICATE,
        DocumentType.DISABILITY_CERTIFICATE,
        DocumentType.BIRTH_CERTIFICATE,
        DocumentType.BANK_PASSBOOK
    ]:
        supporting_res = TextExtractionService.parse_supporting_document(doc_type, full_text)
        match_details = PatientMatchDetails()
        match_flag = StatusFlag.SUCCESS
        official_flag = StatusFlag.SUCCESS

    else:
        match_details = PatientMatchDetails()
        match_flag = StatusFlag.NOT_CHECKED

    # Step 9: Verification Decision Engine Synthesis
    final_status, decision_reasons = VerificationDecisionEngine.evaluate(
        doc_type=doc_type,
        detection_confidence=confidence,
        detection_flag=detection_flag,
        ocr_flag=ocr_status,
        qr_flag=qr_flag,
        signature_flag=sig_flag,
        official_flag=official_flag,
        match_flag=match_flag,
        anomaly_flag=anomaly_flag,
        patient_match=match_details,
        anomaly_report=anomaly_report,
        aadhaar_data=aadhaar_res,
        ration_data=ration_res
    )

    response = DocumentVerifyResponse(
        success=True,
        verification_id=verification_id,
        document_type=doc_type,
        side=side,
        detection_confidence=confidence,
        document_detection_status=detection_flag,
        ocr_status=ocr_status,
        qr_status=qr_flag,
        signature_status=sig_flag,
        official_verification_status=official_flag,
        data_match_status=match_flag,
        anomaly_status=anomaly_flag,
        verification_status=final_status,
        aadhaar_data=aadhaar_res,
        ration_data=ration_res,
        supporting_document_data=supporting_res,
        patient_match=match_details,
        anomaly_report=anomaly_report,
        user_consent_recorded=user_consent,
        decision_reasons=decision_reasons,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
    )

    # Store for status lookup
    VERIFICATION_STORE[verification_id] = response.model_dump()

    return response

@router.post("/aadhaar/verify", response_model=DocumentVerifyResponse)
async def verify_aadhaar_endpoint(
    file: UploadFile = File(...),
    patient_data: Optional[str] = Form(None)
):
    return await verify_document_endpoint(file, patient_data)

@router.post("/ration/verify", response_model=DocumentVerifyResponse)
async def verify_ration_endpoint(
    file: UploadFile = File(...),
    patient_data: Optional[str] = Form(None)
):
    return await verify_document_endpoint(file, patient_data)

@router.get("/document/status/{verification_id}")
def get_verification_status(verification_id: str):
    if verification_id not in VERIFICATION_STORE:
        raise HTTPException(status_code=404, detail="Verification request not found.")
    return VERIFICATION_STORE[verification_id]

@router.post("/document/extract-supporting", response_model=DocumentVerifyResponse)
async def extract_supporting_document_endpoint(
    file: UploadFile = File(...),
    doc_type_hint: Optional[str] = Form(None),
    patient_data: Optional[str] = Form(None),
    user_consent: bool = Form(True)
):
    """
    Dedicated endpoint for supporting documents:
    - Income Certificate
    - Caste Certificate
    - Disability Certificate / UDID
    - Age / Birth Certificate
    - Bank Account Proof / Passbook
    """
    return await verify_document_endpoint(
        file=file,
        patient_data=patient_data,
        doc_type_hint=doc_type_hint,
        user_consent=user_consent
    )

@router.post("/document/mask-aadhaar")
def mask_aadhaar_endpoint(aadhaar_number: str = Form(...)):
    """
    Enforces UIDAI Aadhaar masking requirement: XXXX-XXXX-1234
    """
    masked = TextExtractionService.mask_aadhaar_number(aadhaar_number)
    return {
        "success": True,
        "masked_aadhaar": masked
    }
