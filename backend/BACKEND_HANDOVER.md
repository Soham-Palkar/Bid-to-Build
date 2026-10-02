# SMARTFIX (PS-07) — Backend Handover & Technical Architecture

## 1. System Architecture Overview

SmartFix is an enterprise campus facilities maintenance and predictive complaint management system. It bridges student issue reporting with automated safety triage, EXIF geo-telemetry verification, recurrence clustering, and technician dispatch workflows.

```
campus_locations.csv
        ↓
SQLite locations table
        ↓
GET /api/locations
        ↓
React LocationSelector
        ↓
User selects location_id (e.g. LOC001)
        ↓
POST /api/complaints
        ↓
Backend resolves location & validates data
        ↓
Photo EXIF GPS extraction & verification (Haversine distance)
        ↓
Rule-based Priority Assessment (Critical / High / Medium / Low)
        ↓
Recurrence Detection (Key: location_id + category >= 3 complaints)
        ↓
Database transaction committed (Problem ID: COM-YYYY-XXXX)
        ↓
Student confirmation email dispatched
        ↓
Admin Dashboard metrics & work orders
        ↓
Worker Assignment (specialist email alert)
        ↓
Status Lifecycle (Reported → Assigned → In Progress → Resolved)
        ↓
Student Tracking (Problem ID + Student Email)
```

---

## 2. Single Source of Truth Principles

1. **Campus Locations:**
   - `location_id` (e.g., `LOC001`, `LOC002`, `LOC003`, `LOC004`) is the canonical campus location identifier.
   - Populated directly from `data/campus_locations.csv`.
   - The user selects a location through the `LocationSelector` dropdown rather than typing freeform building/floor/room strings.

2. **Authoritative Location vs GPS Verification:**
   - **The user-selected location is ALWAYS authoritative.**
   - Photo GPS coordinates are treated as an audit and verification signal.
   - The backend computes Haversine distance between photo GPS and target coordinates. If distance $\le$ `radius_m` (20m), `location_verified = True`.
   - In case of a GPS mismatch, the backend flags `location_verified = False` but preserves the user's selected location without destructive automated overwriting.

3. **Complaint & Status Data:**
   - SQLite `complaints` and `status_history` tables represent the single source of truth.
   - Admin dashboard statistics, priority distributions, and recurrence indicators are computed in real time from database queries.
   - **No mock, fake, or hardcoded application data exists in either the backend or the frontend.**

4. **Email Decoupling & Fault Tolerance:**
   - The complaint database transaction is committed **BEFORE** attempting SMTP email delivery.
   - If SMTP is unavailable or delivery fails, the complaint remains saved and valid with `confirmation_email_sent = False`.
   - Email failure never rolls back complaint creation.

---

## 3. Database Schema

- **`users`**:
  - `id` (INTEGER PRIMARY KEY)
  - `user_identifier` (VARCHAR(64), indexed)
  - `name` (VARCHAR(128))
  - `email` (VARCHAR(128), indexed)
  - `created_at` (DATETIME)

- **`admins`**:
  - `id` (INTEGER PRIMARY KEY)
  - `username` (VARCHAR(64) UNIQUE)
  - `password_hash` (VARCHAR(256), Werkzeug hashed)
  - `name` (VARCHAR(128))
  - `created_at` (DATETIME)

- **`workers`**:
  - `id` (INTEGER PRIMARY KEY)
  - `name` (VARCHAR(128))
  - `email` (VARCHAR(128))
  - `specialization` (VARCHAR(64))
  - `phone` (VARCHAR(32))
  - `license` (VARCHAR(64))
  - `duty_id` (VARCHAR(32))
  - `created_at` (DATETIME)

- **`locations`**:
  - `id` (INTEGER PRIMARY KEY)
  - `location_id` (VARCHAR(32) UNIQUE)
  - `building` (VARCHAR(128))
  - `floor` (INTEGER)
  - `room` (VARCHAR(64))
  - `location_name` (VARCHAR(128))
  - `latitude` (FLOAT)
  - `longitude` (FLOAT)
  - `radius_m` (FLOAT, default 20.0)

- **`complaints`**:
  - `id` (INTEGER PRIMARY KEY)
  - `complaint_id` (VARCHAR(64) UNIQUE, e.g. `COM-2026-0001`)
  - `user_id` (INTEGER FOREIGN KEY -> `users.id`)
  - `category` (VARCHAR(64))
  - `description` (TEXT)
  - `photo_path` (VARCHAR(256))
  - `photo_filename` (VARCHAR(128))
  - `photo_size` (VARCHAR(32))
  - `location_id` (VARCHAR(32) FOREIGN KEY -> `locations.location_id`)
  - `detected_location_id` (VARCHAR(32))
  - `latitude` (FLOAT)
  - `longitude` (FLOAT)
  - `location_verified` (BOOLEAN)
  - `priority` (VARCHAR(32))
  - `priority_score` (INTEGER, 0-100)
  - `priority_reason` (VARCHAR(256))
  - `detected_keywords` (VARCHAR(256))
  - `is_recurring` (BOOLEAN)
  - `previous_complaint_count` (INTEGER)
  - `assigned_worker_id` (INTEGER FOREIGN KEY -> `workers.id`)
  - `status` (VARCHAR(32), default 'Reported')
  - `confirmation_email_sent` (BOOLEAN)
  - `confirmation_email_error` (VARCHAR(256))
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

- **`status_history`**:
  - `id` (INTEGER PRIMARY KEY)
  - `complaint_id` (VARCHAR(64) FOREIGN KEY -> `complaints.complaint_id`)
  - `old_status` (VARCHAR(32))
  - `new_status` (VARCHAR(32))
  - `changed_by` (VARCHAR(128))
  - `notes` (VARCHAR(256))
  - `created_at` (DATETIME)

---

## 4. Priority Engine Specification

Evaluated in `services/priority_service.py` using safety keyword patterns with mandatory safety precedence:

1. **Critical (Score 90–100):**
   - Keywords: `sparking`, `spark`, `fire`, `smoke`, `electric shock`, `shock`, `exposed wire`, `exposed wiring`, `short circuit`, `gas leak`, `major flooding`, `electrical hazard`, `burning smell`
2. **High (Score 60–89):**
   - Keywords: `major leak`, `water leakage`, `broken glass`, `unsafe door`, `large damage`, `ac failure`, `ceiling leak`, `burst pipe`, `flooding`
3. **Medium (Score 30–59):**
   - Keywords: `fan not working`, `light not working`, `minor leakage`, `broken chair`, `broken table`, `flickering`, `clogged`, `drainage`
4. **Low (Score 0–29):**
   - Keywords: `paint`, `cosmetic`, `minor scratch`, `small furniture issue`, `peeling`, `wall plaster`

Safety-critical keywords always override weaker predictions.

---

## 5. Recurrence Detection Engine

- **Primary Cluster Key:** `location_id` + `category`
- **Recurrence Threshold:** $\ge 3$ prior complaints
- When a complaint is submitted, the backend counts existing complaints with identical `location_id` and `category`. If $\ge 3$, `is_recurring = True` and `previous_complaint_count = count`.

---

## 6. Seed Dataset

- **Campus Locations (`campus_locations.csv`):**
  - `LOC001`: Xavier Institute of Engineering, Floor 1, DB Lab (19.045266, 72.841845, 20m)
  - `LOC002`: Xavier Institute of Engineering, Floor 1, CC Lab (19.045009, 72.842012, 20m)
  - `LOC003`: Xavier Institute of Engineering, Floor 1, Software Lab (19.045220, 72.841860, 20m)
  - `LOC004`: Xavier Institute of Engineering, Floor 1, Men's Washroom (19.045216, 72.841769, 20m)

- **Admin Account:**
  - Username: `admin`
  - Password: `admin123` (or `password`)

- **Workers:**
  - `Raj Patil` (Electrical)
  - `Amit Shah` (Plumbing)
  - `Neha Joshi` (HVAC)

- **Historical Seed Complaints (`seed_complaints.csv`):**
  - 3 Electrical complaints at `LOC001` (DB Lab)
  - 3 Plumbing complaints at `LOC004` (Men's Washroom)
  - Additional baseline complaints across other labs

---

## 7. Setup & Execution Commands

### Reset & Seed Database
```bash
python -m app.reset_db
```
or
```bash
python -m app.seed
```

### Run Backend Server
```bash
python run.py
```
Starts backend on `http://localhost:5000`.

### Run Automated Tests
```bash
python -m pytest tests/
```
