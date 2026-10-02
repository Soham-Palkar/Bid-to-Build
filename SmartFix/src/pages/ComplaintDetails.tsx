import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  MapPin,
  FileText,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  Clock,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminLayout } from '../components/Navbar';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LocationCard } from '../components/LocationCard';
import { RecurringIssueCard } from '../components/RecurringIssueCard';
import { WorkerAssignment } from '../components/WorkerAssignment';
import { ComplaintTimeline } from '../components/ComplaintTimeline';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  getComplaintDetails,
  getWorkers,
  assignWorkerToComplaint,
  updateComplaintStatus,
} from '../services/api';
import type { Complaint, ComplaintStatus, Worker } from '../types';

const ALLOWED_STATUSES: ComplaintStatus[] = [
  'Reported',
  'Assigned',
  'In Progress',
  'Resolved',
];

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const complaintId = id || 'COM-2026-0001';

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('Reported');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [imgFallback, setImgFallback] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setImgFallback(false);
    try {
      const [complaintData, workersData] = await Promise.all([
        getComplaintDetails(complaintId),
        getWorkers(),
      ]);
      setComplaint(complaintData);
      setSelectedStatus(complaintData.status);
      setWorkers(workersData);
    } catch {
      setError(`Unable to load complaint details for ${complaintId}.`);
    } finally {
      setIsLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleAssignWorker = async (workerId: number) => {
    const res = await assignWorkerToComplaint(complaintId, workerId);
    if (res.complaint) {
      setComplaint(res.complaint);
      setSelectedStatus(res.complaint.status);
    } else if (complaint) {
      setComplaint({
        ...complaint,
        status: res.status,
        assigned_worker: res.worker,
        email_sent: res.email_sent,
      });
      setSelectedStatus(res.status);
    }
    triggerToast(`Worker assigned: ${res.worker.name}`);
    return {
      worker: res.worker,
      email_sent: res.email_sent,
    };
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const res = await updateComplaintStatus(complaint.complaint_id, selectedStatus);
      if (res.complaint) {
        setComplaint(res.complaint);
      } else {
        setComplaint({
          ...complaint,
          status: res.status,
        });
      }
      triggerToast(`Complaint status updated to ${res.status}`);
    } catch {
      triggerToast('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout activeTab="complaints">
        <LoadingSpinner label={`Loading ${complaintId}...`} fullPage />
      </AdminLayout>
    );
  }

  if (error || !complaint) {
    return (
      <AdminLayout activeTab="complaints">
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 text-center flex flex-col items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
          <h2 className="text-base font-bold text-[#0F172A]">
            {error || 'Complaint not found'}
          </h2>
          <Link
            to="/admin/dashboard"
            className="px-4 py-2 rounded bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const hasGps = Boolean(
    complaint.location.latitude !== undefined && complaint.location.longitude !== undefined
  );

  return (
    <AdminLayout activeTab="complaints">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 font-medium text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span aria-hidden="true">/</span>
            <span>Complaints</span>
            <span aria-hidden="true">/</span>
            <span className="font-mono-tech font-semibold text-[#2563EB]">
              {complaint.complaint_id}
            </span>
          </div>

          <Link
            to={`/track?id=${encodeURIComponent(
              complaint.complaint_id
            )}&email=${encodeURIComponent(complaint.user.email)}`}
            className="text-xs font-semibold text-[#2563EB] hover:underline"
          >
            Open Student Tracking View →
          </Link>
        </nav>

        {/* Details Header (Section 32) */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                <span className="font-mono-tech">{complaint.complaint_id}</span> —{' '}
                {complaint.category} Maintenance Complaint
              </h1>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Created: <strong className="text-[#0F172A]">{complaint.created_at}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Location:{' '}
                <strong className="text-[#0F172A]">
                  {complaint.location.building} — {complaint.location.room}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Core Intelligence Highlight Banner (Section 59 — Make Smart Features Visible) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Priority Detection */}
          <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              complaint.priority === 'Critical'
                ? 'bg-[#FEF2F2] border-[#FECACA]'
                : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <div
              className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${
                complaint.priority === 'Critical'
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-[#EFF6FF] text-[#2563EB]'
              }`}
            >
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono-tech text-[10px] text-[#64748B]">
                SAFETY RULE ENGINE
              </span>
              <span
                className={`text-sm font-bold ${
                  complaint.priority === 'Critical' ? 'text-[#991B1B]' : 'text-[#0F172A]'
                }`}
              >
                {complaint.priority.toUpperCase()} PRIORITY
              </span>
              <span className="text-xs text-[#475569] truncate mt-0.5">
                {complaint.priority_reason || 'Automated priority classification'}
              </span>
            </div>
          </div>

          {/* 2. Location Verification */}
          <div className="p-4 rounded-lg bg-white border border-[#E2E8F0] flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${
                complaint.location.verified
                  ? 'bg-[#ECFDF5] text-[#059669]'
                  : 'bg-[#FFFBEB] text-[#D97706]'
              }`}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono-tech text-[10px] text-[#64748B]">
                EXIF GEOTAG ENGINE
              </span>
              <span className="text-sm font-bold text-[#0F172A]">
                {complaint.location.verified ? '📍 Location Verified' : '⚠ Location Check'}
              </span>
              <span className="text-xs text-[#475569] truncate mt-0.5">
                {complaint.location.room} ({complaint.location.building})
              </span>
            </div>
          </div>

          {/* 3. Recurring Issue Alert */}
          <div className="p-4 rounded-lg bg-white border border-[#E2E8F0] flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${
                complaint.is_recurring
                  ? 'bg-[#FFFBEB] text-[#D97706]'
                  : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono-tech text-[10px] text-[#64748B]">
                CLUSTER DETECTION
              </span>
              <span className="text-sm font-bold text-[#0F172A]">
                {complaint.is_recurring ? '⚠ RECURRING ISSUE' : 'Single Incident'}
              </span>
              <span className="text-xs text-[#475569] truncate mt-0.5">
                {complaint.is_recurring
                  ? `${complaint.previous_complaint_count} previous complaints`
                  : 'No prior cluster alerts'}
              </span>
            </div>
          </div>

          {/* 4. Assigned Worker */}
          <div className="p-4 rounded-lg bg-white border border-[#E2E8F0] flex items-start gap-3">
            <div className="w-9 h-9 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono-tech text-[10px] text-[#64748B]">SLA DISPATCH</span>
              <span className="text-sm font-bold text-[#0F172A] truncate">
                {complaint.assigned_worker
                  ? `Assigned: ${complaint.assigned_worker.name}`
                  : 'Unassigned'}
              </span>
              <span className="text-xs text-[#475569] truncate mt-0.5">
                {complaint.assigned_worker
                  ? complaint.assigned_worker.specialization
                  : 'Select worker below'}
              </span>
            </div>
          </div>
        </section>

        {/* Two-Column Details & Workflow Grid (Sections 33–41) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (7 cols): Photo, Complaint Info, Location, Priority, Recurrence */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Photo View Card (Section 34) */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#2563EB]" />
                  <h2 className="text-sm font-semibold text-[#0F172A]">Photographic Evidence</h2>
                </div>
                <span className="font-mono-tech text-[11px] text-[#64748B]">
                  {complaint.photo_filename || 'INCIDENT_PHOTO.JPG'}
                </span>
              </div>

              <div className="relative bg-[#0F172A] aspect-video w-full overflow-hidden">
                {complaint.photo_url && !imgFallback ? (
                  <img
                    src={complaint.photo_url}
                    alt={`Maintenance issue evidence for ${complaint.complaint_id}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFallback(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-6">
                    <ImageIcon className="w-10 h-10 mb-2 text-[#60A5FA]" />
                    <span className="text-xs font-mono-tech">
                      Photographic Evidence ({complaint.complaint_id})
                    </span>
                  </div>
                )}
              </div>

              {/* Photo Metadata Footer (Section 34: GPS & GPS status only) */}
              <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#475569]">GPS:</span>
                  {hasGps ? (
                    <span className="font-mono-tech font-semibold text-[#0F172A]">
                      {complaint.location.latitude?.toFixed(5)},{' '}
                      {complaint.location.longitude?.toFixed(5)}
                    </span>
                  ) : (
                    <span className="font-mono-tech text-[#64748B]">Not available</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#475569]">GPS status:</span>
                  {hasGps ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#047857]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                      <span>✓ Detected</span>
                    </span>
                  ) : (
                    <span className="text-[#64748B]">Not available</span>
                  )}
                </div>
              </div>
            </div>

            {/* Complaint Information Card (Section 33) */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <h2 className="text-sm font-semibold text-[#0F172A]">Complaint Information</h2>
                </div>
                <span className="font-mono-tech text-xs font-semibold text-[#2563EB]">
                  Category: {complaint.category}
                </span>
              </div>

              <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
                <span className="font-mono-tech text-[11px] text-[#64748B]">Description</span>
                <p className="text-sm text-[#0F172A] leading-relaxed">{complaint.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col">
                  <span className="font-mono-tech text-[11px] text-[#64748B]">Reported By</span>
                  <span className="text-sm font-semibold text-[#0F172A] mt-0.5">
                    {complaint.user.name}
                  </span>
                </div>

                <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col">
                  <span className="font-mono-tech text-[11px] text-[#64748B]">Student ID</span>
                  <span className="font-mono-tech text-sm font-semibold text-[#0F172A] mt-0.5">
                    {complaint.user.id}
                  </span>
                </div>

                <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col">
                  <span className="font-mono-tech text-[11px] text-[#64748B]">Email</span>
                  <span className="text-xs font-medium text-[#2563EB] mt-1 truncate">
                    {complaint.user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Verification Card (Section 35) */}
            <LocationCard
              userBuilding={complaint.location.building}
              userFloor={complaint.location.floor}
              userRoom={complaint.location.room}
              hasGps={hasGps}
              detectedBuilding={complaint.location.detected_building}
              detectedFloor={complaint.location.detected_floor}
              detectedRoom={complaint.location.detected_room}
              latitude={complaint.location.latitude}
              longitude={complaint.location.longitude}
              verified={complaint.location.verified}
            />

            {/* Priority Assessment Card (Section 36) */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
                  <h2 className="text-sm font-semibold text-[#0F172A]">Priority Assessment</h2>
                </div>
                <span className="font-mono-tech text-[11px] text-[#64748B]">
                  Source: {complaint.priority_source || 'Safety Rule Engine'}
                </span>
              </div>

              <div className="p-4 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={complaint.priority} />
                  </div>
                  <p className="text-xs text-[#0F172A] font-medium mt-1">
                    Reason: {complaint.priority_reason || 'Evaluated by Safety Rule Engine.'}
                  </p>
                </div>
              </div>

              {complaint.detected_keywords && complaint.detected_keywords.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono-tech text-[11px] text-[#64748B]">
                    Detected Safety Keywords:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {complaint.detected_keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F1F5F9] border border-[#E2E8F0] font-mono-tech text-xs text-[#0F172A]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recurring Issue Card (Section 37) */}
            <RecurringIssueCard
              isRecurring={complaint.is_recurring}
              previousCount={complaint.previous_complaint_count}
              locationRoom={complaint.location.room}
              category={complaint.category}
              advisory={complaint.advisory}
            />
          </div>

          {/* RIGHT COLUMN (5 cols): Worker Assignment, Status Control, Complaint Timeline */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Worker Assignment Card (Sections 38 & 39) */}
            <WorkerAssignment
              workers={workers}
              currentWorker={complaint.assigned_worker}
              emailSent={complaint.email_sent}
              onAssign={handleAssignWorker}
            />

            {/* Status Control Card (Section 40) */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#2563EB]" />
                  <h2 className="text-sm font-semibold text-[#0F172A]">Status Control</h2>
                </div>
                <span className="font-mono-tech text-[11px] text-[#64748B]">Workflow</span>
              </div>

              <form onSubmit={handleStatusUpdate} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="status-select" className="text-xs font-semibold text-[#334155]">
                    Status
                  </label>
                  <select
                    id="status-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                    className="w-full h-10 px-3 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                  >
                    {ALLOWED_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="w-full h-10 px-4 rounded bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Status...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Update Status</span>
                    </>
                  )}
                </button>
              </form>

              <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Active Lifecycle State:</span>
                <StatusBadge status={complaint.status} size="sm" />
              </div>
            </div>

            {/* Complaint Timeline Card (Section 41) */}
            <ComplaintTimeline
              currentStatus={complaint.status}
              timeline={complaint.timeline || []}
              assignedWorkerName={complaint.assigned_worker?.name}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
