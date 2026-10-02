# SMARTFIX (PS-07) — REST API Contract

Authoritative specification for SmartFix backend APIs serving Campus Maintenance and Predictive Complaint Management.

---

## Base URLs
- **Backend API:** `http://localhost:5000/api`
- **Frontend App:** `http://localhost:5173` (or port 3000)

---

## 1. System Health Check
- **Method:** `GET`
- **URL:** `/api/health`
- **Authentication:** Public (None)
- **Content-Type:** `application/json`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "service": "SmartFix Backend",
  "status": "healthy"
}
```

---

## 2. Get Authoritative Campus Locations
- **Method:** `GET`
- **URL:** `/api/locations`
- **Authentication:** Public (None)
- **Content-Type:** `application/json`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": 1,
      "location_id": "LOC001",
      "building": "Xavier Institute of Engineering",
      "floor": 1,
      "room": "DB Lab",
      "location_name": "First Floor DB Lab",
      "latitude": 19.045266,
      "longitude": 72.841845,
      "radius_m": 20.0
    },
    {
      "id": 2,
      "location_id": "LOC002",
      "building": "Xavier Institute of Engineering",
      "floor": 1,
      "room": "CC Lab",
      "location_name": "First Floor CC Lab",
      "latitude": 19.045009,
      "longitude": 72.842012,
      "radius_m": 20.0
    },
    {
      "id": 3,
      "location_id": "LOC003",
      "building": "Xavier Institute of Engineering",
      "floor": 1,
      "room": "Software Lab",
      "location_name": "First Floor Software Lab",
      "latitude": 19.045220,
      "longitude": 72.841860,
      "radius_m": 20.0
    },
    {
      "id": 4,
      "location_id": "LOC004",
      "building": "Xavier Institute of Engineering",
      "floor": 1,
      "room": "Men's Washroom",
      "location_name": "First Floor Men's Washroom",
      "latitude": 19.045216,
      "longitude": 72.841769,
      "radius_m": 20.0
    }
  ]
}
```

---

## 3. Submit Maintenance Complaint
- **Method:** `POST`
- **URL:** `/api/complaints`
- **Authentication:** Public (None)
- **Content-Type:** `multipart/form-data` or `application/json`
- **Request Fields:**
  - `user_id` (string, required) — Student/User ID (e.g. `"30"` or `"TEIT30"`)
  - `name` (string, required) — Reporter Name (e.g. `"Soham"`)
  - `email` (string, required) — Reporter Email (e.g. `"soham@example.com"`)
  - `category` (string, required) — `"Electrical"` | `"Plumbing"` | `"Furniture"` | `"HVAC"` | `"Civil / Infrastructure"` | `"Other"`
  - `location_id` (string, required) — Canonical location ID (e.g. `"LOC001"`)
  - `description` (string, required) — Problem description
  - `photo` (binary file, optional) — Incident photo evidence
  - `gps_mode` (string, optional) — `"verified"` | `"mismatch"` | `"none"`
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "complaint_id": "COM-2026-0001",
  "priority": "Critical",
  "priority_reason": "Safety hazard detected (sparking, exposed wire)",
  "detected_keywords": ["sparking", "exposed wire"],
  "location": {
    "name": "First Floor DB Lab",
    "building": "Xavier Institute of Engineering",
    "floor": "Floor 1",
    "room": "DB Lab",
    "location_id": "LOC001",
    "latitude": 19.045266,
    "longitude": 72.841845,
    "verified": true
  },
  "is_recurring": true,
  "previous_complaint_count": 3,
  "status": "Reported",
  "user_email_sent": true,
  "user_email_recipient": "soham@example.com",
  "email_sent_at": "02 Oct 2026, 01:15 PM",
  "email_subject": "SmartFix Complaint Registered — COM-2026-0001",
  "message": "Complaint registered successfully. Confirmation email sent."
}
```

---

## 4. Track Complaint (Student Verification)
- **Method:** `POST`
- **URL:** `/api/complaints/track`
- **Authentication:** Public (Requires matching `complaint_id` + `email`)
- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "complaint_id": "COM-2026-0001",
  "email": "soham@example.com"
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "complaint_id": "COM-2026-0001",
  "category": "Electrical",
  "description": "Sparking from exposed wire near DB Lab switchboard.",
  "location": "First Floor DB Lab — Xavier Institute of Engineering, Floor 1 • DB Lab",
  "location_details": {
    "building": "Xavier Institute of Engineering",
    "floor": "Floor 1",
    "room": "DB Lab",
    "name": "First Floor DB Lab",
    "latitude": 19.045266,
    "longitude": 72.841845,
    "verified": true,
    "location_id": "LOC001"
  },
  "priority": "Critical",
  "priority_reason": "Safety hazard detected (sparking, exposed wire)",
  "status": "In Progress",
  "is_recurring": true,
  "previous_complaint_count": 3,
  "assigned_worker": {
    "id": 1,
    "name": "Raj Patil",
    "specialization": "Electrical",
    "email": "raj.patil@campus.edu",
    "phone": "+91 98200 11223"
  },
  "timeline": [
    {
      "status": "Reported",
      "timestamp": "02 Oct 2026, 01:15 PM",
      "note": "Complaint registered and verified by automated safety rules.",
      "actor": "System"
    }
  ],
  "created_at": "02 Oct 2026, 01:15 PM"
}
```

---

## 5. Admin Authentication
- **Method:** `POST`
- **URL:** `/api/admin/login`
- **Authentication:** Public
- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

---

## 6. Admin Dashboard Metrics
- **Method:** `GET`
- **URL:** `/api/admin/dashboard`
- **Authentication:** Admin Session Token

---

## 7. Assign Maintenance Worker
- **Method:** `POST`
- **URL:** `/api/admin/complaints/{complaint_id}/assign`
- **Authentication:** Admin Session Token
- **Request Body:**
```json
{
  "worker_id": 1
}
```

---

## 8. Update Complaint Status
- **Method:** `PATCH`
- **URL:** `/api/admin/complaints/{complaint_id}/status`
- **Authentication:** Admin Session Token
- **Request Body:**
```json
{
  "status": "In Progress"
}
```
