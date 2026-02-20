# 🏥 MediVault — Full Project Explanation (ELI5 + Deep Dive)

> **Explained like you're 5, then like you're a developer.**
> Every file, every database, every feature — nothing skipped.

---

## 🧒 What Is This App? (ELI5)

Imagine you go to the doctor. The doctor wants to see your medical reports — X-rays, blood tests, prescriptions.
But you don't have them with you. Or maybe you're unconscious in an emergency!

**This app solves that.**

- You (the **patient**) store all your medical documents on your phone/computer.
- When you visit a doctor, you show a **QR code** on your screen.
- The doctor **scans** that QR code with their phone.
- They instantly see your medical documents — for only as long as you allow.
- A **robot (AI)** reads your documents and writes a short summary for the doctor.
- If there's an **emergency**, critical info (blood group, allergies, medicines) is always one tap away.

That's the whole app. A secure, QR-based medical record sharing system with AI summaries.

---

## 🗺️ Big Picture Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER (React)                       │
│  Patient App  ◄───────────────────►  Doctor App             │
└────────────────────────┬────────────────────────────────────┘
                         │  HTTP (REST API)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKEND (Node.js + Express + TypeScript)       │
│                                                              │
│   Auth  │  Sessions  │  Documents  │  Patients  │  AI/OCR   │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴───────────────────┐
       ▼                           ▼
┌─────────────┐            ┌──────────────┐
│  MongoDB    │            │  Cloudinary  │
│  (Database) │            │ (File Store) │
└─────────────┘            └──────────────┘
                                   │
                            ┌──────▼──────┐
                            │  Groq AI    │
                            │  (LLaMA 3)  │
                            └─────────────┘
```

---

## 📁 Full Folder Structure Explained

```
hack_01/
├── backend/          ← Node.js server (the brain)
├── frontend/         ← React app (what you see)
└── README.md         ← Empty (you're reading the real docs now)
```

---

# 🖥️ BACKEND — Deep Dive

The backend is a **Node.js + Express + TypeScript** server.
It lives on `http://localhost:5000` in development.

---

## `backend/src/server.ts` — The Starter

**What it does:** This is the very first file that runs.

```
1. Load environment variables (.env file)
2. Connect to MongoDB database
3. Start listening for requests on port 5000
```

Think of it as the **"turn on the app"** file.

---

## `backend/src/app.ts` — The Router Hub

**What it does:** Wires all the URL routes together.

| URL Prefix         | What It Handles              |
|--------------------|------------------------------|
| `/api/auth`        | Login & Signup               |
| `/api/session`     | QR session create/validate   |
| `/api/documents`   | Upload/fetch/summarize docs  |
| `/api/patients`    | Patient profile/emergency    |
| `/health`          | Server health check          |

Also enables **CORS** (so the React frontend can talk to it) and **JSON parsing**.

---

## 🗄️ Database — MongoDB

The database is **MongoDB**, a NoSQL database hosted via the `MONGO_URI` environment variable (typically MongoDB Atlas cloud or local).

### Using MongoDB Atlas (hosted)

- Yes — you can use MongoDB Atlas instead of a local MongoDB.
- Put your Atlas connection string in `backend/.env` as `MONGO_URI=...` (include a DB name after the `/`).
- For safety: never commit `.env` files to git; use `backend/.env.example` as a template.

### There are 3 collections (tables):

---

### 1. `users` — `backend/src/models/user.model.ts`

Stores everyone who has an account.

| Field          | Type    | Description                          |
|----------------|---------|--------------------------------------|
| `name`         | String  | Full name                            |
| `email`        | String  | Unique email address                 |
| `passwordHash` | String  | bcrypt-hashed password               |
| `role`         | String  | Either `"patient"` or `"doctor"`     |
| `licenseNumber`| String  | Doctors only — medical license       |
| `clinicName`   | String  | Doctors only — clinic name           |
| `createdAt`    | Date    | Auto-added by Mongoose               |
| `updatedAt`    | Date    | Auto-added by Mongoose               |

**Key rule:** Doctors MUST provide a license number (at least 3 chars) to register.

---

### 2. `patients` — `backend/src/models/patient.model.ts`

Stores patient-specific info. Every patient in `users` gets a matching record here.

| Field                        | Type      | Description                              |
|------------------------------|-----------|------------------------------------------|
| `patientId`                  | String    | Same as the user's MongoDB `_id`         |
| `name`                       | String    | Patient name                             |
| `email`                      | String    | Patient email                            |
| `emergency.bloodGroup`       | String    | e.g., `"A+"`, `"O-"`                    |
| `emergency.allergies`        | String[]  | e.g., `["Penicillin", "Dust"]`           |
| `emergency.medications`      | String[]  | Current medicines                        |
| `emergency.chronicConditions`| String[]  | e.g., `["Diabetes", "Hypertension"]`    |
| `emergency.emergencyContact` | String    | Phone number of emergency contact        |

---

### 3. `documents` — `backend/src/models/document.model.ts`

Stores every uploaded medical document.

| Field            | Type   | Description                                            |
|------------------|--------|--------------------------------------------------------|
| `patientId`      | String | Which patient owns this document                       |
| `url`            | String | Cloudinary URL (or base64 data URL as fallback)        |
| `type`           | String | One of: `Prescription`, `Lab Report`, `Scan`, `Other` |
| `uploadedByName` | String | Who uploaded it (doctor or patient name)               |
| `uploadedByRole` | String | `"doctor"` or `"patient"`                              |
| `summary`        | String | AI-generated summary (filled in after summarization)   |
| `createdAt`      | Date   | Auto-added                                             |

---

## 🔐 Auth System

### `backend/src/controllers/auth.controller.ts`

Handles two endpoints: **signup** and **login**.

#### Signup Flow:
```
1. Validate: name, email, password, role all required
2. If doctor → licenseNumber required (min 3 chars)
3. Check email format with regex
4. Check password ≥ 6 characters
5. Check email not already taken
6. Hash the password with bcrypt (10 salt rounds)
7. Create User in DB
8. If patient → also create a Patient record in DB
9. If a guestPatientId was passed → merge any guest documents to the new account
10. Generate a JWT auth token (valid 7 days)
11. Return: { user info + token }
```

#### Login Flow:
```
1. Find user by email
2. bcrypt.compare(password, stored hash)
3. If patient → ensure Patient record exists (upsert)
4. If guestPatientId provided → merge guest documents
5. Generate JWT auth token
6. Return: { user info + token }
```

#### Guest Users:
Users who haven't signed up yet get a randomly generated `patientId` stored in `localStorage`. When they sign up, their documents are automatically transferred to their real account. This is called **guest document merging**.

---

### `backend/src/utils/jwt.ts`

Two types of tokens:

| Token Type       | Purpose                                | Expiry  |
|------------------|----------------------------------------|---------|
| **Auth Token**   | Proves who you are (login)             | 7 days  |
| **Session Token**| Embedded in QR codes (temporary access)| Custom |

Both are signed with `JWT_SECRET` from environment variables.

---

### `backend/src/middleware/auth.middleware.ts`

Three middleware functions:

| Function           | What It Does                                             |
|--------------------|----------------------------------------------------------|
| `authMiddleware`   | Reads `Authorization: Bearer <token>` header, decodes it, attaches `req.user` |
| `requireAuth`      | Blocks the request if no user is attached (401)          |
| `requireRole(role)`| Blocks if user doesn't have the required role (403)      |

---

## 📋 Session System (The QR Code Heart)

### `backend/src/utils/sessionStore.ts`

Sessions live **in memory** (RAM), not in the database. They are temporary by design.

A session looks like:
```typescript
{
  sessionId: "abc12345",        // random 8-char ID
  token: "xyz...",              // random token embedded in QR
  patientId: "mongo_id_here",   // which patient this is for
  accessType: "view" | "write", // can doctor upload files?
  createdAt: 1234567890,        // Unix timestamp
  expiresAt: 1234568790,        // createdAt + duration
  durationMinutes: 15,          // how long the session lasts
  sharedDocIds: ["id1","id2"],  // specific docs shared (or all)
  anon: false,                  // was this created without login?
}
```

Sessions are stored in two in-memory maps:
- `sessionsById` → look up by `sessionId`
- `sessionsByToken` → look up by `token` (for QR scanning)

**Expired sessions auto-delete** when you try to look them up.

### `backend/src/controllers/session.controller.ts`

| Endpoint                    | What It Does                                              |
|-----------------------------|-----------------------------------------------------------|
| `POST /api/session/create`  | Patient creates an authenticated session (logged in)       |
| `POST /api/session/create-anon` | Patient creates a session without being logged in     |
| `POST /api/session/validate`| Doctor scans QR → validates the token, returns sessionId  |
| `GET /api/session/:id`      | Fetch a session by its ID (for doctor session page)       |

**Key logic:** A patient can only have ONE active session at a time. Creating a new one auto-deletes the old one.

---

## 📁 Document System

### `backend/src/controllers/document.controller.ts` (554 lines — the biggest file)

#### Upload Paths:

**Path 1: Doctor uploads via QR session**
```
POST /api/documents/upload/:sessionId
→ Validate session exists + not expired + accessType = "write"
→ Upload file to Cloudinary
→ If Cloudinary fails → fallback: store as base64 data URL in DB
→ Save Document to MongoDB with patientId from session
```

**Path 2: Patient uploads directly**
```
POST /api/documents/upload/by-patient
→ No auth required (patient uses their patientId)
→ Upload to Cloudinary (or fallback data URL)
→ Save Document to MongoDB
```

#### Fetch Paths:

| Route                              | Who Uses It     | What It Returns                      |
|------------------------------------|-----------------|--------------------------------------|
| `GET /api/documents/:sessionId`    | Doctor          | Documents shared in the session      |
| `GET /api/documents/patient/:id`   | Patient         | All documents owned by patient       |

#### AI Summarization:

```
POST /api/documents/:docId/summarize
1. Find document in DB
2. OCR: extract text from the file (image or PDF)
3. Send text to Groq AI (LLaMA 3.1)
4. AI returns a structured bullet-point medical summary
5. Save summary to document in DB
6. Return summary
```

```
POST /api/documents/patient/:patientId/summary
→ Same as above but for ALL patient documents at once
→ Generates individual summaries then creates an AGGREGATE summary
```

---

### `backend/src/middleware/upload.ts`

Uses **Multer** to handle file uploads.
- Files are stored in **memory** (RAM buffer), NOT on disk.
- Max file size: **10MB**.
- The buffer is then passed to Cloudinary for cloud storage.

---

### `backend/src/config/cloudinary.ts`

Cloudinary is a third-party **cloud file storage** service (like Google Drive for apps).
Documents (images, PDFs) are uploaded here and you get back a permanent URL.
Credentials come from environment variables:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## 🤖 AI & OCR Pipeline

### `backend/src/utils/ocr.service.ts` — Text Extraction

OCR = **Optical Character Recognition** = making computers read images.

```
Input: A document URL (Cloudinary URL or base64 data URL)

If it's an IMAGE (jpg/png):
  → Use Tesseract.js (open-source OCR engine)
  → Recognizes English text from the image
  → Returns raw text string

If it's a PDF:
  → Use pdf-parse to extract embedded text
  → If no text found (scanned PDF) → fall back to Tesseract OCR
  → Returns text string

cleanText(): Removes garbage characters, normalizes whitespace
```

The file `backend/eng.traineddata` is the **English language model** for Tesseract.

### `backend/src/services/llm.service.ts` — AI Summarization

This service talks to **Groq** (an AI inference platform) using the **LLaMA 3.1 8B** model.
It uses the OpenAI SDK but points it at Groq's API endpoint.

**Two methods:**

1. `generateSummary(text)` — For a single document:
   - Sends a carefully crafted prompt to LLaMA 3.1
   - Rules: Only summarize what's in the text. No new diagnoses. No advice.
   - Output structure: `Diagnoses | Abnormal Labs | Medications | Critical Alerts`

2. `generateAggregateSummary(documents[])` — For all patient documents at once:
   - Takes multiple document summaries
   - Creates one unified patient health report
   - Output structure: `Overall Status | Key Diagnoses | Abnormal Labs | Medications | Critical Alerts`

Temperature is set to `0.2` (very factual, not creative).

---

## 👤 Patient Routes

### `backend/src/controllers/patient.controller.ts`

| Endpoint                       | What It Does                                      |
|--------------------------------|---------------------------------------------------|
| `GET /api/patients/:patientId` | Fetch patient profile + emergency info            |
| `PUT /api/patients/:patientId` | Update name, email, or emergency data (`upsert`)  |

"Upsert" = update if exists, create if not.

---

## 🧰 Utility Scripts

### `backend/scripts/listDocumentsByPatient.ts`
Admin script to list all documents grouped by patient. Run manually from terminal.

### `backend/scripts/reassignDocuments.ts`
Admin script to move documents from one patientId to another. Used for fixing data issues.

### `backend/scripts/summarize_text.py` / `train_summarizer.py`
Python scripts for experimenting with a local summarization model (not used in the main app — exploratory work).

---

# 🎨 FRONTEND — Deep Dive

The frontend is a **React + TypeScript + Vite** app.
It lives on `http://localhost:5173` in development.

---

## `frontend/src/main.tsx`
The entry point. Just renders `<App />` into the HTML.

## `frontend/src/App.tsx` — The Router

Defines all the URL routes in the app:

| URL Path                          | Component              | Who Uses It  |
|-----------------------------------|------------------------|--------------|
| `/`                               | `Landing`              | Everyone     |
| `/login`                          | `Login`                | Everyone     |
| `/signup`                         | `Signup`               | Everyone     |
| `/patient/dashboard`              | `PatientDashboard`     | Patient      |
| `/patient/records`                | `Records`              | Patient      |
| `/patient/generate-qr`            | `GenerateQR`           | Patient      |
| `/patient/emergency`              | `Emergency`            | Patient      |
| `/patient/documents`              | `PatientDocuments`     | Patient      |
| `/doctor/dashboard`               | `DoctorDashboard`      | Doctor       |
| `/doctor/scan`                    | `ScanQR`               | Doctor       |
| `/doctor/session/:sessionId`      | `DoctorSession`        | Doctor       |
| `/doctor/session/:sessionId/upload`| `UploadDocument`      | Doctor       |
| `*`                               | Redirect to `/`        | Everyone     |

Doctor pages are all wrapped in `<DoctorLayout>` which adds the doctor's navigation/sidebar.

---

## 📄 Pages — Patient Side

### `frontend/src/pages/patient/Dashboard.tsx`
The patient's home screen after login.

**What it shows:**
- Quick stats: document count, active session indicator
- Emergency profile status (Ready / Not Set)
- 3 navigation cards: Records, QR Access, Emergency
- "Generate AI Summary" button → calls `/api/documents/patient/:id/summary`
- Displays the AI summary in a modal

**Data it fetches on load:**
1. Documents count from `/api/documents/patient/:id`
2. Active session from `/api/session/:sessionId`
3. Emergency profile from `/api/patients/:id`

---

### `frontend/src/pages/patient/GenerateQR.tsx`
The QR code generation wizard. This is a 3-step flow:

**Step 1:** Choose access type
- `view` — Doctor can only SEE documents
- `write` — Doctor can also UPLOAD documents

**Step 2:** Choose duration (how many minutes the QR lasts)

**Step 3:** Select which documents to share (checkboxes by type)

**On Submit:**
- If logged in as patient → `POST /api/session/create`
- If guest (no authToken) → `POST /api/session/create-anon`
- Gets back a session token
- Displays a QR code modal with a countdown timer

---

### `frontend/src/pages/patient/Emergency.tsx`
Displays the patient's emergency profile.

Shows in a formatted card:
- 🩸 Blood Group
- ⚠️ Allergies
- 💊 Current Medications
- 🫀 Chronic Conditions
- 📞 Emergency Contact

Buttons: **Print** (browser print dialog) and **Edit Profile** (opens PatientEditor component).

Status badge: `Ready` (green) or `Not Set` (yellow) based on whether data exists.

---

### `frontend/src/pages/patient/Records.tsx`
Shows all the patient's uploaded documents.

- Lists documents with type, uploader, date
- Allows viewing documents (in DocumentModal)
- Allows uploading new documents (patient self-upload)
- Shows AI summaries if already generated

---

### `frontend/src/pages/patient/Documents.tsx`
Alternative document view (used for the `/patient/documents` route — similar to Records but potentially a different layout).

---

## 📄 Pages — Doctor Side

### `frontend/src/pages/doctor/Dashboard.tsx`
The doctor's home screen.

**Shows:**
- Active session panel (if a session is currently active)
  - Patient ID, access type, started time, time remaining
- Navigation card to "Scan QR"
- If no active session → prompts to scan a QR

---

### `frontend/src/pages/doctor/ScanQr.tsx`
The QR scanner page. Uses the `html5-qrcode` library.

**Flow:**
```
1. Opens device camera (browser permission required)
2. Scans continuously at 10 fps
3. When QR is detected:
   a. Extract the token string
   b. POST /api/session/validate with { token }
   c. Server returns { sessionId, accessType }
   d. Store accessType in localStorage
   e. Navigate to /doctor/session/:sessionId
```

If the doctor isn't logged in → shows error and redirects to login.

---

### `frontend/src/pages/doctor/Session.tsx`
The main doctor session page — where all the action happens.

**What it does:**
1. Fetch session details (access type, expiry time)
2. Start a countdown timer
3. Fetch documents shared in this session
4. Show documents in a grid
5. Allow viewing documents in a modal
6. **"Generate Summary" button** → calls AI summarization for each document
7. Shows summaries in a "Summary" tab

**Two tabs:**
- `Documents` tab: Grid view of shared documents
- `Summary` tab: AI-generated summaries per document

---

### `frontend/src/pages/doctor/UploadDocument.tsx`
A clean full-page form for doctors to upload a document during a session.

- Requires an active write-access session
- File picker (image or PDF)
- Document type selector (Prescription / Lab Report / Scan / Other)
- Uploads to `POST /api/documents/upload/:sessionId`
- Document is saved under the patient's account

---

## 🧩 Components

| Component              | What It Does                                                       |
|------------------------|--------------------------------------------------------------------|
| `AuthGuard.tsx`        | Protects routes — redirects to login if not authenticated          |
| `PatientLayout.tsx`    | Wraps patient pages with navigation sidebar/header                 |
| `DoctorLayout.tsx`     | Wraps doctor pages with navigation sidebar/header                  |
| `Header.tsx`           | Top navigation bar                                                 |
| `Footer.tsx`           | Bottom footer                                                      |
| `GlobalToast.tsx`      | App-wide toast notification system (listens for `toast` events)   |
| `AISummaryModal.tsx`   | Modal that displays AI-generated patient-level summaries           |
| `DocumentModal.tsx`    | Modal for viewing individual documents (image/PDF preview)         |
| `QrModal.tsx`          | Modal that displays the generated QR code + countdown timer        |
| `CountdownTimer.tsx`   | Live countdown timer component                                     |
| `PatientEditor.tsx`    | Form component for editing patient profile + emergency info        |
| `DoctorDetailsModal.tsx`| Shows doctor's profile details                                    |
| `TiltCard.tsx`         | A card with a subtle 3D tilt effect on hover                       |
| `ThemeToggle.tsx`      | Light/dark mode toggle button                                      |

---

## 🌗 Theme System

### `frontend/src/context/ThemeContext.tsx`
React Context providing light/dark mode to the entire app.
- Stores the theme in `localStorage`
- Wraps `<App>` so all components can read/set the theme

---

## 🎨 Styles

### `frontend/src/styles/global.css`
Global CSS with CSS variables for theming:
- `--bg`, `--bg-card`, `--text`, `--text-muted` etc.
- All components use these variables so switching dark/light mode works everywhere

---

## 🔧 Utilities

### `frontend/src/utils/auth.ts`
Helper functions for localStorage token management:
- `getAuthToken()` → reads from localStorage
- `getUserRole()` → reads patient/doctor role
- `clearAuth()` → logout (clears localStorage)

---

## ⚙️ Frontend Config Files

| File                    | Purpose                                          |
|-------------------------|--------------------------------------------------|
| `vite.config.ts`        | Vite build tool config                           |
| `tsconfig.json`         | TypeScript compiler settings                     |
| `tsconfig.app.json`     | TypeScript settings for app code                 |
| `tsconfig.node.json`    | TypeScript settings for Vite config file         |
| `eslint.config.js`      | Code linting rules                               |
| `playwright.config.ts`  | End-to-end test config (Playwright)              |
| `index.html`            | The single HTML file that loads the React app    |

---

# 🔄 Complete User Flows

## Flow 1: Patient Signs Up and Uploads Documents

```
1. Patient visits /signup
2. Enters name, email, password, selects "patient" role
3. Account created in MongoDB (users collection)
4. Patient record auto-created (patients collection)
5. JWT token returned, stored in localStorage
6. Patient navigates to /patient/records
7. Clicks "Upload Document"
8. Selects a PDF or image
9. File goes to backend → uploads to Cloudinary
10. Document saved in MongoDB (documents collection)
```

## Flow 2: Doctor Registers

```
1. Doctor visits /signup
2. Enters name, email, password, selects "doctor" role
3. MUST enter a license number (medical license verification)
4. Account created — NO patient record created for doctors
5. JWT token returned
```

## Flow 3: The QR Code Flow (Core Feature)

```
PATIENT SIDE:
1. Patient logs in
2. Goes to /patient/generate-qr
3. Selects access type (view/write) and duration (e.g., 15 minutes)
4. Selects which documents to share
5. Clicks "Generate QR"
6. Backend creates a session in memory with a unique token
7. QR modal opens showing a QR code containing the session token
8. A countdown timer starts (e.g., 15:00 → 0:00)

DOCTOR SIDE (simultaneously):
1. Doctor logs in
2. Goes to /doctor/scan
3. Camera opens
4. Doctor scans patient's QR code
5. App sends the token to POST /api/session/validate
6. Backend verifies the token → returns sessionId + accessType
7. Doctor is redirected to /doctor/session/:sessionId
8. Doctor sees the shared documents
9. Doctor clicks "Generate Summary" → AI reads documents
10. AI summary appears
11. If accessType = "write", doctor can upload new documents
12. Session expires → doctor is redirected away
```

## Flow 4: Emergency Access

```
1. Patient goes to /patient/emergency
2. Clicks "Edit Profile"
3. Fills in: blood group, allergies, medications, chronic conditions, emergency contact
4. Data saved to patients.emergency in MongoDB
5. Page shows a "Ready" green badge
6. Patient can click "Print" to print the emergency card
7. In a real emergency, first responders open the patient's phone → see this page
```

## Flow 5: Guest (No Account) Upload

```
1. Patient visits app without signing up
2. App generates a random patientId + stores in localStorage
3. Patient uploads documents → stored against this random ID
4. Later, patient signs up with email/password
5. Signup request includes the guestPatientId
6. Backend finds all documents with guestPatientId → updates them to real userId
7. Patient's documents carry over to their account
```

---

# 🌐 All API Endpoints

## Auth
| Method | URL              | Auth Required | Description                  |
|--------|------------------|---------------|------------------------------|
| POST   | `/api/auth/signup` | No          | Register new user            |
| POST   | `/api/auth/login`  | No          | Login, get JWT token         |

## Sessions
| Method | URL                       | Auth Required | Description                         |
|--------|---------------------------|---------------|-------------------------------------|
| POST   | `/api/session/create`     | Yes (patient) | Create authenticated QR session     |
| POST   | `/api/session/create-anon`| No            | Create guest QR session             |
| POST   | `/api/session/validate`   | Yes (doctor)  | Validate scanned QR token           |
| GET    | `/api/session/:id`        | Optional      | Fetch session by ID                 |

## Documents
| Method | URL                                       | Auth Required | Description                        |
|--------|-------------------------------------------|---------------|------------------------------------|
| POST   | `/api/documents/upload/:sessionId`        | Yes (doctor)  | Doctor uploads via QR session      |
| POST   | `/api/documents/upload/by-patient`        | No            | Patient self-upload                |
| GET    | `/api/documents/:sessionId`               | No            | Get docs via session               |
| GET    | `/api/documents/patient/:patientId`       | No            | Get all patient docs               |
| DELETE | `/api/documents/:docId`                   | Yes           | Delete a document                  |
| POST   | `/api/documents/:docId/summarize`         | No            | AI summarize one document          |
| POST   | `/api/documents/patient/:patientId/summary`| Yes          | AI aggregate summary for patient   |

## Patients
| Method | URL                          | Auth Required | Description               |
|--------|------------------------------|---------------|---------------------------|
| GET    | `/api/patients/:patientId`   | No            | Fetch patient profile     |
| PUT    | `/api/patients/:patientId`   | No            | Update patient profile    |

---

# 📦 Key Dependencies

## Backend
| Package          | Why It's Used                                              |
|------------------|------------------------------------------------------------|
| `express`        | Web server framework                                       |
| `mongoose`       | MongoDB object modeling (schemas, queries)                 |
| `bcryptjs`       | Password hashing (never store plain text passwords)        |
| `jsonwebtoken`   | Create + verify JWT auth tokens                            |
| `multer`         | Handle file uploads (multipart/form-data)                  |
| `cloudinary`     | Cloud file storage for documents                           |
| `openai`         | SDK to call Groq AI (using OpenAI-compatible API)          |
| `tesseract.js`   | OCR engine to read text from images                        |
| `pdf-parse`      | Extract text from PDF files                                |
| `axios`          | HTTP client (for fetching PDF buffers from URLs)           |
| `cors`           | Allow React frontend to call the backend                   |
| `dotenv`         | Load environment variables from `.env` file                |

## Frontend
| Package          | Why It's Used                                              |
|------------------|------------------------------------------------------------|
| `react`          | UI library                                                 |
| `react-router-dom`| Client-side routing (URLs without page reloads)           |
| `axios`          | HTTP requests to the backend                               |
| `html5-qrcode`   | Access device camera and scan QR codes                     |
| `vite`           | Fast build tool and dev server                             |
| `typescript`     | Type safety                                                |

---

# 🔑 Environment Variables (`.env`)

The backend needs these environment variables:

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb+srv://...

# Auth
JWT_SECRET=your_super_secret_key

# Cloudinary (file storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI (Groq)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

---

# 🔒 Security Design

| Concern                  | How It's Handled                                              |
|--------------------------|---------------------------------------------------------------|
| Passwords                | Hashed with bcrypt (never stored in plain text)              |
| Auth tokens              | JWT signed with secret, expire in 7 days                     |
| Session tokens           | Random tokens in QR, stored in memory only                   |
| Session expiry           | Time-limited (user-chosen, e.g., 15 min)                     |
| Doctor access control    | Must be logged in + have valid session to view docs           |
| Data ownership           | Documents always tagged to `patientId`, never reassigned to doctors |
| File size limit          | Max 10MB per upload                                          |
| Cloudinary fallback      | If Cloudinary is down, stores base64 in DB (graceful degradation) |
| One session per patient  | Creating a new session auto-deletes the old one              |

---

# 🗃️ Data Flow Summary

```
Patient uploads document:
  Browser → POST /api/documents/upload/by-patient
         → Multer stores in RAM buffer
         → Cloudinary stores file, returns URL
         → MongoDB stores { patientId, url, type }

Doctor scans QR:
  Browser camera → html5-qrcode reads token
               → POST /api/session/validate
               → Backend verifies token → returns sessionId
               → Doctor navigates to session page
               → GET /api/documents/:sessionId
               → Backend looks up session → finds patientId → returns docs

AI Summary:
  POST /api/documents/:docId/summarize
    → Fetch document URL from DB
    → OCR: Tesseract.js reads image text / pdf-parse reads PDF text
    → LLM: text sent to Groq API (LLaMA 3.1)
    → Groq returns bullet-point summary
    → Summary saved to document in MongoDB
    → Returned to frontend
```

---

# 📝 `.bak` Files

Several files have `.bak` duplicates (e.g., `Dashboard.tsx.bak`, `ScanQr.tsx.bak`). These are **manual backups** created before making changes — think of them as "undo" snapshots. They are not used by the app.

---

# 🎯 Summary — What Makes This App Special

1. **QR-based time-limited sharing** — no permanent doctor-patient link, maximum privacy
2. **Guest-to-account document migration** — zero friction for new users
3. **AI medical summarization** — doctors get a quick briefing without reading full documents
4. **Emergency profile** — printable, always accessible, no login required to view
5. **Role-based access** — doctors and patients have completely different apps
6. **Graceful degradation** — works even when Cloudinary is unavailable
7. **In-memory sessions** — fast, no DB queries for session validation, auto-expire

---

*This document was auto-generated by reading every file in the project. Last updated: February 2026.*
