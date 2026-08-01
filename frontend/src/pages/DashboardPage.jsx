import React, { useEffect, useState, useCallback } from "react";
import { applicationsApi, reportsApi, usersApi, rolesApi, boardsApi } from "../api/client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import {
  FileText, Clock, CheckCircle2, XCircle, Users, Shield, Building2, RefreshCw,
  TrendingUp, AlertCircle,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  DRAFT: "#94a3b8",
  SUBMITTED: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  APPROVED: "#10b981",
  DISPATCHED: "#059669",
  REJECTED: "#ef4444",
};

const STATUS_LABEL = {
  DRAFT: "Draft", SUBMITTED: "Submitted", IN_PROGRESS: "In Progress",
  APPROVED: "Approved", DISPATCHED: "Dispatched", REJECTED: "Rejected",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

function buildMonthTrend(applications) {
  const map = {};
  const order = [];
  [...applications]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach(a => {
      const k = monthKey(a.createdAt);
      if (!map[k]) { map[k] = 0; order.push(k); }
      map[k]++;
    });
  return order.slice(-8).map(k => ({ month: k, applications: map[k] }));
}

function buildStatusBreakdown(applications) {
  const map = {};
  applications.forEach(a => { map[a.status] = (map[a.status] || 0) + 1; });
  return Object.entries(map).map(([status, count]) => ({
    name: STATUS_LABEL[status] || status,
    value: count,
    color: STATUS_COLOR[status] || "#94a3b8",
  }));
}

// ── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, iconBg, loading }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-3xl font-bold text-slate-900 leading-tight mt-0.5">
          {loading ? <span className="text-slate-300 text-lg animate-pulse">—</span> : value}
        </div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Bar Tooltip ───────────────────────────────────────────────────────────

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-lg px-4 py-2.5">
      <div className="text-[11px] font-semibold text-slate-500 mb-0.5">{label}</div>
      <div className="text-base font-bold text-slate-800">{payload[0].value} applications</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [apps, setApps]       = useState([]);
  const [pending, setPending] = useState([]);
  const [users, setUsers]     = useState([]);
  const [roles, setRoles]     = useState([]);
  const [boards, setBoards]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, p, u, r, b] = await Promise.all([
        applicationsApi.list(),
        reportsApi.pendency({}),
        usersApi.list(),
        rolesApi.list(),
        boardsApi.list(),
      ]);
      setApps(a);
      setPending(p);
      setUsers(u);
      setRoles(r);
      setBoards(b);
      setRefreshedAt(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approved      = apps.filter(a => a.status === "APPROVED" || a.status === "DISPATCHED").length;
  const rejected      = apps.filter(a => a.status === "REJECTED").length;
  const monthTrend    = buildMonthTrend(apps);
  const statusPie     = buildStatusBreakdown(apps);
  const recent        = [...apps].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {refreshedAt
              ? `Updated at ${refreshedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : "Loading data…"}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm disabled:opacity-50 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Stats — 7 cards in one responsive grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FileText}     label="Total Applications" value={apps.length}    iconBg="bg-blue-500"    loading={loading} />
        <StatCard icon={Clock}        label="Pending"            value={pending.length} iconBg="bg-amber-500"   loading={loading} sub="across all stages" />
        <StatCard icon={CheckCircle2} label="Approved"           value={approved}       iconBg="bg-emerald-500" loading={loading} sub="incl. dispatched" />
        <StatCard icon={XCircle}      label="Rejected"           value={rejected}       iconBg="bg-red-500"     loading={loading} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Users}     label="Total Users"  value={users.length}  iconBg="bg-indigo-500" loading={loading} />
        <StatCard icon={Shield}    label="Roles"        value={roles.length}  iconBg="bg-violet-500" loading={loading} />
        <StatCard icon={Building2} label="Boards"       value={boards.length} iconBg="bg-slate-600"  loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">

        {/* Monthly bar chart */}
        <div className="col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-800">Applications by Month</span>
          </div>
          {monthTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthTrend} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "#f8fafc", radius: 6 }} />
                <Bar dataKey="applications" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
              {loading ? "Loading…" : "No application data yet"}
            </div>
          )}
        </div>

        {/* Status donut */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
          <div className="text-sm font-bold text-slate-800 mb-4">Status Breakdown</div>
          {statusPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name"
                    innerRadius={45} outerRadius={68} paddingAngle={3}
                    startAngle={90} endAngle={-270}>
                    {statusPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {statusPie.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-bold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
              {loading ? "Loading…" : "No data yet"}
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800">Recent Applications</span>
          <span className="text-xs text-slate-400">{!loading && `${recent.length} latest`}</span>
        </div>
        {loading ? (
          <div className="py-14 text-center text-sm text-slate-400">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-400">No applications yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Application No", "Service ID", "Status", "Submitted On"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-mono font-semibold text-slate-700">
                    {app.applicationNo || String(app.id).slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-3.5 text-[11px] font-mono text-slate-400">
                    {app.serviceId ? `${String(app.serviceId).slice(0, 8)}…` : "—"}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        background: (STATUS_COLOR[app.status] || "#94a3b8") + "22",
                        color: STATUS_COLOR[app.status] || "#94a3b8",
                      }}>
                      {STATUS_LABEL[app.status] || app.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-500">
                    {app.createdAt
                      ? new Date(app.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
