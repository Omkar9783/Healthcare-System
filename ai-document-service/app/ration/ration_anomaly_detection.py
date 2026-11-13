import cv2
import numpy as np
from typing import List, Tuple

class RationAnomalyDetector:
    @staticmethod
    def inspect_anomalies(image_np: np.ndarray) -> Tuple[bool, List[str]]:
        """
        Inspects Maharashtra Ration Card image for visual irregularities.
        """
        anomalies = []
        is_suspicious = False

        h, w = image_np.shape[:2]

        # 1. Aspect ratio check (Standard booklet is roughly portrait ~1.3 to 1.5 ratio)
        aspect = float(h) / float(w) if w > 0 else 1.0
        if aspect < 0.5 or aspect > 2.5:
            anomalies.append(f"Non-standard document proportions (aspect ratio {aspect:.2f}).")
            is_suspicious = True

        # 2. Check for severe horizontal or vertical tilt
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY) if len(image_np.shape) == 3 else image_np
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=100, maxLineGap=10)
        
        if lines is not None and len(lines) > 20:
            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                angles.append(abs(angle))
            median_angle = float(np.median(angles))
            if 15 < median_angle < 75:
                anomalies.append(f"Significant image skew detected (~{median_angle:.1f}°). OCR accuracy may be reduced.")

        return is_suspicious, anomalies
