# MediSecure — Smart Healthcare Identity & Government Health Schemes System

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)

An intelligent, full-stack healthcare identity, access control, and government health schemes platform built with FHIR R4 principles, zero-PII digital QR passes, context-aware authorization, and an **AI-Enabled Ration Card Healthcare Eligibility & Assistance Module** (supporting **MJPJAY 2.0 & Ayushman Bharat PM-JAY**).

---

## 🌟 Key Features

### 1. 🔐 Multi-Role Authentication & Access Control (RBAC)
- **Role Portals**: Dedicated interfaces for **Patient**, **Doctor**, **Nurse**, **Hospital Admin**, **Pharmacist**, **Lab Tech**, and **Emergency Staff**.
- **Email or Mobile Login**: Authenticate with either email address or 10-digit mobile number.
- **Dual Auth Modes**: Sign in with **Password** or **Mobile/Email OTP (One-Time Password)**.
- **First-Time Sign-Up**: Verification code (OTP) dispatch via SMS or Email with instant verification.

### 2. 🏛️ Government Health Scheme & Ration Card Assistance Module
- **Ration Card Verification**:
  - Validates card category: **Yellow (BPL)**, **Orange**, **White**, **Antyodaya (AAY)**, **Annapurna**.
  - Secure cryptographic hashing (SHA-256) of raw card numbers with automatic masking (`XXXX-XXXX-1234`).
  - Document upload support (PDF/JPG) for official records.
- **Scheme Eligibility Engine**:
  - Preliminary assessment for **Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY 2.0)** (up to ₹5,00,000 cashless coverage in Maharashtra across 1,356 procedures).
  - Preliminary assessment for **Ayushman Bharat – PM-JAY** (up to ₹5,00,000 nationwide coverage across 1,949 procedures).
  - Direct links to official government verification portals.
  - Prominent mandatory disclaimer: *"Preliminary Eligibility Check – Final eligibility must be verified through the official government portal or authorized hospital."*
- **Family Health Profiles (`My Family`)**:
  - Manage household dependents covered under family floater benefits.
  - Track Government Beneficiary IDs and link existing system patient UIDs.
- **Empanelled Hospital Finder**:
  - Filter by Scheme (MJPJAY, PM-JAY), District, City, and Medical Specialty.
  - Integration with directions, direct hospital call, and on-site Arogya Mitra desk verification requests.
- **Covered Healthcare Packages Catalog**:
  - Searchable procedures: Cataract, Cardiac Surgery (CABG), Cancer Chemotherapy, Hemodialysis, Total Knee Replacement (TKR), General Surgery.
- **AI Health Scheme Assistant**:
  - Chatbot answering queries regarding eligibility, documents, hospital procedures, and coverage.
  - **Clinical Guardrail**: Refuses medical diagnosis or prescription queries, routing users to licensed clinicians.
  - Multilingual support in **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)**.
- **My Scheme QR Pass**:
  - Zero-PII QR code containing a secure time-limited token. Authorized hospital staff retrieve verified eligibility via backend RBAC.
- **Scheme Notifications**:
  - Live alerts for card approval, hospital desk verification responses, and missing document requests.
- **Hospital Verification Workflow**:
  - Hospital staff / Admin review desk to approve, request additional documents, or reject pre-admission scheme requests.

### 3. 📑 AI Government Scheme Recommendation & Auto-Form Filling Assistant
- **Aadhaar Demographic Extraction**:
  - YOLO11 document classification and multilingual PaddleOCR extraction in English, Hindi, and Marathi.
  - Verification of signed UIDAI QR codes and offline e-KYC XML data.
  - Mandatory zero-exposure Aadhaar number masking (`XXXX-XXXX-1234`).
  - Strict user informed consent gate before processing identity documents.
- **Supporting Document Extraction**:
  - Automated field extraction for **Income Certificates** (Tahsildar), **Caste Certificates** (SDO), **Disability Certificates / UDID** (Medical Board), **Birth / Age Certificates**, **Bank Account Passbooks** (with masked account numbers), and **Maharashtra Ration Cards**.
- **Structured Government Scheme Database**:
  - Officially published criteria, required documents, application form fields, official application URLs, and gazette citations for:
    - **Ayushman Bharat PM-JAY** (NHA / MoHFW)
    - **Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY 2.0)** (SHAS / GoM)
    - **Sanjay Gandhi Niradhar Anudan Yojana (SGNAY)** (Social Justice Dept, GoM)
    - **Shravan Bal Seva Nivruttivetan Yojana (SBSNY)** (Social Justice Dept, GoM)
    - **Janani Suraksha Yojana (JSY) / Matrushakti** (NHM / Public Health Dept, GoM)
    - **Divyang Swavalamban & Disability Pension** (Divyangjan Welfare Dept, GoM)
- **Rule-Based Scheme Eligibility Engine**:
  - Automated synthesis comparing extracted patient profiles against published criteria.
  - Classifies schemes into **Potentially Eligible**, **Insufficient Information**, or **Ineligible based on confirmed rules**.
  - Provides detailed human-readable reasoning and lists exact missing documents and fields.
  - Mandatory guardrail: Clearly distinguishes AI preliminary assessment from authorized official verification.
- **Application Form Autofill Assistant**:
  - Dynamically renders official scheme form fields and auto-populates them using extracted OCR data.
  - Allows full user editing of every field and highlights missing mandatory information.
  - Enables attaching verified uploaded supporting documents.
  - Provides application preview and requires explicit user approval before saving.
  - Direct links to official government application portals (`aaplesarkar.mahaonline.gov.in`, `beneficiary.nha.gov.in`, `jeevandayee.gov.in`).
- **Database & Security**:
  - 6 dedicated Mongoose collections: `GovernmentSchemes`, `SchemeEligibilityRules`, `PatientSchemeProfiles`, `SchemeRecommendations`, `SchemeApplications`, `ApplicationDocuments`.
  - Immutable audit trails, RBAC enforcement, and zero plaintext PII persistence.

### 3. 🤖 AI-Powered Document Detection & Verification Module
- **YOLO11 Nano Computer Vision**: Fine-tuned document classification and localized field region detection for **Aadhaar Cards** and **Maharashtra Ration Cards**.
- **Multilingual PaddleOCR & Fallback Engine**: High-accuracy structured extraction of demographic fields across English, Hindi, and Marathi.
- **UIDAI Secure QR & Cryptographic PKI**: Decompresses V2/V3 big-integer QR payloads with zlib; validates official RSA-2048 digital signatures and Paperless Offline e-KYC XML certificates.
- **Maharashtra RCMS Compliance**: Checks 12-digit SRC numbers, priority categories (Yellow, Orange, White, AAY), and family rosters against state guidelines.
- **Anti-Tampering & Security**: Laplacian blur variance checks, layout aspect-ratio compliance, perceptual dHash duplicate detection, and zero-storage masking (`XXXX-XXXX-1234`).
- **Independent Verification Status Matrix**: Independent flags for Detection, OCR, QR, Signature, Official Verification, Demographic Matching, and Security Anomalies.
- **Multi-Role Interfaces**:
  - *Patient*: Document upload (front/back), live inspection pipeline, demographic cross-match report.
  - *Doctor*: Clinical identity verification lookup (masks raw document images for privacy).
  - *Admin*: Central verification queue, statistics cards, and 1-click manual approve/reject audit decisions.

### 4. 🩺 Clinical & Hospital Management
- **Digital Patient Health Pass**: Instant unique health ID (`PAT-2026-XXXXXX`) and dynamic QR token.
- **Prescription Writer & Pharmacy Fulfillment**: E-prescriptions with dispensing workflow.
- **Diagnostics & Pathology**: Lab report management with critical parameter flagging.
- **Consent Center**: Granular, time-limited patient consent management.
- **Emergency Access Protocol**: 30-minute break-glass emergency override with immutable audit trails.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS, Lucide Icons, Canvas Confetti, QRCode.react
- **Backend API**: Node.js, Express.js (ES Modules), Mongoose, Multer, JWT, BcryptJS
- **AI Microservice**: Python 3.10, FastAPI, Uvicorn, Ultralytics YOLO11 Nano, PyTorch (with Apple Silicon MPS & CPU fallback), OpenCV, PaddleOCR, Cryptography, PyCryptodome, DefusedXML
- **Database**: MongoDB with Mongoose (with in-memory MongoDB fallback)
- **Internationalization (i18n)**: English, Hindi (हिंदी), Marathi (मराठी)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Omkar9783/Healthcare-System.git
cd Healthcare-System
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 3. Configure Environment Variables
Copy `.env.example` in `server/` to `.env`:
```bash
cp server/.env.example server/.env
```
Update `server/.env` with your JWT secret and MongoDB URI (or leave as-is for automatic in-memory MongoDB fallback).

### 4. Run Locally
Run both client and server:
```bash
# Terminal 1: Start Backend Server
cd server
npm start

# Terminal 2: Start Frontend Client
cd client
npm run dev
```

The application will be accessible at:
- **Frontend Web App**: `http://localhost:5173/`
- **Backend API**: `http://localhost:5001/api`
- **Health Check**: `http://localhost:5001/api/health`

---

## 🧪 Running Automated Tests

Run the complete test suites for both the AI computer vision service and the backend rule eligibility engine:

```bash
# 1. Run Node.js Rule-Based Scheme Eligibility Engine Tests
cd server
npm test

# 2. Run Python YOLO & Multilingual OCR Tests in AI Document Service
cd ../ai-document-service
PYTHONPATH=. venv/bin/pytest tests
```

---

## 🔑 Demo Login Accounts

All demo accounts use password: **`password123`**

| Role | Email | Mobile No | Description |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@demo.health` | `9988776651` | Access health records, digital QR & Government Schemes Hub |
| **Doctor** | `doctor@demo.health` | `9876543201` | Cardiology consultations, prescriptions, QR scanning |
| **Admin** | `admin@demo.health` | `9876543200` | System governance, audit logs & Scheme Verifications desk |
| **Nurse** | `nurse@demo.health` | `9876543204` | Vitals monitoring & ward bed management |
| **Pharmacist** | `pharmacy@demo.health` | `9876543207` | Prescription fulfillment & dispensing verification |
| **Lab Tech** | `lab@demo.health` | `9876543206` | Pathology diagnostic reports |
| **Emergency Staff**| `emergency@demo.health` | `9876543208` | 30-min casualty override protocol |

---

## 👤 Author
Built by **Omkar Panchal** — [GitHub @Omkar9783](https://github.com/Omkar9783)
