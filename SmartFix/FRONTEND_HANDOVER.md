# SmartFix (PS-07) — Frontend Handover Guide

## 1. Frontend Setup
SmartFix is built with **React 19, Vite, TypeScript, Tailwind CSS, React Router, Axios, and Lucide React**. It includes a full-stack Express + Vite server (`server.ts`) that implements the complete PS-07 REST API out of the box while allowing seamless switching to an external backend via `VITE_API_BASE_URL`.

## 2. npm Installation
```bash
npm install
```

## 3. Development Command
```bash
npm run dev
```
Runs the application on `http://localhost:3000`.

## 4. Build Command
```bash
npm run build
```

## 5. Environment Variables
Configured in `.env` (and documented in `.env.example`):
```env
VITE_API_BASE_URL=/api
```
When connecting to an external standalone backend on port 5000, set:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 6. Folder Structure
```text
src/
├── components/
│   ├── Navbar.tsx             # PublicNavbar, PublicFooter, and AdminLayout sidebar
│   ├── PriorityBadge.tsx      # Semantic priority badge (Critical, High, Medium, Low)
│   ├── StatusBadge.tsx        # Lifecycle status badge (Reported, Assigned, In Progress, Resolved)
│   ├── PhotoUploader.tsx      # Drag-and-drop photo uploader with EXIF GPS state preview
│   ├── LocationCard.tsx       # User selected vs GPS detected location verification card
│   ├── ComplaintTimeline.tsx  # 4-stage resolution progression timeline
│   ├── RecurringIssueCard.tsx # Recurring issue cluster alert & root-cause advisory card
│   ├── WorkerAssignment.tsx   # Maintenance technician selector & email notification status
│   ├── ComplaintTable.tsx     # Filterable complaints registry table
│   └── LoadingSpinner.tsx     # Loading indicator
├── pages/
│   ├── ReportComplaint.tsx    # Route: /
│   ├── TrackComplaint.tsx     # Route: /track
│   ├── AdminLogin.tsx         # Route: /admin/login
│   ├── AdminDashboard.tsx     # Route: /admin/dashboard
│   └── ComplaintDetails.tsx   # Route: /admin/complaints/:id
├── services/
│   └── api.ts                 # Centralized Axios instance & REST endpoint calls
├── hooks/
│   └── useAuth.ts             # Admin session management hook
├── types/
│   └── index.ts               # Shared TypeScript interfaces
└── utils/
    └── formatters.ts          # Date/time, file size, and campus building/room definitions
```

## 7. API Endpoints Used
All API calls are centralized in `src/services/api.ts`:
- `POST /api/complaints/detect-location` — Previews EXIF GPS match against selected room
- `POST /api/complaints` — Submits a new complaint
- `POST /api/complaints/track` — Looks up a complaint using `complaint_id` and `email`
- `POST /api/admin/login` — Authenticates admin credentials
- `GET /api/admin/dashboard` — Retrieves summary counters, priority breakdown, status counts, and recurring issue clusters
- `GET /api/admin/complaints` — Lists complaints with `status`, `priority`, `category`, and `search` filters
- `GET /api/admin/complaints/:id` — Retrieves full complaint details
- `GET /api/admin/workers` — Lists available maintenance specialists
- `POST /api/admin/complaints/:id/assign` — Assigns a worker and triggers email notification
- `PATCH /api/admin/complaints/:id/status` — Updates controlled workflow status

## 8. Expected API Response Formats
Refer to `BACKEND_INTEGRATION.md` for complete JSON request/response schemas.

## 9. Authentication Behavior
- Public routes (`/`, `/track`, `/admin/login`) do not require authentication.
- Protected routes (`/admin/dashboard`, `/admin/complaints/:id`) check for `smartfix_admin_token` in `localStorage`.
- If unauthenticated or if the backend returns HTTP `401 Unauthorized`, the Axios interceptor automatically clears session storage and redirects to `/admin/login`.
- Default demo credentials: Username `admin`, Password `password`.

## 10. Image Upload Behavior
- Supports JPG, JPEG, PNG, and WEBP up to 5 MB.
- Displays live image preview, file name, file size, and EXIF GPS status (`📍 Location data detected` or `⚠ Location data not found`).
- Missing GPS metadata never blocks complaint submission.

## 11. Error Handling
Every API-driven view handles loading states, validation errors, empty filter states, and backend/network errors cleanly with actionable retry or reset controls.

## 12. Backend Integration Notes
The frontend never hardcodes priority rules, recurrence counts, or location verification results—it renders the exact values returned by the backend REST endpoints.
