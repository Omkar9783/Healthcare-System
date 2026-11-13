import os
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Any
from app.config import RATION_FIELDS_MODEL, MIN_DETECTION_CONFIDENCE, MODEL_DEVICE
from app.api.schemas import BoundingBox

RATION_FIELD_CLASSES = [
    "head_of_family_region",
    "ration_card_number_region",
    "address_region",
    "family_details_region",
    "photograph_region",
    "fair_price_shop_region"
]

class RationFieldDetector:
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
        model_path = Path(RATION_FIELDS_MODEL)
        if model_path.exists():
            try:
                from ultralytics import YOLO
                self.model = YOLO(str(model_path))
                self.is_custom_model_loaded = True
                print(f"✅ Loaded fine-tuned Ration Field Detector: {model_path}")
            except Exception as e:
                print(f"⚠️ Error loading custom Ration Field model: {e}")
        else:
            self.model = None

    def detect_fields(self, image_np: np.ndarray, side: str = "front") -> List[BoundingBox]:
        """
        Detects standard Maharashtra Ration Card fields:
        head_of_family_region, ration_card_number_region, address_region,
        family_details_region, photograph_region, fair_price_shop_region
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
                        cls_name = RATION_FIELD_CLASSES[cls_idx] if cls_idx < len(RATION_FIELD_CLASSES) else "unknown"
                        boxes.append(BoundingBox(
                            x1=xyxy[0], y1=xyxy[1], x2=xyxy[2], y2=xyxy[3],
                            confidence=round(conf, 3),
                            class_name=cls_name
                        ))
                    return boxes
            except Exception as e:
                print(f"⚠️ Error in YOLO Ration field prediction: {e}")

        # Geometric & Layout based Field Localization for Maharashtra RCMS Card
        return self._heuristic_ration_regions(image_np, side)

    def _heuristic_ration_regions(self, img: np.ndarray, side: str) -> List[BoundingBox]:
        h, w = img.shape[:2]
        boxes: List[BoundingBox] = []

        if side == "front":
            # Ration Card Number (SRC Number at top)
            boxes.append(BoundingBox(
                x1=int(w * 0.10), y1=int(h * 0.08),
                x2=int(w * 0.90), y2=int(h * 0.18),
                confidence=0.88, class_name="ration_card_number_region"
            ))
            # Head of Family region
            boxes.append(BoundingBox(
                x1=int(w * 0.08), y1=int(h * 0.20),
                x2=int(w * 0.65), y2=int(h * 0.32),
                confidence=0.85, class_name="head_of_family_region"
            ))
            # Photograph region
            boxes.append(BoundingBox(
                x1=int(w * 0.68), y1=int(h * 0.20),
                x2=int(w * 0.94), y2=int(h * 0.45),
                confidence=0.84, class_name="photograph_region"
            ))
            # Address region
            boxes.append(BoundingBox(
                x1=int(w * 0.08), y1=int(h * 0.34),
                x2=int(w * 0.65), y2=int(h * 0.50),
                confidence=0.82, class_name="address_region"
            ))
            # Fair Price Shop (FPS) region
            boxes.append(BoundingBox(
                x1=int(w * 0.08), y1=int(h * 0.52),
                x2=int(w * 0.92), y2=int(h * 0.64),
                confidence=0.80, class_name="fair_price_shop_region"
            ))
            # Family Details Table (bottom section)
            boxes.append(BoundingBox(
                x1=int(w * 0.05), y1=int(h * 0.65),
                x2=int(w * 0.95), y2=int(h * 0.95),
                confidence=0.85, class_name="family_details_region"
            ))
        else: # "back"
            # Family Details / Monthly Quota / Remarks
            boxes.append(BoundingBox(
                x1=int(w * 0.05), y1=int(h * 0.10),
                x2=int(w * 0.95), y2=int(h * 0.70),
                confidence=0.85, class_name="family_details_region"
            ))
            # FPS Seal & Signature
            boxes.append(BoundingBox(
                x1=int(w * 0.50), y1=int(h * 0.72),
                x2=int(w * 0.95), y2=int(h * 0.95),
                confidence=0.80, class_name="fair_price_shop_region"
            ))

        return boxes
