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

### 3. 🩺 Clinical & Hospital Management
- **Digital Patient Health Pass**: Instant unique health ID (`PAT-2026-XXXXXX`) and dynamic QR token.
- **Prescription Writer & Pharmacy Fulfillment**: E-prescriptions with dispensing workflow.
- **Diagnostics & Pathology**: Lab report management with critical parameter flagging.
- **Consent Center**: Granular, time-limited patient consent management.
- **Emergency Access Protocol**: 30-minute break-glass emergency override with immutable audit trails.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS, Lucide Icons, Canvas Confetti, QRCode.react
- **Backend**: Node.js, Express.js (ES Modules), JWT, BcryptJS
- **Database**: MongoDB with Mongoose (compatible with MongoDB Atlas and in-memory MongoDB fallback)
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
