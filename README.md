# SMARTFIX — Smart Maintenance & Predictive Complaint Management

Complete campus facilities maintenance and predictive complaint management platform built with React, Vite, Tailwind CSS, Python Flask, SQLite, and Pillow.

---

## Workspace Structure
- **`backend/`**: Python 3.10+ Flask application with SQLAlchemy ORM, rule-based priority triage, EXIF geo-verification, recurrence detection, SMTP emails, and SQLite database (`maintenance.db`).
- **`SmartFix/`**: React 19 + TypeScript + Vite + Tailwind CSS public and admin frontend.
- **`data/`**: Authoritative `campus_locations.csv` and `seed_complaints.csv`.

---

## Quick Start

### 1. Start the Backend (Port 5000)
```bash
cd backend
pip install -r requirements.txt
python -m app.reset_db
python run.py
```

### 2. Start the Frontend (Port 5173 / 3000)
```bash
cd SmartFix
npm install
npm run dev
```

### 3. Run Backend Test Suite
```bash
cd backend
python -m pytest tests/
```

---

## Documentation
- [API_CONTRACT.md](file:///c:/Users/Soham%20Palkar/OneDrive/Desktop/Hackathon/Bid-to-Build/backend/API_CONTRACT.md) — REST API specifications & schemas.
- [BACKEND_HANDOVER.md](file:///c:/Users/Soham%20Palkar/OneDrive/Desktop/Hackathon/Bid-to-Build/backend/BACKEND_HANDOVER.md) — System architecture, business logic, and database design.