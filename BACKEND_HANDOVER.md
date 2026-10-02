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

## 3. Database Schema & Models

- `users`: `id`, `user_identifier`, `name`, `email`, `created_at`
- `admins`: `id`, `username`, `password_hash`, `name`, `created_at`
- `workers`: `id`, `name`, `email`, `specialization`, `phone`, `license`, `duty_id`, `created_at`
- `locations`: `id`, `location_id`, `building`, `floor`, `room`, `location_name`, `latitude`, `longitude`, `radius_m`
- `complaints`: `id`, `complaint_id`, `user_id`, `category`, `description`, `photo_path`, `location_id`, `detected_location_id`, `latitude`, `longitude`, `location_verified`, `priority`, `priority_score`, `priority_reason`, `is_recurring`, `previous_complaint_count`, `assigned_worker_id`, `status`, `confirmation_email_sent`, `created_at`, `updated_at`
- `status_history`: `id`, `complaint_id`, `old_status`, `new_status`, `changed_by`, `notes`, `created_at`

---

## 4. Final Demo Scenario Verification

1. **Student Reporting:**
   - Name: Soham, User ID: 30, Email: `soham@example.com`
   - Category: `Electrical`, Location: `First Floor DB Lab` (`LOC001`)
   - Description: `Sparking from exposed wire near DB Lab switchboard`
   - Image: Geotagged DB Lab evidence photo
   - Result: Public Problem ID `COM-2026-XXXX`, Priority `Critical`, Location `Verified`, Recurring `Yes` (3+ historical records), Confirmation email dispatched.

2. **Admin Dispatch:**
   - Admin logs into Dashboard (`admin` / `admin123`).
   - Views Critical ticket with recurring hazard alert.
   - Assigns `Raj Patil` (Electrical specialist).
   - Worker receives assignment email notification.
   - Transitions status: `Reported` → `Assigned` → `In Progress` → `Resolved`.

3. **Student Tracking:**
   - Student enters Problem ID + `soham@example.com` at `/track`.
   - Inspects full verified lifecycle timeline.
