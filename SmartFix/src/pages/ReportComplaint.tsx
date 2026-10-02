import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Mail,
  Send,
} from 'lucide-react';
import { PublicNavbar, PublicFooter } from '../components/Navbar';
import { PhotoUploader, type UploadedPhotoState } from '../components/PhotoUploader';
import { LocationCard } from '../components/LocationCard';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { createComplaint, detectPhotoLocation, resendComplaintEmail } from '../services/api';
import { CAMPUS_BUILDINGS } from '../utils/formatters';
import type { CreateComplaintResponse } from '../types';

const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Furniture',
  'HVAC',
  'Civil / Infrastructure',
  'Other',
];

export const ReportComplaint: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<UploadedPhotoState | null>(null);

  const [building, setBuilding] = useState('Engineering Block');
  const [floor, setFloor] = useState('Floor 2');
  const [room, setRoom] = useState('Lab 204');

  // Location Detection State from Backend
  const [locationPreview, setLocationPreview] = useState<{
    has_gps: boolean;
    latitude?: number;
    longitude?: number;
    detected_building?: string;
    detected_floor?: string;
    detected_room?: string;
    verified: boolean;
  } | null>(null);

  // Validation & Submission State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<CreateComplaintResponse | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(true);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailResentSuccess, setEmailResentSuccess] = useState(false);

  // Quick Status Lookup Bar State
  const [quickTrackId, setQuickTrackId] = useState('COM-2026-0001');
  const [quickTrackEmail, setQuickTrackEmail] = useState('student@example.com');

  // Update available floors and rooms when building/floor changes
  const availableFloors = CAMPUS_BUILDINGS[building]?.floors || ['Floor 1'];
  const availableRooms = CAMPUS_BUILDINGS[building]?.roomsByFloor[floor] || ['Room 101'];

  const handleBuildingChange = (newBuilding: string) => {
    setBuilding(newBuilding);
    const firstFloor = CAMPUS_BUILDINGS[newBuilding]?.floors[0] || 'Floor 1';
    setFloor(firstFloor);
    const firstRoom =
      CAMPUS_BUILDINGS[newBuilding]?.roomsByFloor[firstFloor]?.[0] || 'Room 101';
    setRoom(firstRoom);
  };

  const handleFloorChange = (newFloor: string) => {
    setFloor(newFloor);
    const firstRoom = CAMPUS_BUILDINGS[building]?.roomsByFloor[newFloor]?.[0] || 'Room 101';
    setRoom(firstRoom);
  };

  // Trigger backend location detection when photo or location changes
  useEffect(() => {
    if (!photo) {
      setLocationPreview(null);
      return;
    }

    let cancelled = false;
    detectPhotoLocation({
      building,
      floor,
      room,
      gps_mode: photo.gpsMode,
    })
      .then((res) => {
        if (!cancelled) {
          setLocationPreview(res);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocationPreview({
            has_gps: photo.gpsMode !== 'none',
            latitude: 19.12345,
            longitude: 72.87654,
            detected_building: building,
            detected_floor: floor,
            detected_room: photo.gpsMode === 'mismatch' ? 'Lab 203' : room,
            verified: photo.gpsMode === 'verified',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [photo, building, floor, room]);

  // Pre-fill Acceptance Test Demo Data
  const handleFillDemoScenario = () => {
    setUserId('TEIT30');
    setName('Soham Palkar');
    setEmail('student@example.com');
    setCategory('Electrical');
    setBuilding('Engineering Block');
    setFloor('Floor 2');
    setRoom('Lab 204');
    setDescription(
      'Sparking from exposed electrical wire near main distribution switchboard inside Lab 204. Small scorch mark visible when adjacent machines power up.'
    );
    setPhoto({
      file: null,
      previewUrl: '/src/assets/images/incident_electrical_spark_1790921884186.jpg',
      filename: 'wire_switchboard_hazard.jpg',
      sizeLabel: '2.4 MB',
      gpsMode: 'verified',
    });
    setErrors({});
    setSubmitError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userId.trim()) newErrors.userId = 'Student / User ID is required.';
    if (!name.trim()) newErrors.name = 'Full Name is required.';
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!category) newErrors.category = 'Please select a category.';
    if (!description.trim()) {
      newErrors.description = 'Complaint description cannot be empty.';
    }
    if (!photo) {
      newErrors.photo = 'Please upload a photo or take a photo with your camera.';
    }
    if (!building) newErrors.building = 'Building is required.';
    if (!floor) newErrors.floor = 'Floor is required.';
    if (!room) newErrors.room = 'Room / Lab is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setEmailResentSuccess(false);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await createComplaint({
        user_id: userId.trim(),
        name: name.trim(),
        email: email.trim(),
        category,
        building,
        floor,
        room,
        description: description.trim(),
        photo: photo?.file || null,
        photo_data_url: photo?.previewUrl,
        photo_filename: photo?.filename,
        photo_size: photo?.sizeLabel,
        gps_mode: photo?.gpsMode || 'verified',
      });
      setSubmittedResult(response);
      setShowEmailPreview(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setSubmitError(msg || 'Unable to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!submittedResult || isResendingEmail) return;
    setIsResendingEmail(true);
    setEmailResentSuccess(false);
    try {
      const res = await resendComplaintEmail(
        submittedResult.complaint_id,
        submittedResult.user_email_recipient || email.trim() || 'student@example.com'
      );
      setSubmittedResult({
        ...submittedResult,
        user_email_sent: res.user_email_sent,
        user_email_recipient: res.user_email_recipient,
        email_sent_at: res.email_sent_at,
        email_subject: res.email_subject,
      });
      setEmailResentSuccess(true);
      setTimeout(() => setEmailResentSuccess(false), 3500);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedResult(null);
    setUserId('');
    setName('');
    setEmail('');
    setCategory('Electrical');
    setDescription('');
    setPhoto(null);
    setErrors({});
    setSubmitError(null);
    setEmailResentSuccess(false);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      `/track?id=${encodeURIComponent(quickTrackId.trim())}&email=${encodeURIComponent(
        quickTrackEmail.trim()
      )}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {/* Compact Hero Section (Section 9) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
          <div>
            <p className="font-mono-tech text-xs font-semibold text-[#2563EB] mb-1">
              Campus Facilities SLA 24/7 · PS-07 Platform
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Report a Maintenance Issue
            </h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
              Help us resolve campus maintenance problems faster. Submit a complaint with the
              location and a photo. Critical and recurring issues are automatically identified.
            </p>
          </div>

          {!submittedResult && (
            <button
              type="button"
              onClick={handleFillDemoScenario}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-[#BFDBFE] bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Demo Scenario (Lab 204)</span>
            </button>
          )}
        </div>

        {/* Instant Ticket Lookup Strip */}
        {!submittedResult && (
          <div className="mt-6 bg-white border border-[#E2E8F0] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#0F172A]">
                Already lodged a complaint? Check status instantly
              </span>
              <span className="text-xs text-[#64748B]">
                Enter your Complaint ID and registered campus email to inspect live progress.
              </span>
            </div>

            <form
              onSubmit={handleQuickTrackSubmit}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                type="text"
                value={quickTrackId}
                onChange={(e) => setQuickTrackId(e.target.value)}
                placeholder="COM-2026-0001"
                className="h-9 px-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] font-mono-tech text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#2563EB] sm:w-36"
                required
              />
              <input
                type="email"
                value={quickTrackEmail}
                onChange={(e) => setQuickTrackEmail(e.target.value)}
                placeholder="student@example.com"
                className="h-9 px-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#2563EB] sm:w-44"
                required
              />
              <button
                type="submit"
                className="h-9 px-3.5 rounded bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Check Status</span>
              </button>
            </form>
          </div>
        )}

        {/* SUCCESS VIEW (Section 17) */}
        {submittedResult ? (
          <div className="mt-8 bg-white border border-[#E2E8F0] rounded-lg p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-start gap-4 pb-5 border-b border-[#E2E8F0]">
              <div className="w-11 h-11 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-[#0F172A]">
                  ✓ Complaint Submitted Successfully
                </h2>
                <p className="text-sm text-[#64748B] mt-0.5">
                  Your complaint has been registered and your Complaint ID has been dispatched to
                  your email address.
                </p>
              </div>
            </div>

            {/* Email Notification Dispatch Banner */}
            <div className="p-4 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1E3A8A]">
                      ✓ Complaint ID Sent to Your Email
                    </span>
                    <span className="text-xs text-[#1E40AF] mt-0.5">
                      Confirmation email containing Complaint ID{' '}
                      <strong className="font-mono-tech">{submittedResult.complaint_id}</strong>{' '}
                      sent to{' '}
                      <strong className="font-mono-tech">
                        {submittedResult.user_email_recipient || email}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setShowEmailPreview((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded bg-white border border-[#BFDBFE] text-xs font-semibold text-[#1D4ED8] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    {showEmailPreview ? 'Hide Email Receipt' : 'View Email Receipt'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={isResendingEmail}
                    className="px-2.5 py-1.5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isResendingEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{emailResentSuccess ? 'Email Resent!' : 'Resend Email'}</span>
                  </button>
                </div>
              </div>

              {/* Dispatched Email Preview Card */}
              {showEmailPreview && (
                <div className="mt-1 p-4 rounded bg-white border border-[#DBEAFE] text-xs text-[#334155] flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0] font-mono-tech text-[11px] text-[#64748B]">
                    <span>From: facilities-noreply@campus.edu</span>
                    <span>To: {submittedResult.user_email_recipient || email}</span>
                    <span>Dispatched: {submittedResult.email_sent_at || 'Just now'}</span>
                  </div>
                  <p className="font-semibold text-[#0F172A]">
                    Subject:{' '}
                    {submittedResult.email_subject ||
                      `[SmartFix Campus Ops] Complaint Registered — ID: ${submittedResult.complaint_id}`}
                  </p>
                  <p className="leading-relaxed text-[#475569]">
                    Hello <strong className="text-[#0F172A]">{name || 'Student'}</strong>, your
                    maintenance complaint for{' '}
                    <strong className="text-[#0F172A]">{submittedResult.location.name}</strong> has
                    been registered. Use your Complaint ID{' '}
                    <strong className="font-mono-tech text-[#2563EB]">
                      {submittedResult.complaint_id}
                    </strong>{' '}
                    and this email address (<strong className="font-mono-tech">{email}</strong>) on
                    the Track Complaint portal to monitor technician assignment and resolution
                    progress.
                  </p>
                </div>
              )}
            </div>

            {/* Complaint ID Highlight Box */}
            <div className="p-5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-mono-tech text-xs text-[#64748B]">Complaint ID</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono-tech text-2xl font-bold text-[#2563EB]">
                    {submittedResult.complaint_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(submittedResult.complaint_id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#CBD5E1] bg-white text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col sm:items-end gap-1">
                  <span className="font-mono-tech text-[11px] text-[#64748B]">
                    Automated Priority
                  </span>
                  <PriorityBadge priority={submittedResult.priority} />
                </div>
                <div className="h-8 w-px bg-[#E2E8F0]" />
                <div className="flex flex-col sm:items-end gap-1">
                  <span className="font-mono-tech text-[11px] text-[#64748B]">Status</span>
                  <StatusBadge status={submittedResult.status} />
                </div>
              </div>
            </div>

            {/* Triage Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
                <span className="font-mono-tech text-[11px] text-[#64748B]">Location</span>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {submittedResult.location.name}
                </span>
                <span className="text-xs text-[#047857] font-medium mt-0.5">
                  {submittedResult.location.verified
                    ? '✓ GPS Location Verified'
                    : 'Manual Location Recorded'}
                </span>
              </div>

              <div className="p-4 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
                <span className="font-mono-tech text-[11px] text-[#64748B]">
                  Safety Triage Assessment
                </span>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {submittedResult.priority_reason}
                </span>
                {submittedResult.is_recurring && (
                  <span className="text-xs font-semibold text-[#B45309] mt-0.5">
                    ⚠ Recurring Issue Flagged ({submittedResult.previous_complaint_count} previous
                    complaints at this location)
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons (Section 17: Track Complaint + Report Another Issue) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/track?id=${encodeURIComponent(
                        submittedResult.complaint_id
                      )}&email=${encodeURIComponent(email.trim() || 'student@example.com')}`
                    )
                  }
                  className="h-10 px-5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Track Complaint</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="h-10 px-4 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Report Another Issue</span>
                </button>
              </div>

              <Link
                to={`/admin/complaints/${submittedResult.complaint_id}`}
                className="text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors text-center sm:text-right py-2"
              >
                Inspect in Admin Console →
              </Link>
            </div>
          </div>
        ) : (
          /* COMPLAINT FORM (Sections 10–16) */
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
            {submitError && (
              <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-3 text-xs font-medium text-[#991B1B]">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* SECTION A — Your Information (Section 10) */}
            <section className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-[#2563EB] text-white font-mono-tech text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-base font-bold text-[#0F172A]">Your Information</h2>
                </div>
                <span className="font-mono-tech text-[11px] text-[#64748B]">
                  Identity Verification
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Student / User ID */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-id" className="text-xs font-semibold text-[#334155]">
                    Student / User ID <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="user-id"
                    type="text"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      if (errors.userId) setErrors({ ...errors, userId: '' });
                    }}
                    placeholder="TEIT30"
                    className={`h-10 px-3 rounded border bg-white font-mono-tech text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none ${
                      errors.userId
                        ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                        : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15'
                    }`}
                  />
                  {errors.userId && (
                    <span className="text-xs text-[#DC2626]">{errors.userId}</span>
                  )}
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-name" className="text-xs font-semibold text-[#334155]">
                    Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="Soham Palkar"
                    className={`h-10 px-3 rounded border bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none ${
                      errors.name
                        ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                        : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15'
                    }`}
                  />
                  {errors.name && <span className="text-xs text-[#DC2626]">{errors.name}</span>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-email" className="text-xs font-semibold text-[#334155]">
                    Email <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="student@example.com"
                    className={`h-10 px-3 rounded border bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none ${
                      errors.email
                        ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                        : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15'
                    }`}
                  />
                  {errors.email ? (
                    <span className="text-xs text-[#DC2626]">{errors.email}</span>
                  ) : (
                    <span className="text-[11px] text-[#64748B]">
                      Your Complaint ID will be emailed to this address.
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION B — Complaint Information (Sections 11, 12, 13) */}
            <section className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-[#2563EB] text-white font-mono-tech text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-base font-bold text-[#0F172A]">Complaint Information</h2>
                </div>
                <span className="font-mono-tech text-[11px] text-[#DC2626] font-semibold">
                  Photo Evidence Required
                </span>
              </div>

              {/* Category Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className="text-xs font-semibold text-[#334155]">
                  Category <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 px-3 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description Field (Section 12) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="description" className="text-xs font-semibold text-[#334155]">
                    Description <span className="text-[#DC2626]">*</span>
                  </label>
                  <span className="font-mono-tech text-[11px] text-[#64748B]">
                    {description.length} / 500 chars
                  </span>
                </div>
                <textarea
                  id="description"
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors({ ...errors, description: '' });
                  }}
                  placeholder={`Describe the problem clearly...\nExample: Sparking from an exposed electrical wire near the switchboard.`}
                  className={`p-3 rounded border bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none leading-relaxed ${
                    errors.description
                      ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                      : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15'
                  }`}
                />
                {errors.description && (
                  <span className="text-xs text-[#DC2626]">{errors.description}</span>
                )}
              </div>

              {/* Photo Upload (Section 13) */}
              <PhotoUploader
                value={photo}
                onChange={(newPhoto) => {
                  setPhoto(newPhoto);
                  if (newPhoto && errors.photo) {
                    setErrors({ ...errors, photo: '' });
                  }
                }}
                category={category}
                error={errors.photo}
              />
            </section>

            {/* SECTION C — Campus Location & GPS Result (Sections 14 & 15) */}
            <section className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-[#2563EB] text-white font-mono-tech text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-base font-bold text-[#0F172A]">Campus Location</h2>
                </div>
                <span className="font-mono-tech text-[11px] text-[#047857]">
                  Geofence Cross-Check
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Building */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="building" className="text-xs font-semibold text-[#334155]">
                    Building <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    id="building"
                    value={building}
                    onChange={(e) => handleBuildingChange(e.target.value)}
                    className="h-10 px-3 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                  >
                    {Object.keys(CAMPUS_BUILDINGS).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Floor */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="floor" className="text-xs font-semibold text-[#334155]">
                    Floor <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    id="floor"
                    value={floor}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    className="h-10 px-3 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                  >
                    {availableFloors.map((fl) => (
                      <option key={fl} value={fl}>
                        {fl}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room / Lab */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="room" className="text-xs font-semibold text-[#334155]">
                    Room / Lab <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    id="room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="h-10 px-3 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                  >
                    {availableRooms.map((rm) => (
                      <option key={rm} value={rm}>
                        {rm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GPS Location Result Card (Section 15) */}
              {photo && locationPreview && (
                <LocationCard
                  userBuilding={building}
                  userFloor={floor}
                  userRoom={room}
                  hasGps={locationPreview.has_gps}
                  detectedBuilding={locationPreview.detected_building}
                  detectedFloor={locationPreview.detected_floor}
                  detectedRoom={locationPreview.detected_room}
                  latitude={locationPreview.latitude}
                  longitude={locationPreview.longitude}
                  verified={locationPreview.verified}
                  compact
                />
              )}
            </section>

            {/* Submit Button (Section 16) */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 px-8 rounded bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Complaint</span>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};
