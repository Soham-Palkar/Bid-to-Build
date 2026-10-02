# SmartFix (PS-07) — Backend Integration Contract

Base URL configured via `VITE_API_BASE_URL` (default `/api` or `http://localhost:5000/api`).

---

## 1. Create Complaint
- **Endpoint:** `POST /api/complaints`
- **Authentication:** Public (None)
- **Content-Type:** `multipart/form-data` or `application/json`
- **Request Fields:**
  - `user_id` (string, required) — Student or Staff ID (e.g. `TEIT30`)
  - `name` (string, required) — Reporter full name
  - `email` (string, required) — Reporter campus email
  - `category` (string, required) — `Electrical` | `Plumbing` | `Furniture` | `HVAC` | `Civil / Infrastructure` | `Other`
  - `building` (string, required)
  - `floor` (string, required)
  - `room` (string, required)
  - `description` (string, required)
  - `photo` (File / base64, required)
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "complaint_id": "COM-2026-0001",
  "priority": "Critical",
  "priority_reason": "Electrical safety hazard detected.",
  "location": {
    "name": "Engineering Block — Lab 204",
    "building": "Engineering Block",
    "floor": "Floor 2",
    "room": "Lab 204",
    "verified": true
  },
  "is_recurring": true,
  "previous_complaint_count": 3,
  "status": "Reported"
}
```
- **Error Response (`400 Bad Request`):**
```json
{
  "success": false,
  "message": "All required fields must be provided."
}
```

---

## 2. Track Complaint
- **Endpoint:** `POST /api/complaints/track`
- **Authentication:** Public (Requires matching `complaint_id` + `email`)
- **Request Body:**
```json
{
  "complaint_id": "COM-2026-0001",
  "email": "student@example.com"
}
```
- **Success Response (`200 OK`):**
```json
{
  "complaint_id": "COM-2026-0001",
  "category": "Electrical",
  "location": "Engineering Block — Floor 2, Lab 204",
  "priority": "Critical",
  "status": "In Progress",
  "is_recurring": true,
  "previous_complaint_count": 3,
  "assigned_worker": {
    "id": 1,
    "name": "Raj Kumar",
    "specialization": "Electrical Maintenance"
  },
  "timeline": [
    {
      "status": "Reported",
      "timestamp": "02 Oct, 10:25 AM",
      "note": "Complaint submitted and verified by automated safety rules."
    }
  ]
}
```
- **Error Response (`404 Not Found` / `403 Forbidden`):**
```json
{
  "message": "No complaint found matching ID COM-2026-9999."
}
```

---

## 3. Admin Login
- **Endpoint:** `POST /api/admin/login`
- **Authentication:** Public
- **Request Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "token": "sf-ps07-admin-session-token-2026",
  "admin": {
    "username": "admin",
    "name": "Campus Facilities Director"
  }
}
```
- **Error Response (`401 Unauthorized`):**
```json
{
  "success": false,
  "message": "Invalid admin credentials."
}
```

---

## 4. Admin Dashboard Stats
- **Endpoint:** `GET /api/admin/dashboard`
- **Authentication:** Bearer Token (`Authorization: Bearer <token>`)
- **Success Response (`200 OK`):**
```json
{
  "total": 32,
  "priority": {
    "critical": 3,
    "high": 7,
    "medium": 14,
    "low": 8
  },
  "status": {
    "reported": 8,
    "assigned": 7,
    "in_progress": 9,
    "resolved": 8
  },
  "recurring": 2
}
```

---

## 5. Get Complaints List
- **Endpoint:** `GET /api/admin/complaints`
- **Authentication:** Bearer Token
- **Query Parameters (optional):** `status`, `priority`, `category`, `search`
- **Success Response (`200 OK`):** Array of `Complaint` objects.

---

## 6. Get Complaint Details
- **Endpoint:** `GET /api/admin/complaints/{complaint_id}`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):** Full `Complaint` object including `user`, `location`, `priority`, `priority_reason`, `is_recurring`, `previous_complaint_count`, `assigned_worker`, `status`, and `timeline`.

---

## 7. Assign Worker
- **Endpoint:** `POST /api/admin/complaints/{complaint_id}/assign`
- **Authentication:** Bearer Token
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
    "name": "Raj Kumar",
    "specialization": "Electrical Maintenance",
    "email": "raj.kumar@campus-facilities.edu"
  },
  "email_sent": true
}
```

---

## 8. Update Complaint Status
- **Endpoint:** `PATCH /api/admin/complaints/{complaint_id}/status`
- **Authentication:** Bearer Token
- **Request Body:**
```json
{
  "status": "In Progress"
}
```
- **Allowed Values:** `"Reported"` | `"Assigned"` | `"In Progress"` | `"Resolved"`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "status": "In Progress"
}
```
