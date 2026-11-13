import cv2
import numpy as np
from typing import Dict, Any, List
from app.detection.document_detector import DocumentDetector
from app.detection.ration_fields import RationFieldDetector
from app.api.schemas import DocumentType, BoundingBox

class RationDetectionCoordinator:
    def __init__(self, doc_detector: DocumentDetector, field_detector: RationFieldDetector):
        self.doc_detector = doc_detector
        self.field_detector = field_detector

    def process(self, image_np: np.ndarray) -> Dict[str, Any]:
        """
        Runs document classification and Maharashtra Ration card field localization.
        """
        det_result = self.doc_detector.detect_document(image_np)
        side = det_result.get("side", "front")

        # Detect fields
        fields = self.field_detector.detect_fields(image_np, side=side)

        return {
            "document_type": det_result["document_type"],
            "confidence": det_result["confidence"],
            "side": side,
            "bounding_box": det_result.get("bounding_box", [0, 0, image_np.shape[1], image_np.shape[0]]),
            "all_detections": det_result.get("all_detections", []),
            "field_regions": fields
        }
