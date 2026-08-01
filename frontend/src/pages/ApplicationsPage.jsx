import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { applicationsApi, boardsApi, departmentsApi, servicesApi, workflowApi } from "../api/client";
import { ErrorBanner, Badge, LoadingRow } from "../components/ui.jsx";
import {
  Home, ChevronRight, Plus, Download, Columns3,
  Search, RefreshCcw, SlidersHorizontal, FileText,
} from "lucide-react";

const STATUS_TONE = {
  DRAFT: "default",
  SUBMITTED: "warning",
  IN_PROGRESS: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  DISPATCHED: "success",
};

const STATUSES = ["DRAFT", "SUBMITTED", "IN_PROGRESS", "APPROVED", "REJECTED", "DISPATCHED"];

const STAGE_COLOR = {
  "Verification":     { bg: "#dbeafe", text: "#1d4ed8" },
  "Scrutiny":         { bg: "#dbeafe", text: "#1d4ed8" },
  "Technical Review": { bg: "#ede9fe", text: "#6d28d9" },
  "Approval":         { bg: "#dcfce7", text: "#15803d" },
  "Payment":          { bg: "#fef3c7", text: "#b45309" },
};

function StageBadge({ label }) {
  const s = STAGE_COLOR[label];
  if (!s) return <span className="text-slate-400 text-[12px]">—</span>;
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>
      {label}
    </span>
  );
}

function Breadcrumb() {
  return (
    <nav className="mb-4 flex items-center gap-1 text-[12px] text-slate-500">
      <Home size={12} />
      <Link to="/" className="hover:text-blue-700">Dashboard</Link>
      <ChevronRight size={11} />
      <span className="hover:text-blue-700 cursor-pointer">Applications</span>
      <ChevronRight size={11} />
      <span className="font-medium text-slate-700">Application List</span>
    </nav>
  );
}

const PAGE_SIZES = [10, 25, 50, 100];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    boardId: "",
    departmentId: "",
    serviceId: "",
    status: "",
    fromDate: "",
    toDate: "",
  });

  async function load() {
    try {
      setLoading(true);
      const [apps, b] = await Promise.all([applicationsApi.list(), boardsApi.list()]);
      setApplications(apps);
      setBoards(b);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!filters.boardId) return setDepartments([]);
    departmentsApi.list(filters.boardId).then(setDepartments).catch(e => setError(e.message));
  }, [filters.boardId]);

  useEffect(() => {
    if (!filters.departmentId) return setServices([]);
    servicesApi.list(filters.departmentId).then(setServices).catch(e => setError(e.message));
  }, [filters.departmentId]);

  async function submit(id) {
    try {
      await workflowApi.submit(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function setFilter(key, value) {
    const upd = { ...filters, [key]: value };
    if (key === "boardId") { upd.departmentId = ""; upd.serviceId = ""; }
    if (key === "departmentId") { upd.serviceId = ""; }
    setFilters(upd);
    setPage(1);
  }

  function resetFilters() {
    setFilters({ search: "", boardId: "", departmentId: "", serviceId: "", status: "", fromDate: "", toDate: "" });
    setPage(1);
  }

  const filtered = useMemo(() => {
    return applications.filter(a => {
      if (filters.search) {
        const n = filters.search.toLowerCase();
        if (!`${a.applicationNo || ""} ${a.id}`.toLowerCase().includes(n)) return false;
      }
      if (filters.serviceId && a.serviceId !== filters.serviceId) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.fromDate && new Date(a.createdAt) < new Date(filters.fromDate)) return false;
      if (filters.toDate && new Date(a.createdAt) > new Date(filters.toDate + "T23:59:59")) return false;
      return true;
    });
  }, [applications, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function pageNumbers() {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  if (loading) return <LoadingRow label="Loading applications…" />;

  return (
    <div>
      <Breadcrumb />

      {/* ── Title row ── */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Application List</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Manage and track all citizen applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50"
          >
            <RefreshCcw size={13} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50">
            <Download size={13} />
            Export
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50">
            <Columns3 size={13} />
            Columns
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-[#1e40af] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#1e3a8a]">
            <Plus size={14} />
            New Application
          </button>
        </div>
      </div>

      <ErrorBanner message={error} />

      {/* ── Filter panel ── */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Row 1 */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-1">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Search</label>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                className="w-full text-[13px] outline-none placeholder:text-slate-400"
                placeholder="Application no or ID"
                value={filters.search}
                onChange={e => setFilter("search", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Board</label>
            <select
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500"
              value={filters.boardId}
              onChange={e => setFilter("boardId", e.target.value)}
            >
              <option value="">All Boards</option>
              {boards.map(b => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Department</label>
            <select
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              value={filters.departmentId}
              onChange={e => setFilter("departmentId", e.target.value)}
              disabled={!filters.boardId}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Service</label>
            <select
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              value={filters.serviceId}
              onChange={e => setFilter("serviceId", e.target.value)}
              disabled={!filters.departmentId}
            >
              <option value="">All Services</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.nameEnglish}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500"
              value={filters.status}
              onChange={e => setFilter("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2 (more filters) */}
        {showMoreFilters && (
          <div className="mt-3 grid grid-cols-5 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Submitted From</label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500"
                value={filters.fromDate}
                onChange={e => setFilter("fromDate", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Submitted To</label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500"
                value={filters.toDate}
                onChange={e => setFilter("toDate", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Filter actions */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setShowMoreFilters(s => !s)}
            className="flex items-center gap-1.5 text-[12px] text-blue-700 hover:underline"
          >
            <SlidersHorizontal size={13} />
            {showMoreFilters ? "Hide Filters" : "More Filters"}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
            <button className="rounded-md bg-[#1e40af] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1e3a8a]">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Table header row */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2 text-[13px] text-slate-700">
            <FileText size={15} className="text-slate-400" />
            <span className="font-semibold">Total Applications:</span>
            <span className="font-bold text-[#1e40af]">{filtered.length.toLocaleString()}</span>
            {filtered.length !== applications.length && (
              <span className="text-slate-400">of {applications.length.toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <span>Show</span>
            <select
              className="rounded-md border border-slate-200 px-1.5 py-1 text-[12px] text-slate-700 outline-none"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                {["Application No", "Service", "Status", "Current Stage", "Submitted On", "Actions"].map(h => (
                  <th key={h} className="border-b border-slate-100 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No applications match these filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="border-b border-slate-100 px-4 py-2.5">
                      <Link to={`/applications/${r.id}`} className="font-medium text-blue-700 hover:underline">
                        {r.applicationNo || r.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                      {r.serviceId?.slice(0, 8)}…
                    </td>
                    <td className="border-b border-slate-100 px-4 py-2.5">
                      <Badge tone={STATUS_TONE[r.status] || "default"}>{r.status?.replace("_", " ")}</Badge>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-2.5">
                      <StageBadge label={r.currentStage} />
                    </td>
                    <td className="border-b border-slate-100 px-4 py-2.5 text-slate-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-2.5">
                      {r.status === "DRAFT" ? (
                        <button
                          className="rounded-md bg-blue-50 px-2.5 py-1 text-[12px] font-medium text-blue-700 hover:bg-blue-100"
                          onClick={() => submit(r.id)}
                        >
                          Submit
                        </button>
                      ) : (
                        <Link to={`/applications/${r.id}`} className="rounded-md bg-slate-100 px-2.5 py-1 text-[12px] text-slate-600 hover:bg-slate-200">
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-[12px] text-slate-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()} entries
            </span>
            <div className="flex items-center gap-1">
              <PaginationBtn label="«" onClick={() => setPage(1)} disabled={page === 1} />
              <PaginationBtn label="‹" onClick={() => setPage(p => p - 1)} disabled={page === 1} />
              {pageNumbers().map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`flex h-7 w-7 items-center justify-center rounded text-[12px] font-medium transition-colors ${
                    n === page
                      ? "bg-[#1e40af] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {n}
                </button>
              ))}
              <PaginationBtn label="›" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} />
              <PaginationBtn label="»" onClick={() => setPage(totalPages)} disabled={page === totalPages} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PaginationBtn({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded text-[13px] text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {label}
    </button>
  );
}
