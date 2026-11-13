#!/usr/bin/env python3
import sys
import json
import argparse
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import cv2
from app.detection.document_detector import DocumentDetector
from app.detection.aadhaar_fields import AadhaarFieldDetector
from app.detection.ration_fields import RationFieldDetector
from app.ocr.ocr_engine import OCREngine
from app.ocr.text_extraction import TextExtractionService

def main():
    parser = argparse.ArgumentParser(description="Run Document Inference and OCR CLI")
    parser.add_argument("--image", type=str, required=True, help="Path to input document image")
    parser.add_argument("--save-annotated", type=str, default="", help="Path to save annotated output image")
    args = parser.parse_args()

    image_path = Path(args.image)
    if not image_path.exists():
        print(f"❌ Image not found: {image_path}")
        sys.exit(1)

    img = cv2.imread(str(image_path))
    if img is None:
        print(f"❌ Failed to decode image: {image_path}")
        sys.exit(1)

    print(f"🔍 Inspecting: {image_path.name} ({img.shape[1]}x{img.shape[0]} px)...")
    doc_det = DocumentDetector()
    aadhaar_fd = AadhaarFieldDetector()
    ration_fd = RationFieldDetector()
    ocr = OCREngine()

    det = doc_det.detect_document(img)
    print(f"📄 Classification: {det['document_type'].value} (Confidence: {det['confidence']:.2f}, Side: {det['side']})")

    # Fields
    if "aadhaar" in det["document_type"].value:
        fields = aadhaar_fd.detect_fields(img, side=det["side"])
    elif "ration" in det["document_type"].value:
        fields = ration_fd.detect_fields(img, side=det["side"])
    else:
        fields = []

    print(f"📍 Detected Field Regions: {len(fields)}")
    for f in fields:
        print(f"   - {f.class_name}: [{f.x1}, {f.y1}, {f.x2}, {f.y2}] (Conf: {f.confidence})")

    # OCR
    text, lines, status = ocr.extract_text(img)
    print(f"🔤 OCR Status: {status.value}")
    if "aadhaar" in det["document_type"].value:
        parsed = TextExtractionService.parse_aadhaar_text(text)
        print("📋 Extracted Aadhaar Profile:")
        print(json.dumps(parsed.model_dump(exclude_none=True), indent=2))
    elif "ration" in det["document_type"].value:
        parsed = TextExtractionService.parse_ration_text(text)
        print("📋 Extracted Ration Card Profile:")
        print(json.dumps(parsed.model_dump(exclude_none=True), indent=2))

    if args.save_annotated:
        annotated = img.copy()
        for f in fields:
            cv2.rectangle(annotated, (f.x1, f.y1), (f.x2, f.y2), (0, 255, 0), 2)
            cv2.putText(annotated, f.class_name, (f.x1, max(20, f.y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        cv2.imwrite(args.save_annotated, annotated)
        print(f"🖼️ Saved annotated detection to: {args.save_annotated}")

if __name__ == "__main__":
    main()
