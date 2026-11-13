import cv2
import numpy as np
import pytest
from app.detection.document_detector import DocumentDetector
from app.detection.aadhaar_fields import AadhaarFieldDetector
from app.detection.ration_fields import RationFieldDetector
from app.api.schemas import DocumentType

def test_document_detector_blank_image():
    detector = DocumentDetector()
    blank = np.zeros((400, 600, 3), dtype=np.uint8)
    res = detector.detect_document(blank)
    assert "document_type" in res
    assert "confidence" in res
    assert res["confidence"] >= 0.0

def test_aadhaar_field_detector():
    field_det = AadhaarFieldDetector()
    blank = np.zeros((500, 800, 3), dtype=np.uint8)
    boxes = field_det.detect_fields(blank, side="front")
    assert len(boxes) > 0
    class_names = [b.class_name for b in boxes]
    assert "aadhaar_number_region" in class_names
    assert "photo_region" in class_names

def test_ration_field_detector():
    field_det = RationFieldDetector()
    blank = np.zeros((800, 600, 3), dtype=np.uint8)
    boxes = field_det.detect_fields(blank, side="front")
    assert len(boxes) > 0
    class_names = [b.class_name for b in boxes]
    assert "ration_card_number_region" in class_names
    assert "head_of_family_region" in class_names
