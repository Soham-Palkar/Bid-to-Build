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
   - The backend computes Haversine distance between photo GPS and target coordinates. If distance $\le$ `radius_m` (5m configured in `campus_locations.csv` and database), `location_verified = True`.
   - In case of a GPS mismatch ($> 5$m), the backend flags `location_verified = False` and records `gps_distance_m`, but preserves the user's selected location without destructive automated overwriting.
   - Pillow extracts `latitude`, `longitude`, and `altitude_m` (in meters). Sea-level reference tags are accounted for.

3. **Persistent Image Lifecycle & URL Separation:**
   - Client uploads (multipart files or base64 data URLs) are decoded and saved directly into `backend/uploads/{complaint_id}_{uuid}.{ext}`.
   - Flask serves the persistent files via `/uploads/<path:filename>` (`http://localhost:5000/uploads/...`).
   - Images remain accessible across browser refreshes, backend restarts, Admin Details, and Student Tracking views.

4. **Complaint & Status Data:**
   - SQLite `complaints` and `status_history` tables represent the single source of truth.
   - Admin dashboard statistics, priority distributions, and recurrence indicators are computed in real time from database queries.
   - **No mock, fake, or hardcoded application data exists in either the backend or the frontend.**

5. **Email Decoupling & Fault Tolerance:**
   - The complaint database transaction is committed **BEFORE** attempting SMTP email delivery.
   - If SMTP is unavailable or delivery fails, the complaint remains saved and valid with `confirmation_email_sent = False`.
   - Email failure never rolls back complaint creation.
   - Worker assignment emails and student confirmation receipts are dispatched using Gmail SMTP with authenticated credentials.

---

## 3. Database Schema & Models

- `users`: `id`, `user_identifier`, `name`, `email`, `created_at`
- `admins`: `id`, `username`, `password_hash`, `name`, `created_at`
- `workers`: `id`, `name`, `email`, `specialization`, `phone`, `license`, `duty_id`, `created_at`
- `locations`: `id`, `location_id`, `building`, `floor`, `room`, `location_name`, `latitude`, `longitude`, `radius_m` (all approved campus locations set to `5.0m`)
- `complaints`: `id`, `complaint_id`, `user_id`, `category`, `description`, `photo_path`, `photo_filename`, `photo_size`, `location_id`, `detected_location_id`, `latitude`, `longitude`, `altitude_m`, `location_verified`, `gps_distance_m`, `gps_radius_m`, `priority`, `priority_score`, `priority_reason`, `detected_keywords`, `is_recurring`, `previous_complaint_count`, `assigned_worker_id`, `status`, `confirmation_email_sent`, `confirmation_email_error`, `created_at`, `updated_at`
- `status_history`: `id`, `complaint_id`, `old_status`, `new_status`, `changed_by`, `notes`, `created_at`

---

## 4. Final Demo Scenario Verification

1. **Student Reporting (`/`):**
   - Name: Soham, User ID: 30, Email: `soham@example.com`
   - Category: `Electrical`, Location: `First Floor DB Lab` (`LOC001`)
   - Description: `Sparking from exposed wire near DB Lab switchboard`
   - Image: Geotagged DB Lab evidence photo (`19.045266, 72.841845, alt: 12.4m`)
   - Haversine Distance: `0.00 m` $\le$ `5.0 m` $\rightarrow$ `✓ Location Verified`
   - Result: Public Problem ID `COM-2026-XXXX`, Priority `Critical`, Location `Verified`, Recurring `Yes` (3+ historical records), Confirmation email dispatched.

2. **Admin Dispatch (`/admin/dashboard` & `/admin/complaints`):**
   - Admin logs into Dashboard (`admin` / `admin123`).
   - Views Critical ticket with recurring hazard alert.
   - Assigns `Raj Patil` (Electrical specialist).
   - Worker receives assignment email notification.
   - Transitions status: `Reported` → `Assigned` → `In Progress` → `Resolved`.

3. **Student Tracking (`/track`):**
   - Student enters Problem ID + `soham@example.com` at `/track`.
   - Inspects full verified lifecycle timeline and photographic evidence.
