import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  FileStack,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  LifeBuoy,
  LogOut,
  ChevronDown,
  Bell,
  HelpCircle,
  PlusCircle,
  Layers,
  Boxes,
  ListChecks,
  CheckCircle2,
  Clock,
  User,
  ClipboardList,
  Shield,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

function AshokEmblem({ size = 32, className = "" }) {
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

const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Master Setup",
    items: [
      { to: "/master/boards", label: "Boards", icon: Building2 },
      { to: "/master/departments", label: "Departments", icon: Layers },
      { to: "/master/services", label: "Services", icon: Boxes },
      { to: "/master/form-fields", label: "Form Fields", icon: ListChecks },
    ],
  },
  {
    label: "Services",
    items: [
      { to: "/services/new", label: "Add New Service", icon: PlusCircle },
      { to: "/workflow-builder", label: "Workflow Builder", icon: GitBranch },
      { to: "/form-designer", label: "Form Designer", icon: FileStack },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/applications", label: "Applications", icon: FileText },
      { to: "/cfc/queue", label: "CFC Queue", icon: ClipboardList },
      { to: "/payments", label: "Payments", icon: CreditCard },
      { to: "/tickets", label: "Support Tickets", icon: LifeBuoy },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users", icon: Users },
      { to: "/roles", label: "Roles", icon: Shield },
      { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
    ],
  },
];

function NavGroup({ label, items }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-0.5">
      {label && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-300"
        >
          {label}
          <ChevronDown size={11} className={`transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
      )}
      {open && (
        <div className="flex flex-col gap-0.5 px-2">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                  isActive
                    ? "bg-blue-700 font-semibold text-white shadow"
                    : "text-slate-300 hover:bg-[#243254] hover:text-white"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

const FONT_STEPS = [13, 14, 15, 16, 17];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [fontStep, setFontStep] = useState(1);
  const [language, setLanguage] = useState("English");
  const [notifCount] = useState(12);

  const initials = (user?.name || "?")
    .split(" ")
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function applyFontSize(step) {
    const clamped = Math.max(0, Math.min(FONT_STEPS.length - 1, step));
    setFontStep(clamped);
    document.documentElement.style.fontSize = `${FONT_STEPS[clamped]}px`;
  }

  const lastLogin = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="flex h-screen flex-col">

      {/* ══ Full-width Header ══ */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        {/* Left: hamburger + emblem + portal name */}
        <div className="flex items-center gap-3">
          <button className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="4" width="16" height="2" rx="1"/>
              <rect x="2" y="9" width="16" height="2" rx="1"/>
              <rect x="2" y="14" width="16" height="2" rx="1"/>
            </svg>
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400">
            <AshokEmblem size={24} className="text-[#1a2744]" />
          </div>
          <div>
            <div className="text-[15px] font-bold leading-tight text-slate-900">e-Service Administration Portal</div>
            <div className="text-[11px] leading-tight text-slate-500">Government of India</div>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-4">
          {/* Font size — borderless */}
          <div className="flex items-center gap-1 text-[13px]">
            <button onClick={() => applyFontSize(fontStep - 1)} disabled={fontStep === 0}
              className="px-1 font-medium text-slate-500 hover:text-slate-800 disabled:opacity-30" title="Decrease text size">A-</button>
            <button onClick={() => applyFontSize(1)}
              className="px-1 font-semibold text-slate-700 hover:text-slate-900" title="Reset text size">A</button>
            <button onClick={() => applyFontSize(fontStep + 1)} disabled={fontStep === FONT_STEPS.length - 1}
              className="px-1 text-[15px] font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-30" title="Increase text size">A+</button>
          </div>

          {/* Language */}
          <button onClick={() => setLanguage(l => l === "English" ? "मराठी" : "English")}
            className="flex items-center gap-1 text-[13px] text-slate-600 hover:text-slate-900">
            {language}
            <ChevronDown size={13} />
          </button>

          {/* Notification bell */}
          <button className="relative text-slate-500 hover:text-slate-700">
            <Bell size={20} />
            {notifCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notifCount}
              </span>
            )}
          </button>

          {/* Help */}
          <button className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:text-slate-700">
            <HelpCircle size={15} />
          </button>

          {/* User */}
          <div className="flex cursor-pointer items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <User size={16} />
            </div>
            <div className="text-left">
              <div className="text-[13px] font-semibold leading-tight text-slate-800">{user?.name}</div>
              <div className="text-[11px] leading-tight text-slate-500">Super Administrator</div>
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </div>

          <button onClick={logout} className="text-slate-400 hover:text-red-600" title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ══ Below header: sidebar + content ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* Dark navy sidebar */}
        <aside className="flex w-64 shrink-0 flex-col" style={{ backgroundColor: "#1a2744", borderRight: "1px solid #243254" }}>
          <nav className="flex-1 overflow-y-auto py-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:[background:#243254]">
            {NAV_GROUPS.map((g, i) => (
              <NavGroup key={i} label={g.label} items={g.items} />
            ))}
          </nav>

          {/* System status + last login */}
          <div style={{ borderTop: "1px solid #243254" }} className="space-y-2 p-3">
            <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px]" style={{ backgroundColor: "#0f1e38" }}>
              <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
              <div>
                <div className="font-semibold text-emerald-400">System Status</div>
                <div className="text-[11px] text-slate-400">All systems operational</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px]" style={{ backgroundColor: "#0f1e38" }}>
              <Clock size={13} className="shrink-0 text-slate-400" />
              <div>
                <div className="font-semibold text-slate-300">Last Login</div>
                <div className="text-[11px] text-slate-400">{lastLogin}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
