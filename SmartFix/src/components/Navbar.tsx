import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isReportActive = location.pathname === '/';
  const isTrackActive = location.pathname === '/track';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-8 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element Brand Zone */}
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-[#0F172A] hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0"
        >
          SmartFix
        </Link>

        {/* Zone 2: Primary navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              isReportActive
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Report Issue
          </Link>
          <Link
            to="/track"
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              isTrackActive
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Track Complaint
          </Link>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3">
          <Link
            to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded transition-colors whitespace-nowrap shrink-0"
          >
            {isAuthenticated ? 'Admin Dashboard' : 'Admin Login'}
          </Link>
        </div>
      </div>
    </header>
  );
};

export const PublicFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-[#E2E8F0] py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#0F172A]">SmartFix</span>
          <span aria-hidden="true">·</span>
          <span>Smart Maintenance &amp; Predictive Complaint Management (PS-07)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            Facilities Desk: <strong className="font-mono-tech text-[#0F172A]">ext-4091</strong>
          </span>
          <span aria-hidden="true">·</span>
          <a
            href="mailto:facilities@campus.edu"
            className="hover:text-[#2563EB] underline decoration-[#CBD5E1] transition-colors"
          >
            facilities@campus.edu
          </a>
        </div>
      </div>
    </footer>
  );
};

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: 'dashboard' | 'complaints';
  onSelectComplaintsTab?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab = 'dashboard',
  onSelectComplaintsTab,
}) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleComplaintsClick = (e: React.MouseEvent) => {
    if (location.pathname === '/admin/dashboard' && onSelectComplaintsTab) {
      e.preventDefault();
      onSelectComplaintsTab();
      const el = document.getElementById('complaints-registry-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/admin/dashboard#complaints');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar (240px on desktop, top bar on mobile) */}
      <aside className="w-full lg:w-60 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-b lg:border-b-0 lg:border-r border-[#E2E8F0] z-40 flex flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-[#E2E8F0]">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                SF
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#0F172A] leading-none">SmartFix</span>
                <span className="font-mono-tech text-[10px] text-[#64748B] mt-1">
                  Admin Operations
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links (Strictly Dashboard & Complaints per Section 23) */}
          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            <Link
              to="/admin/dashboard"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard' && location.pathname === '/admin/dashboard'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </Link>

            <a
              href="#complaints-registry-section"
              onClick={handleComplaintsClick}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'complaints' || location.pathname.startsWith('/admin/complaints/')
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Complaints</span>
            </a>
          </nav>
        </div>

        {/* Bottom Admin & Logout Section (per Section 23) */}
        <div className="p-3 border-t border-[#E2E8F0] flex lg:flex-col items-center lg:items-stretch justify-between gap-2">
          <div className="px-3 py-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#0F172A] truncate">
                {admin?.username || 'Admin'}
              </span>
              <span className="text-[11px] text-[#64748B] truncate">
                {admin?.name || 'Facilities Admin'}
              </span>
            </div>
          </div>

          <div className="flex lg:flex-col gap-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Public Portal</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        {/* Top Bar Contract for Admin Workspace */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span className="font-mono-tech text-[#0F172A] font-semibold">SmartFix PS-07</span>
            <span aria-hidden="true">/</span>
            <span>Campus Maintenance Operations</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#047857] font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Authenticated Admin Session</span>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};
