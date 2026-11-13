import cv2
import numpy as np
from typing import Tuple, Dict, Any

class ImageQualityAnalyzer:
    BLUR_THRESHOLD = 80.0 # Laplacian variance below this is considered blurred
    MIN_WIDTH = 400
    MIN_HEIGHT = 300

    @classmethod
    def evaluate(cls, image_np: np.ndarray) -> Dict[str, Any]:
        """
        Assesses image quality:
        - Blur detection via variance of Laplacian
        - Minimum resolution check
        - Contrast & brightness assessment
        - Boundary detection
        """
        h, w = image_np.shape[:2]
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY) if len(image_np.shape) == 3 else image_np

        # 1. Blur Detection (Laplacian Variance)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = float(laplacian.var())
        is_blurred = variance < cls.BLUR_THRESHOLD

        # 2. Resolution check
        is_low_res = (w < cls.MIN_WIDTH or h < cls.MIN_HEIGHT)

        # 3. Brightness and contrast
        mean_brightness = float(np.mean(gray))
        is_too_dark = mean_brightness < 40
        is_overexposed = mean_brightness > 230

        # 4. Document boundary detection
        # Simple contour check
        blurred_gray = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred_gray, 75, 200)
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        has_clear_boundary = False
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest_contour)
            has_clear_boundary = (area > (w * h * 0.20))

        issues = []
        if is_blurred:
            issues.append(f"Image is blurred (Laplacian score: {variance:.1f} < {cls.BLUR_THRESHOLD}).")
        if is_low_res:
            issues.append(f"Low resolution: {w}x{h} px (recommended at least {cls.MIN_WIDTH}x{cls.MIN_HEIGHT}).")
        if is_too_dark:
            issues.append("Image is severely underexposed.")
        if is_overexposed:
            issues.append("Image has glare/overexposure.")

        return {
            "is_blurred": is_blurred,
            "blur_score": round(variance, 2),
            "is_low_resolution": is_low_res,
            "dimensions": [w, h],
            "boundary_detected": has_clear_boundary,
            "brightness": round(mean_brightness, 1),
            "issues": issues
        }
