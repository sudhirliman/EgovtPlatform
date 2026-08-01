import React from "react";
import { X, ChevronRight } from "lucide-react";

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-medium text-slate-900">{title}</h1>
        {subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>{children}</div>;
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800",
    secondary: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      {label && <span className="text-slate-600">{label}</span>}
      <input
        className={`rounded-md border border-slate-300 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      {label && <span className="text-slate-600">{label}</span>}
      <select
        className={`rounded-md border border-slate-300 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Table({ columns, rows, keyField = "id", emptyText = "No records yet" }) {
  if (!rows || rows.length === 0) {
    return <div className="py-8 text-center text-[13px] text-slate-400">{emptyText}</div>;
  }
  return (
    <table className="w-full border-collapse text-left text-[13px]">
      <thead>
        <tr className="text-slate-500">
          {columns.map((c) => (
            <th key={c.key} className="py-1.5 pr-2 font-normal">
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[keyField]} className="border-t border-slate-200">
            {columns.map((c) => (
              <td key={c.key} className="py-2 pr-2">
                {c.render ? c.render(row) : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Badge({ tone = "default", children }) {
  const tones = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-700",
  };
  return <span className={`rounded-md px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{message}</div>;
}

export function LoadingRow({ label = "Loading..." }) {
  return <div className="py-8 text-center text-[13px] text-slate-400">{label}</div>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="mb-4 flex gap-1 border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3 py-2 text-[13px] transition-colors ${
            active === t.key
              ? "border-b-2 border-blue-700 font-medium text-blue-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function VerticalStepper({ steps, activeIndex, completedIndexes = [], onSelect }) {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = completedIndexes.includes(i);
        return (
          <button
            key={step.key}
            onClick={() => onSelect && onSelect(i)}
            disabled={!onSelect}
            className={`flex items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
              isActive ? "bg-blue-50" : "hover:bg-slate-50"
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                isDone
                  ? "bg-emerald-100 text-emerald-700"
                  : isActive
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {isDone ? "\u2713" : i + 1}
            </span>
            <span>
              <div className={`text-[13px] ${isActive ? "font-medium text-blue-800" : "text-slate-700"}`}>{step.label}</div>
              {step.subtitle && <div className="text-xs text-slate-400">{step.subtitle}</div>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SlideOver({ open, title, onClose, children, width = "w-[420px]" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div className={`h-full ${width} bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-[15px] font-medium text-slate-900">{title}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="h-[calc(100%-57px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[13px] text-slate-500">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={13} className="text-slate-300" aria-hidden="true" />}
          {item.onClick ? (
            <button onClick={item.onClick} className="hover:text-blue-700 hover:underline">
              {item.label}
            </button>
          ) : (
            <span className={i === items.length - 1 ? "text-slate-700" : ""}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 text-[13px] text-slate-700">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-blue-700" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
      {label}
    </label>
  );
}
