# PRD — Smart Maintenance & Predictive Complaint Management

**Problem Statement:** PS-07  
**Project Type:** Smart Maintenance / Complaint Management Platform  
**Prototype Constraint:** 4-hour hackathon prototype  
**Primary Users:** Students / Users, Admin, Maintenance Workers

---

# 1. Product Overview

## 1.1 Product Name

**SmartFix — Smart Maintenance & Predictive Complaint Management**

The system is a web-based maintenance complaint platform that allows students or users to report campus maintenance problems, enables administrators to assign and track those complaints, and uses complaint information to identify urgent and recurring maintenance issues.

The system combines:

- Complaint management
- Automatic priority detection
- Geotagged-photo location verification
- Recurring issue detection
- Worker assignment
- Email notifications
- Complaint tracking
- Maintenance analytics

The objective is not to build a generic grievance portal. The system should demonstrate how historical complaints and location information can help maintenance teams identify **urgent and recurring infrastructure problems**.

---

# 2. Problem Statement

Campus maintenance complaints are often handled through disconnected channels such as phone calls, messages, registers, or informal communication.

This creates several problems:

1. Complaints can be lost or forgotten.
2. There is no centralized complaint status.
3. Critical problems may be treated like normal maintenance requests.
4. Repeated problems at the same location may not be recognized.
5. Administrators may not know which worker is handling a complaint.
6. Students may not know whether their complaint has been resolved.
7. Historical complaint information is not effectively used.

The proposed platform provides a centralized workflow:

```text
Complaint
    ↓
Priority Detection
    ↓
Location Identification
    ↓
Recurrence Detection
    ↓
Admin Assignment
    ↓
Worker Notification
    ↓
Progress Tracking
    ↓
Resolution
```

---

# 3. Product Objective

The prototype must demonstrate a complete complaint lifecycle:

```text
User raises complaint
        ↓
Complaint ID generated
        ↓
System determines priority
        ↓
Location identified
        ↓
Previous complaints checked
        ↓
Admin receives complaint
        ↓
Admin assigns worker
        ↓
Worker receives email
        ↓
Complaint status updated
        ↓
User tracks progress
        ↓
Complaint resolved
```

The system should particularly demonstrate:

> **Critical complaint + location verification + recurring issue detection + worker assignment.**

---

# 4. Goals

## 4.1 Primary Goals

1. Allow users to create maintenance complaints.
2. Generate a unique Complaint ID.
3. Allow users to track complaint status.
4. Allow administrators to view and manage complaints.
5. Allow administrators to assign maintenance workers.
6. Support the required status workflow.
7. Automatically determine complaint priority.
8. Extract GPS information from geotagged photographs.
9. Match GPS coordinates to predefined campus locations.
10. Detect recurring problems using location and category.
11. Send email notifications when work is assigned.
12. Provide a visual maintenance dashboard.

---

# 5. Non-Goals

The following are explicitly **out of scope for the 4-hour MVP**:

- Native Android/iOS application
- Complex student authentication
- Worker authentication
- LLM chatbot
- Training an ML model from scratch
- Large-scale predictive maintenance forecasting
- IoT sensors
- Computer vision for identifying electrical/plumbing faults
- Google Maps integration
- Real-time GPS tracking of workers
- Push notifications
- Complex RBAC system
- Enterprise-scale deployment
- Advanced machine-learning pipelines
- Automatic building-floor detection using computer vision

---

# 6. User Roles

The prototype has three logical roles.

## 6.1 Student / User

The student does **not require an account** for the MVP.

The student can:

- Submit a complaint
- Upload a photo
- Enter/select location
- Provide description
- Receive Complaint ID
- Track complaint using Complaint ID + email

### Student Authentication

**No login required.**

This reduces development time.

---

# 6.2 Admin

Admin is the only authenticated role in the MVP.

Admin can:

- Login
- View all complaints
- Filter complaints
- View complaint details
- View uploaded photographs
- View detected GPS location
- View priority
- View recurring issue information
- Assign workers
- Change complaint status
- View dashboard analytics

---

# 6.3 Maintenance Worker

Workers do not require separate login credentials in the MVP.

Admin assigns a worker to a complaint.

The assigned worker receives an email containing:

- Complaint ID
- Category
- Priority
- Location
- Description
- Assignment information

For the 4-hour prototype, the admin can update the worker's complaint status.

A dedicated worker portal is optional and out of MVP scope.

---

# 7. Complaint Lifecycle

The required status workflow is:

```text
REPORTED
    ↓
ASSIGNED
    ↓
IN PROGRESS
    ↓
RESOLVED
```

## 7.1 Reported

Complaint has been successfully submitted but no worker has been assigned.

## 7.2 Assigned

Admin has assigned the complaint to a maintenance worker.

## 7.3 In Progress

Maintenance worker has started working on the issue.

## 7.4 Resolved

The maintenance problem has been fixed.

---

# 8. User Complaint Flow

## Step 1 — Open Complaint Form

User opens:

**Report a Maintenance Problem**

---

## Step 2 — Enter User Information

Required:

- Student/User ID
- Name
- Email

The email is used for complaint tracking and notifications where applicable.

---

## Step 3 — Enter Complaint Information

Required:

- Category
- Location
- Description
- Photo

### Categories

Initial categories:

```text
Electrical
Plumbing
Furniture
HVAC
Civil / Infrastructure
Other
```

---

# 9. Location System

The location system uses **two sources**:

1. User-entered location
2. GPS extracted from the uploaded photograph

---

## 9.1 User-Entered Location

The user selects:

```text
Building
Floor
Room / Lab
```

Example:

```text
Building: Engineering Block
Floor: 2
Room: Lab 204
```

---

## 9.2 Geotagged Photo

The user uploads an original camera image.

The backend attempts to extract GPS information from EXIF metadata.

Example:

```text
Latitude: 19.12345
Longitude: 72.87654
```

The system then compares the coordinates against predefined campus locations.

---

# 10. Campus Location Mapping

A predefined location table will store known campus locations.

Example:

| Location ID | Building | Floor | Room | Latitude | Longitude |
|---|---|---|---|---:|---:|
| LAB201 | Engineering Block | 2 | Lab 201 | 19.12310 | 72.87610 |
| LAB202 | Engineering Block | 2 | Lab 202 | 19.12320 | 72.87620 |
| LAB204 | Engineering Block | 2 | Lab 204 | 19.12345 | 72.87654 |
| ADM101 | Admin Block | 1 | Room 101 | 19.12410 | 72.87710 |

The system calculates the distance between uploaded GPS coordinates and known locations.

The closest matching location is selected if it falls within the configured campus radius.

---

# 11. Location Confirmation

The system must not blindly trust GPS.

Example:

```text
User entered:
Engineering Block - Lab 204

GPS detected:
Engineering Block - Lab 204

Result:
✓ Location verified
```

If there is a mismatch:

```text
User selected:
Lab 204

GPS indicates:
Lab 203

Result:
⚠ Location mismatch
```

The user/admin can retain the manually selected location.

---

# 12. GPS Fallback

GPS is not guaranteed to exist in every image.

Possible reasons:

- Location services disabled
- Screenshot
- Image edited
- EXIF metadata removed
- Image transferred through a platform that strips metadata

Therefore:

```text
IF GPS exists
    → Extract GPS
    → Match campus location
ELSE
    → Use user-entered location
```

The application must never reject a complaint simply because GPS metadata is unavailable.

---

# 13. Automatic Priority Detection

The PS requires four priority levels:

```text
Low
Medium
High
Critical
```

The prototype will use a hybrid approach.

## 13.1 AI Classification

A suitable Hugging Face-compatible text classification / zero-shot classification model may be used to classify the complaint description.

Example:

```text
Input:
"Sparking from exposed electrical wire near Lab 204"

Possible labels:
Low
Medium
High
Critical
```

Model output:

```text
Critical
```

---

# 13.2 Safety Keyword Engine

A deterministic rule engine will act as a reliable fallback and safety override.

### Critical keywords

Examples:

```text
sparking
fire
smoke
electric shock
exposed wire
short circuit
gas leak
flooding
major electrical hazard
```

### High-priority keywords

Examples:

```text
major leak
broken glass
water leakage
AC failure
unsafe door
large damage
```

### Medium-priority keywords

Examples:

```text
fan not working
light not working
minor leakage
broken chair
```

### Low-priority keywords

Examples:

```text
paint issue
minor cosmetic damage
small furniture issue
```

---

# 14. Priority Logic

The final priority is determined using the following strategy:

```text
Complaint Description
        ↓
AI Classification
        ↓
Safety Keyword Detection
        ↓
Final Priority
```

Safety-critical keywords can override the model.

Example:

```text
Model:
High

Keyword engine:
"sparking" detected

Final:
CRITICAL
```

This prevents the prototype from depending completely on model predictions.

---

# 15. Priority Explanation

The system should show the reason for the assigned priority.

Example:

```text
Priority: CRITICAL

Reason:
Electrical safety hazard detected.

Detected keywords:
- sparking
- exposed wire
```

This improves transparency during the demonstration.

---

# 16. Recurring Issue Detection

Recurring issue detection is one of the main intelligence features.

The system compares:

```text
Location ID
+
Complaint Category
```

Example:

```text
Complaint #101
LAB204 + Electrical

Complaint #117
LAB204 + Electrical

Complaint #143
LAB204 + Electrical
```

The system generates:

> ⚠ Recurring Electrical Issue Detected

---

# 17. Recurrence Rule

For the MVP:

```text
IF
current_location_id == previous_location_id
AND
current_category == previous_category
AND
previous_complaint_count >= configured threshold

THEN
recurring_issue = TRUE
```

Suggested initial threshold:

```text
3 complaints
```

Therefore:

```text
Same location
+
Same category
+
3 or more complaints
=
Recurring issue
```

---

# 18. Optional GPS-Based Recurrence

If a location ID is unavailable, GPS coordinates can also be compared.

Example:

```text
Current GPS
    ↓
Find complaints within 20 metres
    ↓
Filter same category
    ↓
Count previous complaints
```

This should be secondary to the campus `location_id`.

---

# 19. Complaint ID

Every complaint receives a unique identifier.

Example:

```text
COM-2026-0001
COM-2026-0002
COM-2026-0003
```

The Complaint ID is displayed immediately after submission.

Example:

> **Complaint submitted successfully.**  
> Your Complaint ID is **COM-2026-0001**.

---

# 20. Complaint Tracking

Users can access a simple tracking page.

Input:

```text
Complaint ID
Email
```

Example:

```text
Complaint ID: COM-2026-0001
Email: student@example.com
```

Output:

```text
Complaint: COM-2026-0001

Category: Electrical
Location: Engineering Block - Lab 204
Priority: Critical

Status:
✓ Reported
✓ Assigned
● In Progress
○ Resolved
```

---

# 21. Admin Dashboard

The admin dashboard is the central management interface.

## 21.1 Summary Cards

```text
Total Complaints
Critical
High
Medium
Low
Reported
Assigned
In Progress
Resolved
Recurring Issues
```

---

# 22. Dashboard Example

```text
=========================================
       SMART MAINTENANCE DASHBOARD
=========================================

Total Complaints       32

Critical               3
High                   7
Medium                 14
Low                    8

Reported               8
Assigned               7
In Progress            9
Resolved               8

Recurring Issues       4
=========================================
```

---

# 23. Complaint Table

Admin can see:

| Complaint ID | Category | Location | Priority | Worker | Status |
|---|---|---|---|---|---|
| COM-001 | Electrical | Lab 204 | Critical | Raj | In Progress |
| COM-002 | Plumbing | Room 101 | High | Amit | Assigned |
| COM-003 | Furniture | Lab 201 | Low | — | Reported |

---

# 24. Complaint Details

Admin can open a complaint and see:

```text
Complaint ID
User ID
User Name
Email

Category
Description
Photo

User Location
GPS Coordinates
Detected Location
Location Verification

Priority
Priority Reason

Recurring Issue
Previous Complaint Count

Assigned Worker
Status

Created At
Updated At
```

---

# 25. Worker Assignment

Admin selects:

```text
Complaint:
COM-2026-0001

Worker:
Raj Kumar

Assignment:
Electrical Maintenance
```

When assignment is confirmed:

```text
Complaint Status:
Reported → Assigned
```

---

# 26. Email Notification

When a worker is assigned, the backend sends an email.

### Email contains:

```text
Subject:
New Maintenance Complaint Assigned - COM-2026-0001

Complaint ID:
COM-2026-0001

Category:
Electrical

Priority:
Critical

Location:
Engineering Block - Lab 204

Description:
Sparking from exposed wiring near switchboard.

Status:
Assigned
```

SMTP will be used for the prototype.

---

# 27. Recommended Technology Stack

## Frontend

**React + Vite + Tailwind CSS**

Responsibilities:

- Complaint form
- Tracking page
- Admin login
- Admin dashboard
- Complaint details
- Worker assignment
- Status updates
- Visual priority indicators

---

## Backend

**Python Flask**

Recommended because the team can implement REST APIs quickly.

Responsibilities:

- Complaint APIs
- Admin authentication
- Database operations
- Image upload
- EXIF extraction
- Priority engine
- Recurrence engine
- Worker assignment
- Email service

---

## Database

**SQLite**

Suitable for the 4-hour prototype.

Stores:

- Users
- Admin
- Workers
- Complaints
- Locations
- Assignments
- Status history

No production-scale database is required for the prototype.

---

## Image Processing

**Pillow**

Used to:

- Open uploaded image
- Read EXIF metadata
- Extract GPS information
- Extract timestamp where available

---

## Geospatial Processing

A lightweight Haversine-distance implementation can be used.

Purpose:

```text
GPS coordinates
        ↓
Distance to campus locations
        ↓
Nearest location
```

No Google Maps API is required.

---

## AI / ML

**Hugging Face-compatible pretrained model**

Potential purpose:

```text
Complaint description
        ↓
Text classification
        ↓
Priority
```

The model must not become a hard dependency for the core application.

If inference fails:

```text
Hugging Face unavailable
        ↓
Keyword/rule engine
        ↓
Priority still generated
```

---

## Email

**SMTP**

Possible implementation:

```text
Python smtplib
```

or a suitable email library.

For development, Gmail SMTP with an App Password or another SMTP provider can be used.

---

# 28. System Architecture

```text
                         USER
                          │
                          ▼
                ┌──────────────────┐
                │ Complaint Form   │
                │                  │
                │ User Details     │
                │ Category         │
                │ Location         │
                │ Description      │
                │ Photo            │
                └────────┬─────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ React/Vite    │
                 │ Frontend      │
                 └───────┬───────┘
                         │ REST API
                         ▼
                 ┌───────────────┐
                 │ Flask Backend │
                 └───────┬───────┘
                         │
          ┌──────────────┼─────────────────┐
          │              │                 │
          ▼              ▼                 ▼
     SQLite DB      Image Processor    AI Engine
                       │                 │
                       ▼                 ▼
                   EXIF GPS         Priority
                       │                 │
                       └────────┬────────┘
                                ▼
                       Recurrence Engine
                                │
                                ▼
                         Admin Dashboard
                                │
                       ┌────────┴────────┐
                       ▼                 ▼
                 Assign Worker      Update Status
                       │                 │
                       ▼                 ▼
                  SMTP Email       Complaint History
```

---

# 29. Backend Modules

Recommended backend structure:

```text
backend/
│
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── database.py
│   │
│   ├── models/
│   │   ├── complaint.py
│   │   ├── user.py
│   │   ├── worker.py
│   │   └── location.py
│   │
│   ├── routes/
│   │   ├── complaints.py
│   │   ├── tracking.py
│   │   ├── admin.py
│   │   ├── workers.py
│   │   └── dashboard.py
│   │
│   ├── services/
│   │   ├── priority_service.py
│   │   ├── location_service.py
│   │   ├── recurrence_service.py
│   │   ├── email_service.py
│   │   └── exif_service.py
│   │
│   └── utils/
│       └── geo.py
│
├── uploads/
├── requirements.txt
└── run.py
```

---

# 30. Frontend Structure

```text
frontend/
│
├── src/
│   ├── components/
│   │   ├── ComplaintForm.jsx
│   │   ├── ComplaintCard.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── PriorityBadge.jsx
│   │   └── DashboardCard.jsx
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── ReportComplaint.jsx
│   │   ├── TrackComplaint.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── ComplaintDetails.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── vite.config.js
```

---

# 31. Database Schema

## 31.1 Admin

```text
admins
-------------------------
id
username
password_hash
created_at
```

---

## 31.2 Users

```text
users
-------------------------
id
user_identifier
name
email
created_at
```

---

## 31.3 Workers

```text
workers
-------------------------
id
name
email
specialization
phone
created_at
```

Example:

```text
1 | Raj Kumar | raj@example.com | Electrical
2 | Amit Shah | amit@example.com | Plumbing
```

---

## 31.4 Locations

```text
locations
-------------------------
id
building
floor
room
latitude
longitude
radius
```

---

## 31.5 Complaints

```text
complaints
-------------------------
id
complaint_id
user_id
category
description
photo_path

user_building
user_floor
user_room

latitude
longitude

detected_location_id
location_verified

priority
priority_score
priority_reason

is_recurring
previous_complaint_count

assigned_worker_id
status

created_at
updated_at
```

---

## 31.6 Status History

```text
status_history
-------------------------
id
complaint_id
old_status
new_status
changed_by
created_at
```

This allows the system to maintain the complaint timeline.

---

# 32. API Design

## User APIs

### Create Complaint

```http
POST /api/complaints
```

Multipart form data:

```text
user_id
name
email
category
building
floor
room
description
photo
```

Response:

```json
{
  "success": true,
  "complaint_id": "COM-2026-0001",
  "priority": "Critical",
  "location": "Engineering Block - Lab 204",
  "is_recurring": true
}
```

---

## Track Complaint

```http
POST /api/complaints/track
```

Request:

```json
{
  "complaint_id": "COM-2026-0001",
  "email": "student@example.com"
}
```

Response:

```json
{
  "complaint_id": "COM-2026-0001",
  "status": "In Progress",
  "priority": "Critical",
  "location": "Engineering Block - Lab 204",
  "assigned_worker": "Raj Kumar"
}
```

---

# 33. Admin APIs

### Login

```http
POST /api/admin/login
```

### Get Dashboard

```http
GET /api/admin/dashboard
```

### Get Complaints

```http
GET /api/admin/complaints
```

### Get Complaint

```http
GET /api/admin/complaints/{complaint_id}
```

### Assign Worker

```http
POST /api/admin/complaints/{complaint_id}/assign
```

Request:

```json
{
  "worker_id": 1
}
```

### Update Status

```http
PATCH /api/admin/complaints/{complaint_id}/status
```

Request:

```json
{
  "status": "In Progress"
}
```

---

# 34. Priority Service

The priority service should expose:

```text
calculate_priority(description, category)
```

Process:

```text
1. Normalize text
2. Check critical keywords
3. Check high keywords
4. Check medium keywords
5. Run AI classifier if available
6. Combine results
7. Apply safety override
8. Return final priority
```

Example result:

```json
{
  "priority": "Critical",
  "score": 95,
  "reason": "Electrical safety hazard detected"
}
```

---

# 35. Location Service

The location service performs:

```text
extract GPS
      ↓
validate coordinates
      ↓
compare against campus locations
      ↓
calculate nearest location
      ↓
check allowed radius
      ↓
return detected location
```

Example:

```json
{
  "latitude": 19.12345,
  "longitude": 72.87654,
  "location_id": "LAB204",
  "location_name": "Engineering Block - Lab 204",
  "distance_meters": 3.2
}
```

---

# 36. Recurrence Service

Input:

```text
location_id
category
```

Query previous complaints.

Example:

```text
SELECT COUNT(*)
FROM complaints
WHERE detected_location_id = ?
AND category = ?
AND id != current_complaint
```

If count >= 3:

```text
is_recurring = TRUE
```

---

# 37. Email Service

Function:

```text
send_assignment_email(worker, complaint)
```

Triggered after successful assignment.

```text
Admin assigns worker
        ↓
Database updated
        ↓
Email service
        ↓
SMTP
        ↓
Worker email
```

If email fails, the complaint assignment should still remain saved.

The UI should display:

```text
Worker assigned successfully.
Email notification: Failed
```

rather than rolling back the assignment.

---

# 38. Error Handling

## Missing GPS

```text
GPS unavailable
↓
Use user-selected location
```

## AI model unavailable

```text
AI unavailable
↓
Keyword priority engine
```

## Email failure

```text
Assignment saved
+
Email delivery failed
```

## Invalid image

```text
Reject image
OR
allow complaint without GPS