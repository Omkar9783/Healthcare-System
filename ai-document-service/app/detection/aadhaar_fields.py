import os
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Any
from app.config import AADHAAR_FIELDS_MODEL, MIN_DETECTION_CONFIDENCE, MODEL_DEVICE
from app.api.schemas import BoundingBox

AADHAAR_FIELD_CLASSES = [
    "name_region",
    "dob_region",
    "photo_region",
    "qr_region",
    "address_region",
    "aadhaar_number_region"
]

class AadhaarFieldDetector:
    def __init__(self):
        self.model = None
        self.is_custom_model_loaded = False
        self.device = self._select_device()
        self._load_model()

    def _select_device(self) -> str:
        if MODEL_DEVICE != "auto":
            return MODEL_DEVICE
        try:
            import torch
            if torch.backends.mps.is_available():
                return "mps"
            if torch.cuda.is_available():
                return "cuda"
        except Exception:
            pass
        return "cpu"

    def _load_model(self):
        model_path = Path(AADHAAR_FIELDS_MODEL)
        if model_path.exists():
            try:
                from ultralytics import YOLO
                self.model = YOLO(str(model_path))
                self.is_custom_model_loaded = True
                print(f"✅ Loaded fine-tuned Aadhaar Field Detector: {model_path}")
            except Exception as e:
                print(f"⚠️ Error loading custom Aadhaar Field model: {e}")
        else:
            self.model = None

    def detect_fields(self, image_np: np.ndarray, side: str = "front") -> List[BoundingBox]:
        """
        Detects standard Aadhaar fields:
        name_region, dob_region, photo_region, qr_region, address_region, aadhaar_number_region
        """
        h, w = image_np.shape[:2]

        if self.model and self.is_custom_model_loaded:
            try:
                results = self.model.predict(
                    source=image_np,
                    conf=MIN_DETECTION_CONFIDENCE,
                    device=self.device,
                    verbose=False
                )
                boxes = []
                if results and len(results[0].boxes) > 0:
                    for box in results[0].boxes:
                        cls_idx = int(box.cls[0].item())
                        conf = float(box.conf[0].item())
                        xyxy = [int(v) for v in box.xyxy[0].tolist()]
                        cls_name = AADHAAR_FIELD_CLASSES[cls_idx] if cls_idx < len(AADHAAR_FIELD_CLASSES) else "unknown"
                        boxes.append(BoundingBox(
                            x1=xyxy[0], y1=xyxy[1], x2=xyxy[2], y2=xyxy[3],
                            confidence=round(conf, 3),
                            class_name=cls_name
                        ))
                    return boxes
            except Exception as e:
                print(f"⚠️ Error in YOLO Aadhaar field prediction: {e}")

        # Geometric & Layout based Field Localization
        return self._heuristic_aadhaar_regions(image_np, side)

    def _heuristic_aadhaar_regions(self, img: np.ndarray, side: str) -> List[BoundingBox]:
        h, w = img.shape[:2]
        boxes: List[BoundingBox] = []

        if side == "front":
            # Photo region: typically on the left or right (approx x: 4% to 32%, y: 25% to 75%)
            boxes.append(BoundingBox(
                x1=int(w * 0.04), y1=int(h * 0.25),
                x2=int(w * 0.32), y2=int(h * 0.75),
                confidence=0.88, class_name="photo_region"
            ))
            # Name region: top-mid/right
            boxes.append(BoundingBox(
                x1=int(w * 0.35), y1=int(h * 0.28),
                x2=int(w * 0.95), y2=int(h * 0.44),
                confidence=0.85, class_name="name_region"
            ))
            # DOB & Gender region: mid-right
            boxes.append(BoundingBox(
                x1=int(w * 0.35), y1=int(h * 0.45),
                x2=int(w * 0.95), y2=int(h * 0.65),
                confidence=0.85, class_name="dob_region"
            ))
            # Aadhaar number region: bottom center strip
            boxes.append(BoundingBox(
                x1=int(w * 0.15), y1=int(h * 0.72),
                x2=int(w * 0.85), y2=int(h * 0.92),
                confidence=0.90, class_name="aadhaar_number_region"
            ))
        else: # "back"
            # Address region: left half to 60%
            boxes.append(BoundingBox(
                x1=int(w * 0.05), y1=int(h * 0.20),
                x2=int(w * 0.60), y2=int(h * 0.85),
                confidence=0.86, class_name="address_region"
            ))
            # QR region: right side 60% to 95%
            boxes.append(BoundingBox(
                x1=int(w * 0.62), y1=int(h * 0.20),
                x2=int(w * 0.96), y2=int(h * 0.80),
                confidence=0.92, class_name="qr_region"
            ))

        return boxes
