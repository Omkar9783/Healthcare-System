from typing import Dict, Any, List, Tuple
from app.api.schemas import AnomalyReport, StatusFlag
from app.security.image_quality import ImageQualityAnalyzer
from app.security.layout_validation import LayoutValidator
from app.security.duplicate_detection import DuplicateDetector

class DocumentAnomalyDetector:
    @classmethod
    def analyze(cls, image_np, doc_type: str, raw_bytes: bytes = None) -> Tuple[AnomalyReport, StatusFlag]:
        """
        Runs comprehensive security & anomaly scans:
        - Image quality (blur, resolution, boundary)
        - Layout proportions
        - Duplicate hash generation
        Returns: (AnomalyReport, anomaly_status_flag)
        """
        quality = ImageQualityAnalyzer.evaluate(image_np)
        layout = LayoutValidator.validate_layout(image_np, doc_type)
        hashes = DuplicateDetector.compute_image_hashes(image_np, raw_bytes)

        all_anomalies: List[str] = []
        all_anomalies.extend(quality["issues"])
        all_anomalies.extend(layout["notes"])

        has_major_anomaly = quality["is_blurred"] or quality["is_low_resolution"] or not layout["is_valid_layout"]

        if has_major_anomaly:
            status = StatusFlag.ANOMALY_DETECTED
        elif len(all_anomalies) > 0:
            status = StatusFlag.SUSPICIOUS
        else:
            status = StatusFlag.CLEAN

        report = AnomalyReport(
            is_blurred=quality["is_blurred"],
            blur_score=quality["blur_score"],
            is_low_resolution=quality["is_low_resolution"],
            dimensions=quality["dimensions"],
            is_duplicate=False,
            image_hash=hashes["dhash"],
            boundary_detected=quality["boundary_detected"],
            suspicious_editing=False,
            anomalies=all_anomalies
        )

        return report, status
