import cv2
import numpy as np
from typing import Optional, Tuple, Any

class QRReader:
    @staticmethod
    def read_qr(image_np: np.ndarray, crop_region: Optional[list] = None) -> Tuple[Optional[str], Optional[bytes], bool]:
        """
        Extracts QR code content from the whole image or a cropped QR region.
        Returns: (decoded_text, raw_bytes, success_flag)
        """
        if image_np is None or image_np.size == 0:
            return None, None, False

        # If crop_region is provided [x1, y1, x2, y2], try local crop first
        search_targets = []
        if crop_region and len(crop_region) == 4:
            x1, y1, x2, y2 = [int(v) for v in crop_region]
            h, w = image_np.shape[:2]
            # Add padding
            px1, py1 = max(0, x1 - 10), max(0, y1 - 10)
            px2, py2 = min(w, x2 + 10), min(h, y2 + 10)
            if px2 > px1 and py2 > py1:
                search_targets.append(image_np[py1:py2, px1:px2])

        search_targets.append(image_np)

        detector = cv2.QRCodeDetector()

        for target in search_targets:
            gray = cv2.cvtColor(target, cv2.COLOR_BGR2GRAY) if len(target.shape) == 3 else target

            # 1. Standard OpenCV QR detector
            decoded_text, points, straight_qrcode = detector.detectAndDecode(gray)
            if decoded_text:
                return decoded_text, decoded_text.encode('utf-8'), True

            # 2. Try with PyZbar if installed
            try:
                from pyzbar.pyzbar import decode
                decoded_objects = decode(gray)
                if decoded_objects:
                    obj = decoded_objects[0]
                    return obj.data.decode('utf-8', errors='ignore'), obj.data, True
            except Exception:
                pass

            # 3. Try with thresholding and contrast enhancement
            enhanced = cv2.equalizeHist(gray)
            decoded_text, points, _ = detector.detectAndDecode(enhanced)
            if decoded_text:
                return decoded_text, decoded_text.encode('utf-8'), True

        return None, None, False
