import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")
AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY", "medisecure_ai_secret_key_2026")
MODEL_DEVICE = os.getenv("MODEL_DEVICE", "auto")

# Model Paths
DOCUMENT_DETECTOR_MODEL = BASE_DIR / os.getenv("DOCUMENT_DETECTOR_MODEL", "models/document_detector/best.pt")
AADHAAR_FIELDS_MODEL = BASE_DIR / os.getenv("AADHAAR_FIELDS_MODEL", "models/aadhaar_fields/best.pt")
RATION_FIELDS_MODEL = BASE_DIR / os.getenv("RATION_FIELDS_MODEL", "models/ration_fields/best.pt")

MIN_DETECTION_CONFIDENCE = float(os.getenv("MIN_DETECTION_CONFIDENCE", "0.50"))
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

TEMP_DIR = Path(os.getenv("TEMP_DIR", "/tmp/medisecure_ai_docs"))
TEMP_DIR.mkdir(parents=True, exist_ok=True)
