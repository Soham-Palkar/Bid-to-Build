import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { AdminLayout } from '../components/Navbar';
import { ComplaintTable } from '../components/ComplaintTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getAdminDashboard, getAdminComplaints } from '../services/api';
import type { Complaint, DashboardStats } from '../types';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'complaints'>(
    location.hash === '#complaints' ? 'complaints' : 'dashboard'
  );

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State (Section 30)
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [dashboardData, complaintsData] = await Promise.all([
        getAdminDashboard(),
        getAdminComplaints({
          status: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          search: searchQuery,
        }),
      ]);
      setStats(dashboardData);
      setComplaints(complaintsData);
    } catch {
      setError('Unable to connect to the server. Please check the backend connection.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setSearchQuery('');
  };

  if (isLoading && !stats) {
    return (
      <AdminLayout activeTab={activeTab} onSelectComplaintsTab={() => setActiveTab('complaints')}>
        <LoadingSpinner label="Loading maintenance dashboard..." fullPage />
      </AdminLayout>
    );
  }

  const total = stats?.total || 32;
  const critical = stats?.priority.critical ?? 3;
  const high = stats?.priority.high ?? 7;
  const medium = stats?.priority.medium ?? 14;
  const low = stats?.priority.low ?? 8;

  const reported = stats?.status.reported ?? 8;
  const assigned = stats?.status.assigned ?? 7;
  const inProgress = stats?.status.in_progress ?? 9;
  const resolved = stats?.status.resolved ?? 8;

  const priorityTotal = Math.max(1, critical + high + medium + low);
  const statusTotal = Math.max(1, reported + assigned + inProgress + resolved);

  // SVG Donut Circumference calculations (r = 38 => C = 238.76)
  const C = 238.76;
  const repLen = (reported / statusTotal) * C;
  const assLen = (assigned / statusTotal) * C;
  const inpLen = (inProgress / statusTotal) * C;
  const resLen = (resolved / statusTotal) * C;

  const recurringClusters = stats?.recurring_clusters || [
    {
      cluster_id: '#CL-ENG-204',
      complaint_id: 'COM-2026-0001',
      location_label: 'Lab 204 — Engineering Block',
      building: 'Engineering Block',
      room: 'Lab 204',
      category: 'Electrical',
      count: 4,
      summary: 'Repeated MCB trip and wire heating reported within 72 hours.',
      severity: 'Critical' as const,
    },
    {
      cluster_id: '#CL-SCI-101',
      complaint_id: 'COM-2026-0002',
      location_label: 'Room 101 — Science Wing',
      building: 'Science Wing',
      room: 'Room 101',
      category: 'Plumbing',
      count: 3,
      summary: 'Under-sink supply pipe leakage recurring after temporary seal.',
      severity: 'High' as const,
    },
  ];

  return (
    <AdminLayout
      activeTab={activeTab}
      onSelectComplaintsTab={() => setActiveTab('complaints')}
    >
      <div className="flex flex-col gap-6">
        {/* Dashboard Header (Section 24) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Maintenance Dashboard
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              Monitor campus complaints, priorities, assignments and recurring issues.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white border border-[#E2E8F0] px-3.5 py-2 rounded-lg text-xs">
            <span className="font-mono-tech text-[#475569]">
              Last updated:{' '}
              <strong className="text-[#0F172A]">
                {stats?.last_updated || '10:42 AM'}
              </strong>
            </span>
            <button
              type="button"
              onClick={fetchData}
              title="Refresh Dashboard"
              className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-3 text-xs font-medium text-[#991B1B]">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top 4 Summary Cards (Section 25) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Complaints */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-xs font-semibold text-[#64748B]">
                Total Complaints
              </span>
              <div className="w-8 h-8 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-4">
              <span className="text-3xl font-bold text-[#0F172A] tabular-nums">{total}</span>
              <span className="text-xs font-medium text-[#2563EB]">Active Ledger</span>
            </div>
            <div className="w-full h-1 bg-[#E2E8F0] rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-[#2563EB] w-full" />
            </div>
          </div>

          {/* Card 2: Critical */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-xs font-semibold text-[#DC2626]">
                Critical
              </span>
              <div className="w-8 h-8 rounded bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-4">
              <span className="text-3xl font-bold text-[#0F172A] tabular-nums">{critical}</span>
              <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] text-[11px] font-semibold">
                Immediate Action
              </span>
            </div>
            <div className="w-full h-1 bg-[#FEE2E2] rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#DC2626]"
                style={{ width: `${Math.min(100, (critical / priorityTotal) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-xs font-semibold text-[#64748B]">
                In Progress
              </span>
              <div className="w-8 h-8 rounded bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-4">
              <span className="text-3xl font-bold text-[#0F172A] tabular-nums">{inProgress}</span>
              <span className="text-xs font-medium text-[#B45309]">Active Field Work</span>
            </div>
            <div className="w-full h-1 bg-[#FEF3C7] rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#D97706]"
                style={{ width: `${Math.min(100, (inProgress / statusTotal) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 4: Resolved */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-xs font-semibold text-[#64748B]">
                Resolved
              </span>
              <div className="w-8 h-8 rounded bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-4">
              <span className="text-3xl font-bold text-[#0F172A] tabular-nums">{resolved}</span>
              <span className="text-xs font-medium text-[#047857]">{resolved} Completed</span>
            </div>
            <div className="w-full h-1 bg-[#D1FAE5] rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#059669]"
                style={{ width: `${Math.min(100, (resolved / statusTotal) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mid Section: Priority Summary, Status Summary, and Recurring Issues (Sections 26, 27, 28) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Priority Overview Card (Section 26) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-[#0F172A]">Priority Overview</h2>
                <span className="font-mono-tech text-xs text-[#64748B] tabular-nums">
                  Total {total}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mb-5">
                Distribution by SLA criticality level
              </p>

              {/* Horizontal Stacked Ratio Bar */}
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-[#F1F5F9] mb-5 gap-0.5">
                <div
                  className="bg-[#DC2626] h-full"
                  style={{ width: `${(critical / priorityTotal) * 100}%` }}
                  title={`Critical: ${critical}`}
                />
                <div
                  className="bg-[#EA580C] h-full"
                  style={{ width: `${(high / priorityTotal) * 100}%` }}
                  title={`High: ${high}`}
                />
                <div
                  className="bg-[#D97706] h-full"
                  style={{ width: `${(medium / priorityTotal) * 100}%` }}
                  title={`Medium: ${medium}`}
                />
                <div
                  className="bg-[#16A34A] h-full"
                  style={{ width: `${(low / priorityTotal) * 100}%` }}
                  title={`Low: ${low}`}
                />
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { label: 'Critical', count: critical, color: 'bg-[#DC2626]' },
                  { label: 'High', count: high, color: 'bg-[#EA580C]' },
                  { label: 'Medium', count: medium, color: 'bg-[#D97706]' },
                  { label: 'Low', count: low, color: 'bg-[#16A34A]' },
                ].map((row) => (
                  <button
                    key={row.label}
                    type="button"
                    onClick={() =>
                      setPriorityFilter(priorityFilter === row.label ? 'All' : row.label)
                    }
                    className={`flex items-center justify-between px-2 py-1 rounded text-left transition-colors cursor-pointer ${
                      priorityFilter === row.label ? 'bg-[#F1F5F9]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                      <span className="text-xs font-medium text-[#0F172A]">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-4 tabular-nums">
                      <span className="font-mono-tech text-xs font-semibold text-[#0F172A]">
                        {row.count}
                      </span>
                      <span className="font-mono-tech text-[11px] text-[#64748B] w-11 text-right">
                        {((row.count / priorityTotal) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="font-mono-tech text-[11px] text-[#64748B]">SLA Target</span>
              <span className="font-semibold text-[#DC2626]">Critical &lt; 2h Response</span>
            </div>
          </div>

          {/* Complaint Status Card (Section 27) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-[#0F172A]">Complaint Status</h2>
                <span className="font-mono-tech text-xs text-[#64748B]">Pipeline</span>
              </div>
              <p className="text-xs text-[#64748B] mb-4">
                Active work-order throughput lifecycle
              </p>

              {/* Clean SVG Donut Chart */}
              <div className="flex items-center justify-center my-3 relative">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="12"
                  />
                  {/* Reported */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#0284C7"
                    strokeWidth="12"
                    strokeDasharray={`${repLen} ${C}`}
                    strokeDashoffset="0"
                  />
                  {/* Assigned */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#6366F1"
                    strokeWidth="12"
                    strokeDasharray={`${assLen} ${C}`}
                    strokeDashoffset={-repLen}
                  />
                  {/* In Progress */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#D97706"
                    strokeWidth="12"
                    strokeDasharray={`${inpLen} ${C}`}
                    strokeDashoffset={-(repLen + assLen)}
                  />
                  {/* Resolved */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#059669"
                    strokeWidth="12"
                    strokeDasharray={`${resLen} ${C}`}
                    strokeDashoffset={-(repLen + assLen + inpLen)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-[#0F172A] tabular-nums">{total}</span>
                  <span className="font-mono-tech text-[10px] text-[#64748B]">TICKETS</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {[
                  { label: 'Reported', count: reported, dot: 'bg-[#0284C7]' },
                  { label: 'Assigned', count: assigned, dot: 'bg-[#6366F1]' },
                  { label: 'In Progress', count: inProgress, dot: 'bg-[#D97706]' },
                  { label: 'Resolved', count: resolved, dot: 'bg-[#059669]' },
                ].map((st) => (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() =>
                      setStatusFilter(statusFilter === st.label ? 'All' : st.label)
                    }
                    className={`p-2.5 rounded border text-left transition-colors cursor-pointer ${
                      statusFilter === st.label
                        ? 'bg-[#EFF6FF] border-[#2563EB]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                      <span className="font-mono-tech text-[10px] text-[#64748B]">
                        {st.label}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#0F172A] mt-1 tabular-nums">
                      {st.count}{' '}
                      <span className="text-[11px] font-normal text-[#64748B]">tickets</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recurring Issues Section (Section 28) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  <h2 className="text-sm font-bold text-[#0F172A]">Recurring Issues</h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] text-[11px] font-semibold">
                  {recurringClusters.length} Locations
                </span>
              </div>
              <p className="text-xs text-[#64748B] mb-4">
                Automated spatial cluster detection flagged repeated asset failures.
              </p>

              <div className="flex flex-col gap-3">
                {recurringClusters.map((cluster) => (
                  <Link
                    key={cluster.cluster_id}
                    to={`/admin/complaints/${cluster.complaint_id}`}
                    className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white transition-all group flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cluster.severity === 'Critical' ? 'bg-[#DC2626]' : 'bg-[#EA580C]'
                          }`}
                        />
                        <span className="text-xs font-bold text-[#0F172A]">
                          ⚠ {cluster.location_label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-[#2563EB]">{cluster.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tech font-semibold text-[#DC2626]">
                        {cluster.count} complaints
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] leading-relaxed">{cluster.summary}</p>

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="font-mono-tech text-[#64748B]">{cluster.cluster_id}</span>
                      <span className="font-semibold text-[#2563EB] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Inspect Complaint <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Complaints Registry Table (Sections 29 & 30) */}
        <ComplaintTable
          complaints={complaints}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
          onStatusFilterChange={setStatusFilter}
          onPriorityFilterChange={setPriorityFilter}
          onCategoryFilterChange={setCategoryFilter}
          onSearchQueryChange={setSearchQuery}
          onResetFilters={handleResetFilters}
        />
      </div>
    </AdminLayout>
  );
};
