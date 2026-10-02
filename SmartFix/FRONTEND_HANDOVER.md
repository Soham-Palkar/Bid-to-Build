# SmartFix (PS-07) — Frontend Handover Guide

## 1. Frontend Setup
SmartFix is built with **React 19, Vite, TypeScript, Tailwind CSS, React Router, Axios, and Lucide React**. It communicates with the Python Flask backend on port 5000 via `VITE_API_BASE_URL`.

## 2. npm Installation
```bash
npm install
```

## 3. Development Command
```bash
npm run dev
```
Runs the Vite development server on `http://localhost:5173`.

## 4. Build Command
```bash
npm run build
```
Typechecks and generates the production bundle in `dist/`.

## 5. Environment Variables
Configured in `SmartFix/.env` (and documented in `SmartFix/.env.example`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
The frontend automatically derives `API_ORIGIN` (`http://localhost:5000`) for resolving persistent photographic evidence URLs (`getUploadUrl()`).

## 6. Folder Structure
```text
src/
├── components/
│   ├── Navbar.tsx             # PublicNavbar, PublicFooter, and AdminLayout sidebar
│   ├── PriorityBadge.tsx      # Semantic priority badge (Critical, High, Medium, Low)
│   ├── StatusBadge.tsx        # Lifecycle status badge (Reported, Assigned, In Progress, Resolved)
│   ├── PhotoUploader.tsx      # Drag-and-drop & Camera uploader with real EXIF GPS telemetry readout
│   ├── LocationSelector.tsx   # Authoritative campus locations dropdown (from /api/locations)
│   ├── LocationCard.tsx       # User selected vs GPS detected location 5m verification card
│   ├── ComplaintTimeline.tsx  # 4-stage resolution progression timeline
│   ├── RecurringIssueCard.tsx # Recurring issue cluster alert & root-cause advisory card
│   ├── WorkerAssignment.tsx   # Maintenance technician selector & real SMTP email notification status
│   ├── ComplaintTable.tsx     # Searchable & filterable complaints registry table
│   └── LoadingSpinner.tsx     # Loading indicator
├── pages/
│   ├── ReportComplaint.tsx    # Route: / (Complaint submission with live EXIF location detection)
│   ├── TrackComplaint.tsx     # Route: /track (Student tracking with persistent image & timeline)
│   ├── AdminLogin.tsx         # Route: /admin/login
│   ├── AdminDashboard.tsx     # Route: /admin/dashboard
│   └── ComplaintDetails.tsx   # Route: /admin/complaints/:id (Full triage, worker assignment & image view)
├── services/
│   └── api.ts                 # Centralized Axios client, dynamic getUploadUrl(), and REST endpoint calls
├── hooks/
│   └── useAuth.ts             # Admin session token & authentication state
├── types/
│   └── index.ts               # Shared TypeScript interfaces & types
└── utils/
    └── formatters.ts          # Date/time and file size formatters
```

## 7. Key Features & Business Rules
1. **Authoritative Location Principle**: User-selected campus location (`location_id`) is always authoritative. GPS is an audit verification signal and never overwrites `location_id`.
2. **5-Metre Radius**: Verified status is calculated using the Haversine formula against `Location.radius_m` (5m). $\text{distance} \le 5\text{m} \implies \text{Verified}$, $\text{distance} > 5\text{m} \implies \text{GPS Mismatch}$.
3. **Persistent Photographic Evidence**: Decoded server-side to `backend/uploads/` with UUID-based filenames and served via `/uploads/<filename>`.
4. **Real SMTP Notifications**: Real Gmail SMTP delivery status is surfaced accurately in the UI. Assignment succeeds even if SMTP delivery encounters a network/credential error.

