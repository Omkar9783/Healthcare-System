import cv2
import numpy as np
from typing import Dict, Any, List

class LayoutValidator:
    @staticmethod
    def validate_layout(image_np: np.ndarray, doc_type: str) -> Dict[str, Any]:
        """
        Validates whether document dimensions and orientation match expected standards.
        - Aadhaar Card (ID-1 standard): ~85.6mm x 54mm (aspect ratio ~1.58)
        - Ration Card booklet: portrait or foldout (~0.7 to 1.5)
        """
        h, w = image_np.shape[:2]
        aspect = float(w) / float(h) if h > 0 else 1.0

        is_valid = True
        notes = []

        if "aadhaar" in doc_type:
            # Check aspect ratio
            if aspect < 1.1 or aspect > 2.0:
                is_valid = False
                notes.append(f"Aadhaar card aspect ratio ({aspect:.2f}) deviates from standard ID-1 format (~1.58).")
        elif "ration" in doc_type:
            if aspect < 0.4 or aspect > 2.6:
                is_valid = False
                notes.append(f"Ration card aspect ratio ({aspect:.2f}) is atypical.")

        return {
            "is_valid_layout": is_valid,
            "aspect_ratio": round(aspect, 2),
            "notes": notes
        }
