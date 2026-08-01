import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { ErrorBanner } from "../components/ui.jsx";
import {
  Landmark,
  ShieldCheck,
  Users,
  FileCheck2,
  TrendingUp,
  BadgeCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldQuestion,
} from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck, label: "Secure & Reliable", pos: "left-6 top-24" },
  { icon: Users, label: "Citizen Centric", pos: "left-1/2 -translate-x-1/2 top-2" },
  { icon: FileCheck2, label: "Paperless Governance", pos: "right-6 top-24" },
  { icon: TrendingUp, label: "Efficient Services", pos: "left-6 bottom-16" },
  { icon: BadgeCheck, label: "Transparent Process", pos: "right-6 bottom-16" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(identifier, password);
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left illustration panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-b from-sky-100 to-blue-200 lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-x-0 bottom-0 h-40 bg-blue-900/90" style={{ clipPath: "ellipse(70% 100% at 50% 100%)" }} />

        <div className="relative flex h-full w-full items-center justify-center">
          {FEATURES.map(({ icon: Icon, label, pos }) => (
            <div key={label} className={`absolute ${pos} flex flex-col items-center gap-2`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md">
                <Icon size={20} className="text-blue-700" aria-hidden="true" />
              </div>
              <span className="text-xs font-medium text-blue-900">{label}</span>
            </div>
          ))}

          <div className="z-10 flex flex-col items-center gap-4 px-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg">
              <Landmark size={36} className="text-blue-800" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-blue-950">MHADA e-Mitra</h1>
            <p className="text-sm text-blue-800">
              One Platform, Many Services
              <br />
              Transparent. Efficient. Convenient.
            </p>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex w-full flex-col justify-between lg:w-1/2">
        <div className="flex items-center gap-2 px-8 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-800 text-white">
            <Landmark size={16} aria-hidden="true" />
          </div>
          <span className="text-[13px] font-semibold text-slate-800">MHADA e-Mitra</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="w-full max-w-sm">
            <h2 className="mb-1 text-2xl font-bold text-slate-900">Welcome Back!</h2>
            <p className="mb-6 text-[13px] text-slate-500">Login to continue to MHADA e-Mitra</p>

            <ErrorBanner message={error} />

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Username / Mobile Number</label>
                <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 focus-within:border-blue-600">
                  <User size={16} className="text-slate-400" aria-hidden="true" />
                  <input
                    className="w-full text-[13px] outline-none"
                    placeholder="Enter username or mobile number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-700">Password</label>
                <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 focus-within:border-blue-600">
                  <Lock size={16} className="text-slate-400" aria-hidden="true" />
                  <input
                    className="w-full text-[13px] outline-none"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-slate-400">
                    {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Remember Me
                </label>
                <button type="button" className="text-blue-700 hover:underline">Forgot Password?</button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 flex items-center justify-center gap-2 rounded-md bg-blue-800 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-blue-900 disabled:opacity-50"
              >
                <Lock size={15} aria-hidden="true" />
                {submitting ? "Signing in..." : "LOGIN"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              or
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => setError("SSO is not configured yet - use username/mobile + password.")}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-blue-700 py-2.5 text-[14px] font-medium text-blue-700 hover:bg-blue-50"
            >
              <ShieldQuestion size={15} aria-hidden="true" />
              Login with SSO
            </button>

            <p className="mt-5 flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck size={26} className="shrink-0 text-emerald-600" aria-hidden="true" />
              <span>
                Your information is secure with us. First run? Seed superadmin: username{" "}
                <code>superadmin</code> (or mobile <code>9999999999</code>), password{" "}
                <code>changeme123</code> - change this immediately (see backend README).
              </span>
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-8 py-4 text-center text-xs text-slate-400">
          &copy; 2026 MHADA e-Mitra. All rights reserved.
        </div>
      </div>
    </div>
  );
}
