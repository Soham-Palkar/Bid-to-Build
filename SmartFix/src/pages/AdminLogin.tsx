import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Loader2, AlertTriangle, KeyRound } from 'lucide-react';
import { PublicNavbar, PublicFooter } from '../components/Navbar';
import { adminLogin } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await adminLogin(username.trim(), password.trim());
      if (response.success) {
        login(response.token, response.admin);
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials.');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Invalid admin credentials. Use username "admin" and password "password".');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-lg p-6 sm:p-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-11 h-11 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A] mt-1">Admin Portal Login</h1>
            <p className="text-xs text-[#64748B]">
              Sign in to access the SmartFix Maintenance Command Center
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2.5 text-xs font-medium text-[#991B1B]">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form (Section 21) */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-username" className="text-xs font-semibold text-[#334155]">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full h-10 pl-9 pr-3 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-password" className="text-xs font-semibold text-[#334155]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-3 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Demo Credential Helper for Hackathon Evaluators */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>
                Demo Admin: <strong className="font-mono-tech text-[#0F172A]">admin</strong> /{' '}
                <strong className="font-mono-tech text-[#0F172A]">password</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('password');
                setError(null);
              }}
              className="font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Auto-Fill
            </button>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
