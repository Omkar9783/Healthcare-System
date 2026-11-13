import hashlib
import cv2
import numpy as np
from typing import Dict, Any

class DuplicateDetector:
    @staticmethod
    def compute_image_hashes(image_np: np.ndarray, raw_bytes: bytes = None) -> Dict[str, str]:
        """
        Computes cryptographic MD5 and perceptual dHash (Difference Hash).
        """
        # MD5
        if raw_bytes:
            md5_hash = hashlib.md5(raw_bytes).hexdigest()
        else:
            md5_hash = hashlib.md5(image_np.tobytes()).hexdigest()

        # Perceptual Difference Hash (dHash): 9x8 grayscale resize
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY) if len(image_np.shape) == 3 else image_np
        resized = cv2.resize(gray, (9, 8), interpolation=cv2.INTER_AREA)
        # Compare adjacent pixels
        diff = resized[:, 1:] > resized[:, :-1]
        # Convert boolean array to hex string
        dhash_val = sum([2 ** i for (i, v) in enumerate(diff.flatten()) if v])
        dhash_hex = f"{dhash_val:016x}"

        return {
            "md5": md5_hash,
            "dhash": dhash_hex
        }

    @staticmethod
    def hamming_distance(hash1: str, hash2: str) -> int:
        """
        Calculates Hamming distance between two hex perceptual hashes.
        Distance <= 5 indicates an identical or nearly identical image.
        """
        try:
            val1 = int(hash1, 16)
            val2 = int(hash2, 16)
            xor_val = val1 ^ val2
            return bin(xor_val).count('1')
        except Exception:
            return 64
