# MediSecure AI-Powered Document Detection & Verification Module

An enterprise-grade computer vision, OCR, and cryptographic identity verification service seamlessly integrated into the **MediSecure Smart Healthcare Platform**. 

Supports official Indian identity documents:
- **Aadhaar Card** (UIDAI V2/V3 Secure QR, Offline e-KYC XML, ID-1 Layout)
- **Maharashtra Ration Card** (RCMS 12-digit SRC, Yellow/Orange/White Priority Categories, Family Roster)

---

## 1. Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │    Patient / Doctor / Admin Client     │
                      │    (React 19 + Vite + TailwindCSS)     │
                      └───────────────────┬────────────────────┘
                                          │ Multipart Upload (File + Patient UID)
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    MediSecure Express API (Port 5001)  │
                      │   - JWT & Role-Based Access Control    │
                      │   - Mongo DocumentVerification Model   │
                      │   - Audit Logging & Admin Decision Log │
                      └───────────────────┬────────────────────┘
                                          │ Internal Proxy (Port 8000)
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   FastAPI AI Service (Port 8000)       │
                      ├────────────────────────────────────────┤
                      │ [1] YOLO11 Nano Document Classifier    │
                      │ [2] Field Region Detector (Crop BBox)  │
                      │ [3] Image Quality & Anomaly Scanner    │
                      │ [4] PaddleOCR Multilingual Engine      │
                      │ [5] UIDAI Secure QR & Cryptographic PKI│
                      │ [6] Demographic Fuzzy Matching         │
                      │ [7] Central Decision Synthesizer       │
                      └────────────────────────────────────────┘
```

---

## 2. 12-Step Processing Pipeline

1. **Upload**: Patient uploads front/back image of Aadhaar or Ration Card.
2. **Validation**: Enforce image formats (JPEG/PNG/WebP) and maximum file size (10MB).
3. **Preprocessing**: Grayscale conversion, adaptive thresholding, illumination correction via OpenCV.
4. **Classification**: YOLO11 Nano detects class (`aadhaar_front`, `aadhaar_back`, `ration_front`, `ration_back`, `other_document`).
5. **Orientation**: Layout aspect ratio analysis (ID-1 ratio ~1.58 vs Booklet).
6. **Field Detection**: Crop bounding boxes for `name_region`, `dob_region`, `qr_region`, `address_region`, `aadhaar_number_region` / `head_of_family_region`, `family_details_region`.
7. **OCR**: PaddleOCR (English, Hindi, Marathi) extracts text lines.
8. **Information Extraction**: Regex parsing of names, DOB, gender, 12-digit SRC numbers, address.
9. **Tampering & Quality**: Laplacian blur variance (<80 = blurred), border integrity, perceptual dHash duplicate check.
10. **Official Authenticity**: 
    - **Aadhaar**: Decodes QR (UIDAI V2/V3 big-integer decompression, zlib stream, RSA-2048 public cert signature validation).
    - **Ration Card**: Validates 12-digit SRC schema; sets `PENDING_OFFICIAL_VERIFICATION` unless authorized RCMS API credentials exist.
11. **Patient Matching**: Fuzzy Levenshtein token similarity matching extracted fields against registered patient demographics.
12. **Decision Engine**: Generates independent flags and central status (`VERIFIED`, `NOT_VERIFIED`, `PENDING`, `MANUAL_REVIEW`, `UNSUPPORTED_DOCUMENT`, `ANOMALY_DETECTED_REQUIRES_REVIEW`).

---

## 3. Security, Privacy & Zero-Storage Rules

- **No Plaintext Aadhaar Numbers**: All Aadhaar numbers are immediately masked to `XXXX-XXXX-1234`.
- **No Unencrypted Images on Disk**: Uploads are processed in-memory buffers; temporary files are wiped immediately.
- **No Scraping**: No automated scraping of CAPTCHA-protected citizen portals (`rcms.mahafood.gov.in`).
- **No False Authenticity Claims**: OCR alone or high YOLO confidence NEVER produces `VERIFIED` status without cryptographic signature validation or authorized administrative sign-off.
- **Admin Audit Trail**: Every manual approval or rejection requires a mandatory justification recorded in `AuditLog`.

---

## 4. Local Mac Installation & Setup

### Prerequisites
- macOS (Apple Silicon M1/M2/M3/M4 supported via Metal Performance Shaders `mps`)
- Python 3.10+
- Node.js v18+

### Setup Virtual Environment
```bash
cd "ai-document-service"
/opt/homebrew/bin/python3.10 -m venv venv
venv/bin/pip install --upgrade pip
venv/bin/pip install -r requirements.txt
```

### Running the AI Service
```bash
# From workspace root:
npm run start:ai

# Or directly:
cd ai-document-service
venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation (Swagger UI): `http://localhost:8000/docs`

---

## 5. Dataset Generation & YOLO Training

### Generate Synthetic Datasets
Creates 100% privacy-compliant synthetic datasets with fictional demographic records and normalized YOLO labels:
```bash
cd ai-document-service
venv/bin/python scripts/generate_synthetic_datasets.py
venv/bin/python scripts/validate_dataset.py
```

### Fine-Tuning YOLO11 Models
```bash
# 1. Document Classifier & Detector
venv/bin/python scripts/train_document.py --epochs 50 --batch 16 --device auto

# 2. Aadhaar Field Detection
venv/bin/python scripts/train_aadhaar_fields.py --epochs 50 --batch 16 --device auto

# 3. Maharashtra Ration Card Field Detection
venv/bin/python scripts/train_ration_fields.py --epochs 50 --batch 16 --device auto
```

Trained weights are automatically deployed to:
- `models/document_detector/best.pt`
- `models/aadhaar_fields/best.pt`
- `models/ration_fields/best.pt`

---

## 6. CLI Inference & Evaluation

### Run CLI Prediction on an Image
```bash
cd ai-document-service
venv/bin/python scripts/predict.py --image "datasets/aadhaar/images/train/synth_aadhaar_train_000.jpg" --save-annotated output_annotated.jpg
```

### Run Evaluation Suite (mAP, CER, WER, FAR, FRR)
```bash
cd ai-document-service
venv/bin/python scripts/evaluate.py
```

### Run Automated Pytest Suite
```bash
cd ai-document-service
PYTHONPATH=. venv/bin/pytest tests
```

---

## 7. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service and model status |
| `POST` | `/api/document/detect` | YOLO document classification & side detection |
| `POST` | `/api/document/ocr` | Multilingual text extraction |
| `POST` | `/api/document/verify` | Full 12-step verification pipeline |
| `POST` | `/api/aadhaar/verify` | Aadhaar dedicated verification route |
| `POST` | `/api/ration/verify` | Ration card dedicated verification route |
| `GET` | `/api/document/status/{id}` | Query verification transaction status |

---

## 8. Frontend Integration

Access the **AI Document Verification** tab in the MediSecure navigation menu:
- **Patient**: Upload Aadhaar/Ration card, view live pipeline progress, demographic match results, and personal history.
- **Doctor**: Clinical verification lookup with verified demographic badges (masks full identity scans to protect patient privacy).
- **Admin**: Central verification queue, statistics cards, and 1-click manual approve/reject decision workflow with audit trail.
