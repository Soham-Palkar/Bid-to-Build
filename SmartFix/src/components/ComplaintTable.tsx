import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpRight, AlertTriangle } from 'lucide-react';
import type { Complaint } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { getInitials } from '../utils/formatters';

interface ComplaintTableProps {
  complaints: Complaint[];
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  searchQuery: string;
  onStatusFilterChange: (val: string) => void;
  onPriorityFilterChange: (val: string) => void;
  onCategoryFilterChange: (val: string) => void;
  onSearchQueryChange: (val: string) => void;
  onResetFilters: () => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  statusFilter,
  priorityFilter,
  categoryFilter,
  searchQuery,
  onStatusFilterChange,
  onPriorityFilterChange,
  onCategoryFilterChange,
  onSearchQueryChange,
  onResetFilters,
}) => {
  const hasActiveFilters =
    statusFilter !== 'All' ||
    priorityFilter !== 'All' ||
    categoryFilter !== 'All' ||
    searchQuery.trim() !== '';

  return (
    <div
      id="complaints-registry-section"
      className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden flex flex-col"
    >
      {/* Table Header & Filter Controls (Sections 29 & 30) */}
      <div className="p-5 border-b border-[#E2E8F0] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Recent Complaints</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Direct maintenance intake registry with priority triage, worker assignment, and status
              tracking
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Filter className="w-3.5 h-3.5" />
            <span className="tabular-nums font-medium text-[#0F172A]">
              Showing {complaints.length} complaints
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-semibold text-[#2563EB] hover:underline ml-2 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* 4 Essential Filters: Status, Priority, Category, Search Complaint ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-3">
            <label htmlFor="filter-status" className="sr-only">
              Filter by Status
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full h-9 px-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#2563EB]"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="filter-priority" className="sr-only">
              Filter by Priority
            </label>
            <select
              id="filter-priority"
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="w-full h-9 px-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#2563EB]"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="filter-category" className="sr-only">
              Filter by Category
            </label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full h-9 px-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#2563EB]"
            >
              <option value="All">All Categories</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Furniture">Furniture</option>
              <option value="HVAC">HVAC</option>
              <option value="Civil / Infrastructure">Civil / Infrastructure</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="lg:col-span-3 relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search Complaint ID (e.g. COM-2026)..."
              className="w-full h-9 pl-8 pr-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:bg-white focus:border-[#2563EB]"
            />
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      {complaints.length === 0 ? (
        <div className="py-12 px-4 text-center flex flex-col items-center gap-2">
          <p className="text-sm font-semibold text-[#0F172A]">No complaints found.</p>
          <p className="text-xs text-[#64748B]">
            No records match the current filters. Try resetting your filter selection.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 px-3 py-1.5 rounded bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-[11px] font-mono-tech text-[#475569]">
                <th className="py-3 px-4 font-semibold">Complaint ID</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Assigned To</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm text-[#0F172A]">
              {complaints.map((item) => (
                <tr
                  key={item.complaint_id}
                  className="hover:bg-[#F8FAFC] transition-colors group"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/complaints/${item.complaint_id}`}
                        className="font-mono-tech text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        {item.complaint_id}
                      </Link>
                      {item.is_recurring && (
                        <span
                          title={`Recurring issue: ${item.previous_complaint_count} previous complaints`}
                          className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#B45309]"
                        >
                          <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-[#0F172A]">{item.category}</span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#0F172A]">
                        {item.location.room}
                      </span>
                      <span className="text-[11px] text-[#64748B]">{item.location.building}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <PriorityBadge priority={item.priority} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={item.status} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.assigned_worker ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] font-mono-tech text-[10px] font-bold flex items-center justify-center shrink-0">
                          {getInitials(item.assigned_worker.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-[#0F172A] leading-none">
                            {item.assigned_worker.name}
                          </span>
                          <span className="text-[11px] text-[#64748B] mt-0.5 leading-none">
                            {item.assigned_worker.specialization.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[#64748B] italic">— (Unassigned)</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <Link
                      to={`/admin/complaints/${item.complaint_id}`}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                        !item.assigned_worker && item.priority === 'Critical'
                          ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                          : !item.assigned_worker
                          ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                          : 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      <span>{!item.assigned_worker ? 'Assign' : 'View Details'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
