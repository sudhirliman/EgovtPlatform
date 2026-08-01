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
  Search,
  PlusCircle,
  Landmark,
  Layers,
  Boxes,
  ListChecks,
  Globe,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Master",
    items: [
      { to: "/master/boards", label: "Board", icon: Building2 },
      { to: "/master/departments", label: "Department", icon: Layers },
      { to: "/master/services", label: "Services", icon: Boxes },
      { to: "/master/form-fields", label: "Form Fields", icon: ListChecks },
    ],
  },
  {
    label: "Services",
    items: [
      { to: "/services/new", label: "Add new service", icon: PlusCircle },
      { to: "/workflow-builder", label: "Workflow builder", icon: GitBranch },
      { to: "/form-designer", label: "Form designer", icon: FileStack },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/applications", label: "Applications", icon: FileText },
      { to: "/payments", label: "Payments", icon: CreditCard },
      { to: "/tickets", label: "Support tickets", icon: LifeBuoy },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users-roles", label: "Users & roles", icon: Users },
      { to: "/reports", label: "Reports & analytics", icon: BarChart3 },
    ],
  },
];

function NavGroup({ label, items }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-1">
      {label && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
        >
          {label}
          <ChevronDown size={12} className={`transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true" />
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
                    ? "bg-blue-900 font-medium text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={16} aria-hidden="true" />
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
  const [fontStep, setFontStep] = useState(1); // index into FONT_STEPS, default = 14px
  const [language, setLanguage] = useState("English");

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function applyFontSize(step) {
    const clamped = Math.max(0, Math.min(FONT_STEPS.length - 1, step));
    setFontStep(clamped);
    document.documentElement.style.fontSize = `${FONT_STEPS[clamped]}px`;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-800 text-white">
            <Landmark size={17} aria-hidden="true" />
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-tight text-slate-900">MHADA e-Mitra</div>
            <div className="text-[11px] leading-tight text-slate-500">Admin Portal</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_GROUPS.map((g, i) => (
            <NavGroup key={i} label={g.label} items={g.items} />
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[12px] text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex w-96 items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-[13px] text-slate-400">
            <Search size={14} aria-hidden="true" />
            Search applications, services, users...
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center overflow-hidden rounded-md border border-slate-200">
              <button
                onClick={() => applyFontSize(fontStep - 1)}
                className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                disabled={fontStep === 0}
                title="Decrease text size"
              >
                A-
              </button>
              <button
                onClick={() => applyFontSize(1)}
                className="border-x border-slate-200 px-2 py-1 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                title="Reset text size"
              >
                A
              </button>
              <button
                onClick={() => applyFontSize(fontStep + 1)}
                className="px-2 py-1 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                disabled={fontStep === FONT_STEPS.length - 1}
                title="Increase text size"
              >
                A+
              </button>
            </div>

            <button
              onClick={() => setLanguage((l) => (l === "English" ? "\u092e\u0930\u093e\u0920\u0940" : "English"))}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] text-slate-600 hover:bg-slate-50"
            >
              <Globe size={14} aria-hidden="true" />
              {language}
              <ChevronDown size={12} aria-hidden="true" />
            </button>

            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell size={18} aria-hidden="true" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
                3
              </span>
            </button>
            <button className="text-slate-500 hover:text-slate-700">
              <HelpCircle size={18} aria-hidden="true" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-800 text-[12px] font-medium text-white">
                {initials}
              </div>
              <div className="text-left">
                <div className="text-[13px] font-medium leading-tight text-slate-800">{user?.name}</div>
                <div className="text-[11px] leading-tight text-slate-500">Super Administrator</div>
              </div>
              <ChevronDown size={14} className="text-slate-400" aria-hidden="true" />
              <button onClick={logout} className="ml-1 text-slate-400 hover:text-red-600" title="Sign out">
                <LogOut size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
