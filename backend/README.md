# SMARTFIX — Backend & Maintenance Management System

> **Campus Maintenance & Predictive Complaint Management System**  
> Built for Xavier Institute of Engineering hackathon demonstration.

---

## Features
- **Authoritative Campus Locations:** Populated dynamically from `campus_locations.csv` into SQLite (`maintenance.db`).
- **Dynamic Location Selection:** Canonical `location_id` reference; no manual text input for campus buildings/floors/rooms.
- **Automated Safety Triage:** Keyword & category priority engine with safety hazard overrides (Critical / High / Medium / Low).
- **EXIF GPS Verification:** Extracts photo GPS using Pillow and computes Haversine distance against campus geofences.
- **Recurrence Engine:** Identifies spatial and category recurring failure clusters ($\ge 3$ complaints).
- **Sequential Public Problem IDs:** Formatted dynamically as `COM-YYYY-XXXX`.
- **Fault-Tolerant Email Notifications:** SMTP dispatch with simulation fallback for student registration and worker assignment.
- **Admin Command Console:** Real-time SQLite metrics, ticket filtering, worker dispatch, and multi-stage status lifecycle.
- **Privacy-Preserving Student Tracking:** Requires both `Problem ID` + `Student Email`.

---

## Tech Stack
- **Python:** 3.10+
- **Backend Framework:** Flask 3.0, Flask-SQLAlchemy, Flask-CORS
- **Database:** SQLite (`maintenance.db`)
- **Image & Geo Processing:** Pillow (PIL)
- **Security:** Werkzeug password hashing
- **Testing:** Pytest

---

## Directory Structure
```text
backend/
├── app/
│   ├── __init__.py           # Flask app factory
│   ├── config.py             # Environment & configuration
│   ├── extensions.py         # SQLAlchemy & CORS
│   ├── reset_db.py           # Clean database reset utility
│   ├── seed.py               # Controlled seed data script
│   │
│   ├── models/               # SQLAlchemy ORM Models
│   │   ├── admin.py
│   │   ├── complaint.py
│   │   ├── location.py
│   │   ├── status_history.py
│   │   ├── user.py
│   │   └── worker.py
│   │
│   ├── routes/               # REST API Blueprints
│   │   ├── admin.py
│   │   ├── complaints.py
│   │   ├── locations.py
│   │   └── tracking.py
│   │
│   ├── services/             # Core Business Logic Services
│   │   ├── complaint_service.py
│   │   ├── email_service.py
│   │   ├── exif_service.py
│   │   ├── location_service.py
│   │   ├── priority_service.py
│   │   └── recurrence_service.py
│   │
│   └── utils/
│       ├── complaint_id.py
│       └── validators.py
│
├── data/
│   ├── campus_locations.csv  # Authoritative campus geodata
│   └── seed_complaints.csv   # Historical baseline complaints
│
├── tests/
│   └── test_backend.py       # Automated test suite
│
├── uploads/                  # Uploaded photo storage
├── .env.example
├── .env
├── requirements.txt
├── run.py                    # Entry point (Port 5000)
├── API_CONTRACT.md
└── BACKEND_HANDOVER.md
```

---

## Quick Start Guide

### 1. Virtual Environment & Dependencies
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Reset & Seed Database
```bash
python -m app.reset_db
```
*Note: This imports the 4 approved campus locations (`LOC001`, `LOC002`, `LOC003`, `LOC004`), creates the admin user (`admin` / `admin123`), seeds the 3 maintenance specialists, and populates historical complaints for recurrence demonstration.*

### 4. Run the Backend
```bash
python run.py
```
Backend will be available at: `http://localhost:5000`

### 5. Run Automated Tests
```bash
python -m pytest tests/
```

---

## Demo Credentials & Data
- **Admin Username:** `admin`
- **Admin Password:** `admin123` (or `password`)
- **Historical Recurrence Demo:**
  - `LOC001` (DB Lab) + `Electrical` (Already has 3 historical complaints in seed dataset)
  - Submitting a new Electrical complaint for `First Floor DB Lab` immediately flags **Recurring Issue: 3+ previous complaints**.
