from typing import Dict, Any, List, Tuple
from app.ocr.ocr_engine import OCREngine
from app.ocr.text_extraction import TextExtractionService
from app.api.schemas import RationCardVerificationData, StatusFlag, OCRFieldExtraction

class RationOCRProcessor:
    def __init__(self, ocr_engine: OCREngine):
        self.ocr_engine = ocr_engine

    def extract_ration_details(self, image_np) -> Tuple[RationCardVerificationData, str, List[OCRFieldExtraction], StatusFlag]:
        full_text, lines, ocr_status = self.ocr_engine.extract_text(image_np)
        parsed_data = TextExtractionService.parse_ration_text(full_text)
        return parsed_data, full_text, lines, ocr_status
