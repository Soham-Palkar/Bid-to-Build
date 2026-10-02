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
import { LocationSelector } from '../components/LocationSelector';
import { LocationCard } from '../components/LocationCard';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { createComplaint, detectPhotoLocation, resendComplaintEmail, type CampusLocation } from '../services/api';
import type { CreateComplaintResponse } from '../types';
import sparkImg from '../assets/images/incident_electrical_spark_1790921884186.jpg';

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

  // Dynamic Location State
  const [locationId, setLocationId] = useState('LOC001');
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | undefined>(undefined);

  // Location Detection State from Backend
  const [locationPreview, setLocationPreview] = useState<{
    has_gps: boolean;
    gps_available?: boolean;
    latitude?: number | null;
    longitude?: number | null;
    altitude_m?: number | null;
    distance_m?: number | null;
    allowed_radius_m?: number;
    detected_building?: string;
    detected_floor?: string;
    detected_room?: string;
    detected_name?: string | null;
    user_selected?: string;
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
  const [quickTrackId, setQuickTrackId] = useState('HIST001');
  const [quickTrackEmail, setQuickTrackEmail] = useState('student.a@campus.edu');

  // Trigger backend location detection when photo or location changes
  useEffect(() => {
    if (!photo) {
      setLocationPreview(null);
      return;
    }

    let cancelled = false;
    detectPhotoLocation({
      location_id: locationId,
      photo: photo.file,
      photo_data_url: photo.previewUrl,
      latitude: photo.latitude,
      longitude: photo.longitude,
      altitude_m: photo.altitude_m,
    })
      .then((res) => {
        if (!cancelled) {
          setLocationPreview(res);
          if (res.gps_available && res.latitude !== null && res.latitude !== undefined) {
            setPhoto((prev) => {
              if (!prev) return null;
              if (
                prev.latitude === res.latitude &&
                prev.longitude === res.longitude &&
                prev.altitude_m === res.altitude_m &&
                prev.gpsAvailable === res.gps_available
              ) {
                return prev;
              }
              return {
                ...prev,
                latitude: res.latitude,
                longitude: res.longitude,
                altitude_m: res.altitude_m,
                gpsAvailable: res.gps_available,
              };
            });
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('GPS location detection failed:', err);
          setLocationPreview({
            has_gps: false,
            gps_available: false,
            latitude: null,
            longitude: null,
            altitude_m: null,
            distance_m: null,
            allowed_radius_m: selectedLocation?.radius_m || 5,
            detected_building: selectedLocation?.building || 'Xavier Institute of Engineering',
            detected_floor: selectedLocation ? `Floor ${selectedLocation.floor}` : 'Floor 1',
            detected_room: selectedLocation?.room || 'Selected Location',
            user_selected: selectedLocation?.location_name || 'Selected Campus Location',
            verified: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [photo?.file, photo?.previewUrl, locationId, selectedLocation]);

  // Pre-fill Acceptance Test Demo Data (Final Demo Scenario)
  const handleFillDemoScenario = async () => {
    setUserId('30');
    setName('Soham');
    setEmail('202403047.sohamgpp@student.xavier.ac.in');
    setCategory('Electrical');
    setLocationId('LOC001');
    setDescription(
      'Sparking from exposed wire near DB Lab switchboard. Small scorch mark visible when adjacent machines power up.'
    );

    let fileObj: File | null = null;
    try {
      const res = await fetch(sparkImg);
      const blob = await res.blob();
      fileObj = new File([blob], 'db_lab_electrical_spark.jpg', { type: 'image/jpeg' });
    } catch {
      fileObj = null;
    }

    setPhoto({
      file: fileObj,
      previewUrl: sparkImg,
      filename: 'db_lab_electrical_spark.jpg',
      sizeLabel: '2.4 MB',
      latitude: 19.045266,
      longitude: 72.841845,
      altitude_m: 12.4,
      gpsAvailable: true,
      captureSource: 'sample',
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
    if (!locationId) {
      newErrors.locationId = 'Please select a campus location.';
    }

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
        location_id: locationId,
        description: description.trim(),
        photo: photo?.file || null,
        photo_data_url: photo?.previewUrl,
        photo_filename: photo?.filename,
        photo_size: photo?.sizeLabel,
        latitude: photo?.latitude,
        longitude: photo?.longitude,
        altitude_m: photo?.altitude_m,
      });
      setSubmittedResult(response);
      setShowEmailPreview(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string; message?: string } } }).response?.data?.error ||
            (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setSubmitError(msg || 'Unable to submit complaint. Please check your backend connection.');
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
        submittedResult.user_email_recipient || email.trim() || 'soham@example.com'
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
        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
          <div>
            <p className="font-mono-tech text-xs font-semibold text-[#2563EB] mb-1">
              Xavier Institute of Engineering · SmartFix Platform
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Report a Maintenance Issue
            </h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
              Submit campus maintenance issues directly to facilities. Automated safety triage,
              GPS verification, and recurrence detection ensure rapid SLA resolution.
            </p>
          </div>

          {!submittedResult && (
            <button
              type="button"
              onClick={handleFillDemoScenario}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-[#BFDBFE] bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Demo Scenario (DB Lab)</span>
            </button>
          )}
        </div>

        {/* Quick Ticket Lookup Strip */}
        {!submittedResult && (
          <div className="mt-6 bg-white border border-[#E2E8F0] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#0F172A]">
                Already reported an issue? Track status in real time
              </span>
              <span className="text-xs text-[#64748B]">
                Enter your Problem ID and registered email to check progress.
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
                placeholder="soham@example.com"
                className="h-9 px-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#2563EB] sm:w-48"
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

        {/* SUCCESS VIEW */}
        {submittedResult ? (
          <div className="mt-8 bg-white border border-[#E2E8F0] rounded-lg p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-start gap-4 pb-5 border-b border-[#E2E8F0]">
              <div className="w-11 h-11 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-[#0F172A]">
                  ✓ Complaint Registered Successfully
                </h2>
                <p className="text-sm text-[#64748B] mt-0.5">
                  Your maintenance complaint has been logged and your Problem ID is ready.
                </p>
              </div>
            </div>

            {/* Email Notification Status Banner */}
            <div className="p-4 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1E3A8A]">
                      {submittedResult.user_email_sent
                        ? '✓ Confirmation Email Dispatched'
                        : '⚠ Confirmation Email Simulated / Pending'}
                    </span>
                    <span className="text-xs text-[#1E40AF] mt-0.5">
                      Confirmation notice for Problem ID{' '}
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

              {/* Email Content Preview */}
              {showEmailPreview && (
                <div className="mt-1 p-4 rounded bg-white border border-[#DBEAFE] text-xs text-[#334155] flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0] font-mono-tech text-[11px] text-[#64748B]">
                    <span>From: facilities@smartfix.campus.edu</span>
                    <span>To: {submittedResult.user_email_recipient || email}</span>
                    <span>Time: {submittedResult.email_sent_at || 'Just now'}</span>
                  </div>
                  <p className="font-semibold text-[#0F172A]">
                    Subject: {submittedResult.email_subject || `SmartFix Complaint Registered — ${submittedResult.complaint_id}`}
                  </p>
                  <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] font-mono-tech text-xs leading-relaxed text-[#334155]">
                    Hello {name || 'Soham'},<br /><br />
                    Your maintenance complaint has been successfully registered.<br /><br />
                    <strong>Problem ID:</strong> {submittedResult.complaint_id}<br />
                    <strong>Category:</strong> {category}<br />
                    <strong>Location:</strong> {submittedResult.location.name}<br />
                    <strong>Priority:</strong> {submittedResult.priority}<br />
                    <strong>Status:</strong> {submittedResult.status}<br /><br />
                    <strong>Description:</strong><br />
                    {description}<br /><br />
                    You can track your complaint using:<br />
                    Problem ID: <strong>{submittedResult.complaint_id}</strong><br />
                    Email: <strong>{submittedResult.user_email_recipient || email}</strong><br /><br />
                    Thank you,<br />
                    SmartFix Maintenance System
                  </div>
                </div>
              )}
            </div>

            {/* Problem ID Highlight Box */}
            <div className="p-5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-mono-tech text-xs text-[#64748B]">Problem ID</span>
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
                    Calculated Priority
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

            {/* Triage & Verification Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
                <span className="font-mono-tech text-[11px] text-[#64748B]">Selected Location</span>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {submittedResult.location.name}
                </span>
                <span className="text-xs text-[#047857] font-medium mt-0.5">
                  {submittedResult.location.verified
                    ? '✓ GPS Location Verified'
                    : 'Manual Campus Location Recorded'}
                </span>
              </div>

              <div className="p-4 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
                <span className="font-mono-tech text-[11px] text-[#64748B]">
                  Priority Rationale
                </span>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {submittedResult.priority_reason}
                </span>
                {submittedResult.is_recurring && (
                  <span className="text-xs font-semibold text-[#B45309] mt-0.5">
                    ⚠ Recurring Issue ({submittedResult.previous_complaint_count} previous complaints logged at this location)
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/track?id=${encodeURIComponent(
                        submittedResult.complaint_id
                      )}&email=${encodeURIComponent(email.trim() || 'soham@example.com')}`
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
          /* COMPLAINT FORM */
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
            {submitError && (
              <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-3 text-xs font-medium text-[#991B1B]">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* SECTION 1 — Student Information */}
            <section className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-[#2563EB] text-white font-mono-tech text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-base font-bold text-[#0F172A]">Student Information</h2>
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
                    placeholder="30 or TEIT30"
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
                    placeholder="Soham"
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
                    placeholder="soham@example.com"
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
                      Confirmation email will be dispatched here.
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 2 — Complaint Details */}
            <section className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-[#2563EB] text-white font-mono-tech text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-base font-bold text-[#0F172A]">Complaint Information</h2>
                </div>
                <span className="font-mono-tech text-[11px] text-[#2563EB] font-semibold">
                  Automated Safety Triage
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

              {/* Description Field */}
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
                  placeholder={`Describe the maintenance issue clearly...\nExample: Sparking from exposed wire near DB Lab switchboard.`}
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

              {/* Photo Upload */}
              <PhotoUploader
                value={photo}
                onChange={(newPhoto) => {
                  setPhoto(newPhoto);
                }}
                category={category}
                error={errors.photo}
              />
            </section>

            {/* SECTION 3 — Campus Location Selector */}
            <section className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-[#2563EB] text-white font-mono-tech text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-base font-bold text-[#0F172A]">Campus Location</h2>
                </div>
                <span className="font-mono-tech text-[11px] text-[#047857]">
                  Backend Authoritative Dataset
                </span>
              </div>

              {/* Dedicated Location Selector Component */}
              <LocationSelector
                value={locationId}
                onChange={(newId, locObj) => {
                  setLocationId(newId);
                  setSelectedLocation(locObj);
                  if (errors.locationId) setErrors({ ...errors, locationId: '' });
                }}
                error={errors.locationId}
              />

              {/* GPS Location Result Card */}
              {photo && locationPreview && (
                <LocationCard
                  userBuilding={selectedLocation?.building || 'Xavier Institute of Engineering'}
                  userFloor={selectedLocation ? `Floor ${selectedLocation.floor}` : 'Floor 1'}
                  userRoom={selectedLocation?.room || 'DB Lab'}
                  userLocationName={selectedLocation?.location_name}
                  userLocationId={locationId}
                  hasGps={locationPreview.has_gps}
                  detectedBuilding={locationPreview.detected_building}
                  detectedFloor={locationPreview.detected_floor}
                  detectedRoom={locationPreview.detected_room}
                  detectedName={locationPreview.detected_name || undefined}
                  latitude={locationPreview.latitude}
                  longitude={locationPreview.longitude}
                  altitude_m={locationPreview.altitude_m}
                  distance_m={locationPreview.distance_m}
                  radius_m={locationPreview.allowed_radius_m || 5}
                  verified={locationPreview.verified}
                  compact
                />
              )}
            </section>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 px-8 rounded bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Complaint...</span>
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
