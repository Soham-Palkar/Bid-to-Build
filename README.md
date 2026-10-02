# SMARTFIX — Smart Maintenance & Predictive Complaint Management

Enterprise campus facilities maintenance and predictive complaint management platform built with React 19, TypeScript, Vite, Tailwind CSS, Python Flask, SQLAlchemy, SQLite, Pillow EXIF extraction, and Gmail SMTP.

---

## Key Features & Hardening

1. **EXIF GPS Telemetry & Geofence Verification:**
   - Extracts `latitude`, `longitude`, `altitude` (in meters), and sea-level references using Pillow EXIF metadata.
   - Computes horizontal distance to the selected campus location using the **Haversine formula**.
   - Verifies coordinates using a strict **5-meter radius threshold** (`radius_m = 5.0`) configured in `campus_locations.csv` and the database.
   - **Authoritative Location Authority:** The user-selected location remains authoritative. GPS serves as an audit signal; mismatches are flagged without destructively altering the complaint's assigned location.

2. **Persistent Image Lifecycle:**
   - Uploaded files and snapshots are saved persistently to `backend/uploads/` with secure UUID-based filenames (`COM-YYYY-XXXX_<uuid>.jpg`).
   - Served directly by Flask via `/uploads/<path:filename>` (`http://localhost:5000/uploads/...`).
   - Images load reliably across browser refreshes, restarts, Admin Details, and Student Tracking views.
   - Supports JPG, JPEG, PNG, and WEBP with a 5 MB upload limit (`MAX_CONTENT_LENGTH=5242880`).

3. **Real SMTP Notifications:**
   - Real Gmail SMTP integration using Google App Passwords.
   - Dispatches confirmation emails to students and assignment notifications to workers with configurable active inboxes.
   - **Fault-Tolerant:** Database transactions are committed before email dispatch. Email failures never roll back valid complaints.

4. **Automated Safety Triage & Recurrence Clustering:**
   - Safety rule engine calculates priority (`Critical`, `High`, `Medium`, `Low`) based on hazard keywords.
   - Spatial cluster engine detects $\ge 3$ repeated complaints for the same `location_id` and category, alerting administrators of underlying infrastructure faults.

---

## Workspace Structure
- **`backend/`**: Python 3.10+ Flask application with SQLAlchemy ORM, EXIF extraction, Haversine verification, email dispatch, and SQLite database (`maintenance.db`).
- **`SmartFix/`**: React 19 + TypeScript + Vite + Tailwind CSS public portal and admin console.
- **`backend/data/`**: Authoritative `campus_locations.csv` (all locations configured with `radius_m = 5`) and `seed_complaints.csv`.

---

## Quick Start Guide

### 1. Configure Environment Variables
Create or verify `backend/.env` (ignored by Git):
```env
FLASK_ENV=development
FLASK_APP=run.py
SECRET_KEY=smartfix-hackathon-supersecret-key-2026

DATABASE_URL=sqlite:///maintenance.db

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_gmail@gmail.com
SMTP_PASSWORD=your_google_app_password
MAIL_FROM=SmartFix Facilities <your_gmail@gmail.com>

WORKER_EMAIL_1=worker1@example.com
WORKER_EMAIL_2=worker2@example.com
WORKER_EMAIL_3=worker3@example.com

UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=5242880
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000
```

### 2. Initialize Database & Run Backend (Port 5000)
```bash
cd backend
pip install -r requirements.txt
python -m app.reset_db
python run.py
```

### 3. Start Frontend Dev Server (Port 5173)
```bash
cd SmartFix
npm install
npm run dev
```

### 4. Run Automated Test Suite
```bash
cd backend
python -m pytest tests/ -v
```

---

## Demo Acceptance Flow

1. **Student Submission (`/`):**
   - Click **"Fill Demo Scenario (DB Lab)"**.
   - Selected: `First Floor DB Lab` (`LOC001`), Category: `Electrical`.
   - Photo: Geotagged evidence image (`19.045266, 72.841845, alt: 12.4m`).
   - Telemetry calculates distance: `0.00 m / 5 m allowed` $\rightarrow$ `✓ Location Verified`.
   - Safety rule triggers `Critical` priority.
   - Submits complaint: receives `COM-2026-XXXX`.
   - Confirmation email sent via SMTP to student.

2. **Admin Review (`/admin/dashboard` & `/admin/complaints`):**
   - Login: `admin` / `admin123`.
   - Views Critical ticket with `GPS Verified` and `Recurring Issue` warning (3 previous electrical complaints at LOC001).
   - Evidence photo loads full size.

3. **Technician Assignment (`/admin/complaints/{id}`):**
   - Admin assigns `Raj Patil`.
   - Backend sends real assignment notice to technician email.
   - Status updates: `Reported` $\rightarrow$ `Assigned` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`.

4. **Student Tracking (`/track`):**
   - Enter Problem ID + `soham@example.com`.
   - Verified timeline, photo, and assigned technician render correctly even after page refresh.

---

## Documentation Links
- [API_CONTRACT.md](file:///c:/Users/Soham%20Palkar/OneDrive/Desktop/Hackathon/Bid-to-Build/API_CONTRACT.md) — REST endpoints and JSON contracts.
- [BACKEND_HANDOVER.md](file:///c:/Users/Soham%20Palkar/OneDrive/Desktop/Hackathon/Bid-to-Build/BACKEND_HANDOVER.md) — Architecture, geofence formulas, and data models.