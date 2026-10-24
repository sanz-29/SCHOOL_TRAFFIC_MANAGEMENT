import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth, getRoleLandingPage, isRouteAllowedForRole } from '../auth';
import {
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Car,
  Clock,
  Layers,
  FileText
} from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role, sessionTimeoutMessage, clearSessionTimeoutMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rate limiting / Lockout state: lock for 30 seconds after 5 failed attempts
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // If already authenticated, redirect to role's landing page
  useEffect(() => {
    if (isAuthenticated && role) {
      const redirectTarget = getRoleLandingPage(role);
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    if (lockoutRemaining > 0) return;
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0 || isSubmitting) return;

    // Validate fields with zod
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });

      // Check if user came from a protected URL in location.state
      const attemptedUrl = (location.state as any)?.from;
      let targetPath = getRoleLandingPage(user.role);

      if (attemptedUrl && isRouteAllowedForRole(user.role, attemptedUrl)) {
        targetPath = attemptedUrl;
      }

      navigate(targetPath, { replace: true });
    } catch (err: any) {
      const newFailedCount = failedAttempts + 1;
      setFailedAttempts(newFailedCount);

      if (newFailedCount >= 5) {
        setLockoutRemaining(30);
        setErrors({
          general: 'Too many unsuccessful attempts. Security lockout active for 30 seconds.',
        });
      } else {
        // Generic error message: NEVER reveal whether email or password was wrong
        setErrors({
          general: 'Invalid email or password. Please verify credentials or select a demo account.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col justify-between">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl border border-blue-100 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
          
          {/* Left Panel: Primary Blue Branding (#1D4ED8) */}
          <div className="md:col-span-5 bg-[#1D4ED8] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle architectural background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#EFF6FF_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="relative z-10">
              {/* Logo & Brand Wordmark */}
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-white text-[#1D4ED8] flex items-center justify-center font-black text-lg shadow-md">
                  G
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-white leading-none">
                    GateFlow <span className="text-blue-200">AI</span>
                  </div>
                  <div className="text-[10px] text-blue-200 font-medium tracking-wide mt-0.5">
                    DECISION SUPPORT
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div className="mb-6">
                <h1 className="text-lg sm:text-xl font-semibold text-white leading-snug">
                  School-gate traffic planning and decision support
                </h1>
                <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                  Test staggered class schedules and curbside pickup zones in a high-fidelity simulation before applying them to physical roads.
                </p>
              </div>

              {/* 3 Short Feature Points */}
              <div className="space-y-3.5 pt-2 border-t border-blue-600/60 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-blue-600/80 text-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Car className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Prevent Road Spillback</strong>
                    <span className="text-blue-100 text-[11px] leading-tight block mt-0.5">
                      Simulate queue dynamics and vehicle idling outside the school cordon.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-blue-600/80 text-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Safe Kerbside Zones</strong>
                    <span className="text-blue-100 text-[11px] leading-tight block mt-0.5">
                      Enforce physical capacity limits and verified safety checklists.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-blue-600/80 text-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Verified Parent Notices</strong>
                    <span className="text-blue-100 text-[11px] leading-tight block mt-0.5">
                      Automated bilingual circulars matched with zero transcription error.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statutory Disclaimer Badge */}
            <div className="relative z-10 mt-6 pt-4 border-t border-blue-600/60 text-[10px] text-blue-200 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span>Principal retains final statutory administrative discretion</span>
            </div>
          </div>

          {/* Right Panel: White Card Login Form */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div>
              {/* Form Header */}
              <div className="pb-4 mb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Sign In to Workspace
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Role and permissions are determined automatically by your school account.
                </p>
              </div>

              {/* Inactivity Logout Banner */}
              {sessionTimeoutMessage && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{sessionTimeoutMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSessionTimeoutMessage}
                    className="text-amber-700 hover:text-amber-900 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Generic Error Banner */}
              {errors.general && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errors.general}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    School Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="e.g. principal@gateflow.demo"
                    disabled={lockoutRemaining > 0 || isSubmitting}
                    className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-blue-600 transition-colors bg-white ${
                      errors.email
                        ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                        : 'border-blue-200 text-slate-900'
                    }`}
                  />
                  {errors.email && (
                    <span className="text-[11px] text-rose-600 mt-1 block">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      placeholder="Enter account password"
                      disabled={lockoutRemaining > 0 || isSubmitting}
                      className={`w-full px-3.5 py-2 pr-10 text-xs border rounded-lg focus:outline-blue-600 transition-colors bg-white ${
                        errors.password
                          ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                          : 'border-blue-200 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={lockoutRemaining > 0 || isSubmitting}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-[11px] text-rose-600 mt-1 block">
                      {errors.password}
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={lockoutRemaining > 0 || isSubmitting}
                  className="w-full mt-2 py-2.5 bg-blue-700 text-white font-semibold rounded-lg text-xs hover:bg-blue-800 transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : lockoutRemaining > 0 ? (
                    <span>Locked ({lockoutRemaining}s remaining)</span>
                  ) : (
                    <>
                      <span>Sign In to Decision Suite</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Accounts Panel */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    One-Click Demo Accounts
                  </span>
                  <span className="text-[10px] text-blue-600">Click chip to autofill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoFill('principal@gateflow.demo', 'Principal@123')}
                    className="p-2 text-left rounded-lg border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-300 transition-colors text-xs group cursor-pointer"
                  >
                    <div className="font-semibold text-blue-900 flex items-center justify-between">
                      <span>Principal</span>
                      <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Fill ↵
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">Dr. Revathy (Admin)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoFill('transport@gateflow.demo', 'Transport@123')}
                    className="p-2 text-left rounded-lg border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-300 transition-colors text-xs group cursor-pointer"
                  >
                    <div className="font-semibold text-blue-900 flex items-center justify-between">
                      <span>Transport</span>
                      <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Fill ↵
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">S. Ramanathan (Lead)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoFill('gate@gateflow.demo', 'Gate@123')}
                    className="p-2 text-left rounded-lg border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-300 transition-colors text-xs group cursor-pointer"
                  >
                    <div className="font-semibold text-blue-900 flex items-center justify-between">
                      <span>Gate Staff</span>
                      <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Fill ↵
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">M. Selvam (Marshal)</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Parent Notice Direct Link & Footer */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <Link
                to="/notice/public"
                className="text-blue-700 hover:text-blue-900 font-semibold text-[11px] inline-flex items-center gap-1"
              >
                <span>View parent notice (No login required)</span>
                <span>→</span>
              </Link>

              <span className="text-[10px] text-slate-400">
                Session validity: 30-min inactivity timeout
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Bottom Disclaimer */}
      <div className="py-3 text-center text-xs text-slate-500 border-t border-blue-100 bg-white">
        Results are simulated under stated assumptions. Real-world benefit needs a school pilot.
      </div>
    </div>
  );
};
