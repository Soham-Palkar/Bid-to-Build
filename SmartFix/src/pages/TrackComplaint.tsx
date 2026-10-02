import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Lock,
  Zap,
  MapPin,
  Clock,
  Camera,
  AlertTriangle,
  PhoneCall,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { PublicNavbar, PublicFooter } from '../components/Navbar';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ComplaintTimeline } from '../components/ComplaintTimeline';
import { trackComplaint } from '../services/api';
import { getInitials } from '../utils/formatters';
import type { TrackComplaintResponse } from '../types';

export const TrackComplaint: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || 'COM-2026-0001';
  const initialEmail = searchParams.get('email') || 'student@example.com';

  const [complaintId, setComplaintId] = useState(initialId);
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackComplaintResponse | null>(null);
  const [imgFallback, setImgFallback] = useState(false);

  const performLookup = useCallback(async (idToLookup: string, emailToLookup: string) => {
    if (!idToLookup.trim() || !emailToLookup.trim()) {
      setError('Both Complaint ID and registered email are required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setImgFallback(false);

    try {
      const data = await trackComplaint(idToLookup.trim(), emailToLookup.trim());
      setResult(data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Unable to locate complaint with the provided ID and email.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performLookup(initialId, initialEmail);
  }, [initialId, initialEmail, performLookup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(complaintId, email);
  };

  const handleSelectQuickSample = (sampleId: string, sampleEmail: string) => {
    setComplaintId(sampleId);
    setEmail(sampleEmail);
    performLookup(sampleId, sampleEmail);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-mono-tech text-xs font-semibold text-[#2563EB] mb-1">
              Real-Time Status Verification · PS-07 Platform
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Track Complaint Status
            </h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
              Enter your Complaint ID and registered student email to inspect real-time progress,
              worker assignment, and safety resolution timelines.
            </p>
          </div>

          {/* Sample Ticket Switcher for Demo Testing */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#64748B] font-medium">Sample IDs:</span>
            <button
              type="button"
              onClick={() => handleSelectQuickSample('COM-2026-0001', 'student@example.com')}
              className={`px-2.5 py-1 rounded border font-mono-tech text-xs transition-colors cursor-pointer ${
                complaintId === 'COM-2026-0001'
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:text-[#0F172A]'
              }`}
            >
              COM-2026-0001
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickSample('COM-2026-0002', 'priya.nair@campus.edu')}
              className={`px-2.5 py-1 rounded border font-mono-tech text-xs transition-colors cursor-pointer ${
                complaintId === 'COM-2026-0002'
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:text-[#0F172A]'
              }`}
            >
              COM-2026-0002
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickSample('COM-2026-0003', 'rohan.k@campus.edu')}
              className={`px-2.5 py-1 rounded border font-mono-tech text-xs transition-colors cursor-pointer ${
                complaintId === 'COM-2026-0003'
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:text-[#0F172A]'
              }`}
            >
              COM-2026-0003
            </button>
          </div>
        </div>

        {/* Query Lookup Form Card (Section 19) */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5 flex flex-col gap-1.5">
                <label
                  htmlFor="track-complaint-id"
                  className="text-xs font-semibold text-[#334155] flex items-center justify-between"
                >
                  <span>Complaint ID *</span>
                  <span className="font-mono-tech text-[11px] font-normal text-[#64748B]">
                    FORMAT: COM-YYYY-XXXX
                  </span>
                </label>
                <input
                  id="track-complaint-id"
                  type="text"
                  required
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  placeholder="COM-2026-0001"
                  className="h-10 px-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white font-mono-tech text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                />
              </div>

              <div className="md:col-span-5 flex flex-col gap-1.5">
                <label
                  htmlFor="track-student-email"
                  className="text-xs font-semibold text-[#334155] flex items-center justify-between"
                >
                  <span>Email *</span>
                  <span className="font-mono-tech text-[11px] font-normal text-[#64748B]">
                    CAMPUS IDENTITY
                  </span>
                </label>
                <input
                  id="track-student-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="h-10 px-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 px-4 rounded bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Track Complaint</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#64748B] pt-1">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Both Complaint ID and verification email are required for student privacy and
                physical safety protocols.
              </span>
            </div>
          </form>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-3 text-xs font-medium text-[#991B1B]">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Query Result (Section 20) */}
        {result && (
          <div className="flex flex-col gap-6">
            {/* Result Summary Banner */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-mono-tech text-lg font-bold text-[#0F172A]">
                      Complaint {result.complaint_id}
                    </h2>
                    <PriorityBadge priority={result.priority} />
                    <span className="text-xs font-semibold text-[#475569] px-2.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0]">
                      {result.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1 font-medium text-[#0F172A]">
                      <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                      {result.location}
                    </span>
                    {result.created_at && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-mono-tech">
                          <Clock className="w-3.5 h-3.5" />
                          Submitted: {result.created_at}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-start lg:self-center bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="font-mono-tech text-[10px] text-[#64748B]">
                    CURRENT LIFECYCLE
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={result.status} />
                  </div>
                </div>
                <div className="h-8 w-px bg-[#E2E8F0]" />
                <div className="flex flex-col">
                  <span className="font-mono-tech text-[10px] text-[#64748B]">TARGET SLA</span>
                  <span className="font-mono-tech text-xs font-semibold text-[#0F172A] mt-1">
                    {result.priority === 'Critical'
                      ? '2h Response SLA'
                      : result.priority === 'High'
                      ? '8h Response SLA'
                      : '24h Standard SLA'}
                  </span>
                </div>
              </div>
            </div>

            {/* Two-Column Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Status Timeline (Section 20) */}
              <div className="lg:col-span-6">
                <ComplaintTimeline
                  currentStatus={result.status}
                  timeline={result.timeline || []}
                  assignedWorkerName={result.assigned_worker?.name}
                />
              </div>

              {/* Right Column: Evidence, Worker Assignment & Safety Advisories */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#2563EB]" />
                      <h3 className="text-sm font-semibold text-[#0F172A]">
                        Incident Evidence &amp; Location
                      </h3>
                    </div>
                    {result.location_details?.verified && (
                      <span className="font-mono-tech text-[11px] font-semibold text-[#047857]">
                        ✓ GPS Matched ±2m
                      </span>
                    )}
                  </div>

                  {/* Evidence Image with Fallback */}
                  {result.photo_url && (
                    <div className="relative rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#0F172A] aspect-video max-h-56">
                      {!imgFallback ? (
                        <img
                          src={result.photo_url}
                          alt={`Evidence photo for ${result.complaint_id}`}
                          referrerPolicy="no-referrer"
                          onError={() => setImgFallback(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-4">
                          <ImageIcon className="w-8 h-8 mb-2 text-[#60A5FA]" />
                          <span className="text-xs font-mono-tech">
                            Incident Evidence Photo ({result.complaint_id})
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 right-2 bg-[#0F172A]/85 backdrop-blur-xs text-white px-3 py-1.5 rounded flex items-center justify-between font-mono-tech text-[11px]">
                        <span>REF: {result.complaint_id}</span>
                        <span className="text-[#6EE7B7]">EXIF VERIFIED</span>
                      </div>
                    </div>
                  )}

                  {/* Location Details */}
                  <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#0F172A]">
                        Verified Campus Location
                      </span>
                      <span className="text-xs text-[#475569] mt-0.5">{result.location}</span>
                    </div>
                  </div>

                  {/* Assigned Specialist */}
                  <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3">
                    {result.assigned_worker ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] font-mono-tech text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(result.assigned_worker.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#0F172A]">
                              {result.assigned_worker.name}
                            </span>
                            <span className="text-[11px] text-[#64748B]">
                              {result.assigned_worker.specialization}
                              {result.assigned_worker.license
                                ? ` · ${result.assigned_worker.license}`
                                : ''}
                            </span>
                          </div>
                        </div>
                        {result.assigned_worker.duty_id && (
                          <span className="font-mono-tech text-[11px] text-[#475569]">
                            {result.assigned_worker.duty_id}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full text-xs text-[#64748B]">
                        <span>Worker Assignment</span>
                        <span className="italic">Pending Technician Dispatch</span>
                      </div>
                    )}
                  </div>

                  {/* Recurring Hazard Alert if applicable */}
                  {result.is_recurring && (
                    <div className="p-3.5 rounded bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#991B1B]">
                          Recurring Hazard Warning
                        </span>
                        <p className="text-xs text-[#991B1B]/90 mt-0.5 leading-relaxed">
                          ⚠ Recurring safety hazard flagged to Campus Facilities Management (
                          {result.previous_complaint_count} previous {result.category} complaints
                          logged at this location). Prioritized root-cause inspection triggered.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Escalation Contact Card */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#0F172A]">
                      Urgent Escalation or Questions?
                    </span>
                    <span className="text-xs text-[#64748B]">
                      Direct line to Central Facilities Dispatcher
                    </span>
                  </div>
                  <a
                    href="tel:+10000004040"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#2563EB] text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Contact Facility Desk (ext: 4040)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};
