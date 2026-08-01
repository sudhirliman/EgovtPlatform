import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { ErrorBanner } from "../components/ui.jsx";
import {
  ShieldCheck, ShieldQuestion, User, Lock, Eye, EyeOff,
  Globe, Users, FileCheck2, TrendingUp, BadgeCheck, ChevronDown,
} from "lucide-react";

function AshokEmblem({ size = 36, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 52" fill="currentColor" className={className}>
      <ellipse cx="15" cy="8" rx="4.5" ry="5.5" />
      <ellipse cx="24" cy="6" rx="4.5" ry="5.5" />
      <ellipse cx="33" cy="8" rx="4.5" ry="5.5" />
      <rect x="10" y="13" width="28" height="3.5" rx="1" />
      <rect x="12" y="16.5" width="24" height="2" rx="1" />
      <circle cx="24" cy="28" r="8" fill="none" strokeWidth="2" stroke="currentColor" />
      <circle cx="24" cy="28" r="2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        return (
          <line key={i}
            x1={24 + 2 * Math.cos(r)} y1={28 + 2 * Math.sin(r)}
            x2={24 + 8 * Math.cos(r)} y2={28 + 8 * Math.sin(r)}
            strokeWidth="1.2" stroke="currentColor" />
        );
      })}
      <ellipse cx="13" cy="40" rx="6" ry="3" />
      <ellipse cx="35" cy="40" rx="6" ry="3" />
      <rect x="10" y="44" width="28" height="2.5" rx="1" opacity="0.7" />
    </svg>
  );
}

function GovBuilding() {
  return (
    <svg viewBox="0 0 360 190" xmlns="http://www.w3.org/2000/svg">
      {/* Background city silhouettes */}
      <rect x="5" y="85" width="28" height="95" rx="1" fill="#93c5fd" opacity="0.3" />
      <rect x="8" y="70" width="20" height="16" rx="1" fill="#93c5fd" opacity="0.3" />
      <rect x="38" y="98" width="22" height="82" rx="1" fill="#93c5fd" opacity="0.3" />
      <rect x="42" y="84" width="14" height="15" rx="1" fill="#93c5fd" opacity="0.3" />
      <rect x="296" y="85" width="28" height="95" rx="1" fill="#93c5fd" opacity="0.3" />
      <rect x="300" y="70" width="20" height="16" rx="1" fill="#93c5fd" opacity="0.3" />
      <rect x="270" y="98" width="22" height="82" rx="1" fill="#93c5fd" opacity="0.3" />
      <rect x="274" y="84" width="14" height="15" rx="1" fill="#93c5fd" opacity="0.3" />
      {/* Left trees */}
      <ellipse cx="78" cy="152" rx="22" ry="26" fill="#15803d" opacity="0.9" />
      <ellipse cx="65" cy="160" rx="17" ry="20" fill="#166534" opacity="0.9" />
      <rect x="75" y="152" width="5" height="26" fill="#713f12" />
      {/* Right trees */}
      <ellipse cx="282" cy="152" rx="22" ry="26" fill="#15803d" opacity="0.9" />
      <ellipse cx="295" cy="160" rx="17" ry="20" fill="#166534" opacity="0.9" />
      <rect x="280" y="152" width="5" height="26" fill="#713f12" />
      {/* Steps */}
      <rect x="108" y="158" width="144" height="8" rx="2" fill="#1e3a8a" />
      <rect x="116" y="151" width="128" height="8" rx="1" fill="#1e40af" />
      {/* Left wing */}
      <rect x="110" y="126" width="34" height="26" rx="1" fill="#1d4ed8" />
      {[115, 122, 129].map((x, i) => <rect key={i} x={x} y="126" width="3.5" height="26" fill="#93c5fd" opacity="0.4" />)}
      {/* Right wing */}
      <rect x="216" y="126" width="34" height="26" rx="1" fill="#1d4ed8" />
      {[219, 226, 233].map((x, i) => <rect key={i} x={x} y="126" width="3.5" height="26" fill="#93c5fd" opacity="0.4" />)}
      {/* Main hall */}
      <rect x="136" y="114" width="88" height="38" rx="1" fill="#1e40af" />
      {[142, 151, 160, 169, 178, 187, 196, 205].map((x, i) => <rect key={i} x={x} y="114" width="4" height="38" fill="#93c5fd" opacity="0.35" />)}
      {/* Dome */}
      <path d="M146 114 Q180 72 214 114 Z" fill="#1e3a8a" />
      <path d="M151 114 Q180 79 209 114 Z" fill="#2563eb" />
      <path d="M156 114 Q180 87 204 114 Z" fill="#1e40af" />
      {/* Dome finial */}
      <rect x="178" y="65" width="4" height="10" rx="1" fill="#1e3a8a" />
      <ellipse cx="180" cy="64" rx="4" ry="3" fill="#1e3a8a" />
      {/* Flag pole */}
      <rect x="179" y="36" width="2" height="30" fill="#9ca3af" />
      {/* Indian tricolor flag */}
      <rect x="181" y="36" width="25" height="6.5" rx="0.5" fill="#f97316" />
      <rect x="181" y="42.5" width="25" height="6.5" rx="0.5" fill="#f8fafc" />
      <rect x="181" y="49" width="25" height="6.5" rx="0.5" fill="#16a34a" />
      {/* Ashoka Chakra on flag */}
      <circle cx="193.5" cy="45.75" r="3" stroke="#1d4ed8" strokeWidth="0.8" fill="none" />
      <circle cx="193.5" cy="45.75" r="0.7" fill="#1d4ed8" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        return <line key={i} x1={193.5 + 0.7 * Math.cos(r)} y1={45.75 + 0.7 * Math.sin(r)} x2={193.5 + 3 * Math.cos(r)} y2={45.75 + 3 * Math.sin(r)} stroke="#1d4ed8" strokeWidth="0.5" />;
      })}
      {/* Ground */}
      <rect x="0" y="166" width="360" height="10" fill="#166534" opacity="0.2" />
    </svg>
  );
}

const FEATURES = [
  { icon: Users,       label: "Citizen Centric",       color: "#10b981", style: { top: "0%",   left: "50%",  transform: "translateX(-50%)" } },
  { icon: ShieldCheck, label: "Secure & Reliable",      color: "#7c3aed", style: { top: "22%",  left: "2%"   } },
  { icon: FileCheck2,  label: "Paperless Governance",   color: "#2563eb", style: { top: "22%",  right: "2%"  } },
  { icon: TrendingUp,  label: "Efficient Services",     color: "#f59e0b", style: { bottom: "6%",left: "2%"   } },
  { icon: BadgeCheck,  label: "Transparent Process",    color: "#0d9488", style: { bottom: "6%",right: "2%"  } },
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
      navigate(location.state?.from || "/", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* ── Top header bar ── */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a8a]">
            <AshokEmblem size={26} className="text-yellow-300" />
          </div>
          <div>
            <div className="text-[15px] font-bold leading-tight text-[#1e3a8a]">Government of Maharashtra</div>
            <div className="text-[11px] leading-tight text-slate-500">Administration Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-[12px] text-slate-600 hover:bg-slate-50">
            <Globe size={13} />
            <span>English</span>
            <ChevronDown size={11} />
          </div>
          <div className="flex items-center rounded-md border border-slate-200 text-[12px]">
            <button className="px-2 py-1 text-slate-500 hover:bg-slate-50">A-</button>
            <button className="border-x border-slate-200 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50">A</button>
            <button className="px-2 py-1 text-[14px] text-slate-700 hover:bg-slate-50">A+</button>
          </div>
        </div>
      </div>

      {/* ── Main split ── */}
      <div className="flex flex-1">
        {/* Left illustration panel */}
        <div
          className="relative hidden overflow-hidden lg:flex lg:w-[58%] lg:flex-col"
          style={{ background: "linear-gradient(180deg,#eff6ff 0%,#bfdbfe 55%,#93c5fd 100%)" }}
        >
          {/* Title */}
          <div className="relative z-10 pt-10 text-center">
            <h1 className="text-[30px] font-extrabold tracking-tight text-[#1e3a8a]">MHADA e-Mitra</h1>
            <h2 className="text-[18px] font-semibold text-blue-700">Administration Portal</h2>
            <p className="mt-1 text-[13px] text-blue-700 opacity-80">
              One Platform, Many Services<br />Transparent. Efficient. Convenient.
            </p>
          </div>

          {/* Feature chips + building */}
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <div className="relative w-full max-w-lg" style={{ height: 340 }}>
              {/* Building centered */}
              <div className="absolute inset-x-0" style={{ top: "12%", padding: "0 72px" }}>
                <GovBuilding />
              </div>
              {/* Floating feature chips */}
              {FEATURES.map(({ icon: Icon, label, color, style }) => (
                <div key={label} className="absolute flex flex-col items-center gap-1.5" style={style}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: color }}>
                    <Icon size={20} color="white" />
                  </div>
                  <span className="whitespace-nowrap text-[11px] font-semibold text-[#1e3a8a]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Wave footer */}
          <div className="relative h-20">
            <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <path d="M0 35 Q150 5 300 35 Q450 65 600 35 Q750 5 900 35 Q1050 65 1200 35 L1200 80 L0 80 Z" fill="#1e3a8a" opacity="0.88" />
              <path d="M0 52 Q150 28 300 52 Q450 76 600 52 Q750 28 900 52 Q1050 76 1200 52 L1200 80 L0 80 Z" fill="#1e3a8a" />
            </svg>
          </div>
        </div>

        {/* Right login panel */}
        <div className="flex w-full flex-col items-center justify-center bg-white px-8 py-10 lg:w-[42%]">
          <div className="w-full max-w-[400px]">
            <h2 className="mb-1 text-[24px] font-bold text-slate-900">Welcome Back!</h2>
            <p className="mb-6 text-[13px] text-slate-500">Login to continue to e-Service Administration Portal</p>

            <ErrorBanner message={error} />

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Username / Employee ID</label>
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-300 px-3.5 py-2.5 transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                  <User size={15} className="shrink-0 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400"
                    placeholder="Enter Username or Employee ID"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password</label>
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-300 px-3.5 py-2.5 transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                  <Lock size={15} className="shrink-0 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-blue-700" />
                  Remember Me
                </label>
                <button type="button" className="font-medium text-blue-700 hover:underline">Forgot Password?</button>
              </div>

              <button
                type="submit" disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#1e40af] py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#1e3a8a] disabled:opacity-50"
              >
                <Lock size={15} />
                {submitting ? "Signing in…" : "LOGIN"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[12px] text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => setError("SSO is not configured yet — use username/mobile + password.")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1e40af] py-2.5 text-[14px] font-semibold text-[#1e40af] hover:bg-blue-50"
            >
              <ShieldQuestion size={15} />
              Login with SSO
            </button>

            <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3.5 text-[12px]">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <div className="font-semibold text-emerald-800">Your information is secure with us</div>
                <div className="mt-0.5 text-emerald-700">
                  This site is protected by reCAPTCHA and the Google{" "}
                  <button className="underline hover:text-emerald-900">Privacy Policy</button> and{" "}
                  <button className="underline hover:text-emerald-900">Terms of Service</button> apply.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="flex flex-wrap items-center justify-between gap-2 bg-[#1e3a8a] px-8 py-3 text-[12px] text-blue-200">
        <span>© 2026 Government of Maharashtra. All Rights Reserved.</span>
        <div className="flex flex-wrap items-center gap-5">
          {["Privacy Policy", "Terms & Conditions", "Help Desk", "Contact Us"].map(l => (
            <button key={l} className="hover:text-white hover:underline">{l}</button>
          ))}
          <span className="text-blue-400">Version 1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
