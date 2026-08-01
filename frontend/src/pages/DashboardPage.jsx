import React, { useEffect, useState } from "react";
import { applicationsApi, reportsApi } from "../api/client";
import { PageHeader, Card, Table, Badge, ErrorBanner, LoadingRow, Button } from "../components/ui.jsx";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

const STATUS_TONE = {
  DRAFT: "default",
  SUBMITTED: "warning",
  IN_PROGRESS: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  DISPATCHED: "success",
};

const PIE_COLORS = { APPROVED: "#10b981", DISPATCHED: "#10b981", PENDING: "#f59e0b", REJECTED: "#ef4444", OTHER: "#94a3b8" };

function StatCard({ icon: Icon, label, value, tone = "slate", trend }) {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <Icon size={16} aria-hidden="true" />
        </div>
        <div>
          <div className="text-[13px] text-slate-500">{label}</div>
          <div className="text-xl font-semibold text-slate-900">{value}</div>
        </div>
      </div>
      {trend && <div className="mt-2 text-xs text-slate-400">{trend}</div>}
    </Card>
  );
}

export default function DashboardPage() {
  const [applications, setApplications] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const [apps, pendency] = await Promise.all([applicationsApi.list(), reportsApi.pendency({})]);
      setApplications(apps);
      setPending(pendency);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingRow label="Loading dashboard..." />;

  const approved = applications.filter((a) => a.status === "APPROVED" || a.status === "DISPATCHED").length;
  const rejected = applications.filter((a) => a.status === "REJECTED").length;
  const dispatched = applications.filter((a) => a.status === "DISPATCHED").length;

  const pieData = [
    { name: "Approved", value: approved, key: "APPROVED" },
    { name: "Pending", value: pending.length, key: "PENDING" },
    { name: "Rejected", value: rejected, key: "REJECTED" },
  ].filter((d) => d.value > 0);

  // Simple trend: cumulative applications by creation order, bucketed into 6 points.
  const trendData = (() => {
    if (applications.length === 0) return [];
    const sorted = [...applications].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const buckets = 6;
    const step = Math.max(1, Math.ceil(sorted.length / buckets));
    const points = [];
    for (let i = step; i <= sorted.length; i += step) {
      points.push({ name: `#${i}`, total: i });
    }
    if (points.length === 0 || points[points.length - 1].total !== sorted.length) {
      points.push({ name: `#${sorted.length}`, total: sorted.length });
    }
    return points;
  })();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live data from the backend - all boards"
        action={<Button variant="secondary" onClick={load}>Refresh</Button>}
      />
      <ErrorBanner message={error} />

      <div className="mb-5 grid grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Total applications" value={applications.length} tone="blue" />
        <StatCard icon={Clock} label="Pending (all stages)" value={pending.length} tone="amber" />
        <StatCard icon={CheckCircle2} label="Approved / dispatched" value={approved} tone="emerald" />
        <StatCard icon={XCircle} label="Rejected" value={rejected} tone="red" />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <div className="mb-3 text-[13px] font-medium text-slate-900">Applications received (cumulative)</div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-[13px] text-slate-400">
              Not enough data yet
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 text-[13px] font-medium text-slate-900">Applications by status</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((d) => (
                    <Cell key={d.key} fill={PIE_COLORS[d.key] || PIE_COLORS.OTHER} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-[13px] text-slate-400">
              Not enough data yet
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-3 text-[13px] font-medium text-slate-900">Recent applications</div>
        <Table
          emptyText="No applications yet - submit one via the backend API to see it here"
          columns={[
            { key: "applicationNo", header: "Application no", render: (r) => r.applicationNo || r.id.slice(0, 8) },
            { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] || "default"}>{r.status}</Badge> },
          ]}
          rows={applications.slice(0, 10)}
        />
      </Card>
    </div>
  );
}
