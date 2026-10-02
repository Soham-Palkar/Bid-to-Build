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
- **Error Response (`400 Bad Request`):**
```json
{
  "success": false,
  "error": "Student / User ID is required."
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
  "photo_url": "/uploads/COM-2026-0001_8b31a0fc.jpg",
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
    "phone": "+91 98200 11223",
    "duty_id": "DUTY-W01",
    "active_jobs": 1
  },
  "timeline": [
    {
      "status": "Reported",
      "timestamp": "02 Oct 2026, 01:15 PM",
      "note": "Complaint registered and verified by automated safety rules.",
      "actor": "System"
    },
    {
      "status": "Assigned",
      "timestamp": "02 Oct 2026, 01:25 PM",
      "note": "Assigned to Raj Patil (Electrical).",
      "actor": "Admin"
    },
    {
      "status": "In Progress",
      "timestamp": "02 Oct 2026, 01:40 PM",
      "note": "Technician arrived on-site and initiated wire replacement.",
      "actor": "Admin"
    }
  ],
  "created_at": "02 Oct 2026, 01:15 PM"
}
```
- **Error Response (`403 Forbidden` / `404 Not Found`):**
```json
{
  "success": false,
  "error": "Email address does not match the registered record for this Problem ID."
}
```

---

## 5. Photo Location Detection Preview
- **Method:** `POST`
- **URL:** `/api/complaints/detect-location`
- **Authentication:** Public (None)
- **Request Body:**
```json
{
  "location_id": "LOC001",
  "gps_mode": "verified"
}
```
- **Success Response (`200 OK`):**
```json
{
  "has_gps": true,
  "latitude": 19.045266,
  "longitude": 72.841845,
  "user_selected": "First Floor DB Lab",
  "detected_building": "Xavier Institute of Engineering",
  "detected_floor": "Floor 1",
  "detected_room": "DB Lab",
  "detected_name": "First Floor DB Lab",
  "verified": true
}
```

---

## 6. Admin Authentication
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
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "token": "sf-admin-token-admin-1790924000",
  "admin": {
    "id": 1,
    "username": "admin",
    "name": "Campus Facilities Director"
  }
}
```
- **Error Response (`401 Unauthorized`):**
```json
{
  "success": false,
  "error": "Invalid admin credentials."
}
```

---

## 7. Admin Dashboard Metrics
- **Method:** `GET`
- **URL:** `/api/admin/dashboard`
- **Authentication:** Admin Session Token
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "total": 11,
  "priority": {
    "critical": 1,
    "high": 4,
    "medium": 5,
    "low": 1
  },
  "status": {
    "reported": 1,
    "assigned": 0,
    "in_progress": 0,
    "resolved": 10
  },
  "recurring": 1,
  "recurring_clusters": [
    {
      "cluster_id": "#CL-LOC001-ELEC",
      "complaint_id": "COM-2026-0001",
      "location_label": "DB Lab — Xavier Institute of Engineering",
      "building": "Xavier Institute of Engineering",
      "room": "DB Lab",
      "category": "Electrical",
      "count": 4,
      "summary": "Repeated Electrical failure logged at First Floor DB Lab.",
      "severity": "Critical"
    }
  ],
  "last_updated": "01:15 PM"
}
```

---

## 8. Get Complaints Registry List
- **Method:** `GET`
- **URL:** `/api/admin/complaints`
- **Authentication:** Admin Session Token
- **Query Parameters (optional):**
  - `status` (`Reported` | `Assigned` | `In Progress` | `Resolved`)
  - `priority` (`Critical` | `High` | `Medium` | `Low`)
  - `category` (`Electrical` | `Plumbing` | `Furniture` | `HVAC` | `Civil / Infrastructure`)
  - `location_id` (`LOC001` | `LOC002` | `LOC003` | `LOC004`)
  - `search` (string)
- **Success Response (`200 OK`):** Array of full `Complaint` JSON objects.

---

## 9. Get Single Complaint Details
- **Method:** `GET`
- **URL:** `/api/admin/complaints/{complaint_id}`
- **Authentication:** Admin Session Token
- **Success Response (`200 OK`):** Full `Complaint` JSON object.

---

## 10. List Maintenance Workers
- **Method:** `GET`
- **URL:** `/api/admin/workers`
- **Authentication:** Admin Session Token
- **Success Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "name": "Raj Patil",
    "email": "raj.patil@campus.edu",
    "specialization": "Electrical",
    "phone": "+91 98200 11223",
    "license": "LIC-ELE-8821",
    "duty_id": "DUTY-W01",
    "active_jobs": 0
  },
  {
    "id": 2,
    "name": "Amit Shah",
    "email": "amit.shah@campus.edu",
    "specialization": "Plumbing",
    "phone": "+91 98200 44556",
    "license": "LIC-PLU-4012",
    "duty_id": "DUTY-W02",
    "active_jobs": 0
  },
  {
    "id": 3,
    "name": "Neha Joshi",
    "email": "neha.joshi@campus.edu",
    "specialization": "HVAC",
    "phone": "+91 98200 77889",
    "license": "LIC-HVA-6503",
    "duty_id": "DUTY-W03",
    "active_jobs": 0
  }
]
```

---

## 11. Assign Maintenance Worker
- **Method:** `POST`
- **URL:** `/api/admin/complaints/{complaint_id}/assign`
- **Authentication:** Admin Session Token
- **Request Body:**
```json
{
  "worker_id": 1
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "status": "Assigned",
  "worker": {
    "id": 1,
    "name": "Raj Patil",
    "specialization": "Electrical",
    "email": "raj.patil@campus.edu"
  },
  "email_sent": true,
  "message": "Assigned to Raj Patil. Email dispatched."
}
```

---

## 12. Update Complaint Workflow Status
- **Method:** `PATCH`
- **URL:** `/api/admin/complaints/{complaint_id}/status`
- **Authentication:** Admin Session Token
- **Request Body:**
```json
{
  "status": "In Progress"
}
```
- **Allowed Statuses:** `"Reported"` | `"Assigned"` | `"In Progress"` | `"Resolved"`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "status": "In Progress",
  "complaint": { ... }
}
```
