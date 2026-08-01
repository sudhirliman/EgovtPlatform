import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cfcApi } from "../api/client";

const STATUS_COLOR = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  FORWARDED_TO_EM: "bg-purple-100 text-purple-700",
  REVERTEDBYIO: "bg-orange-100 text-orange-700",
  FORWARDED_TO_CLERK: "bg-yellow-100 text-yellow-700",
  REVERTEDBYEM: "bg-red-100 text-red-700",
  REVERTED_BY_ASSISTANT_SENIOR_CLERK: "bg-orange-100 text-orange-700",
  APPROVED_BY_ASSISTANT_SENIOR_CLERK: "bg-teal-100 text-teal-700",
  APPROVED_BY_EM: "bg-emerald-100 text-emerald-700",
  CHALLAN_GENERATED: "bg-indigo-100 text-indigo-700",
  DEPTCHALLANRECIEPT: "bg-indigo-100 text-indigo-700",
  CERTIFICATECREATED: "bg-green-100 text-green-700",
  CERTIFICATE_UPLOADED: "bg-green-100 text-green-700",
  CFCCERTIFICATE: "bg-green-100 text-green-700",
  DISPATCHED: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL = {
  SUBMITTED: "Submitted",
  FORWARDED_TO_EM: "With Estate Manager",
  REVERTEDBYIO: "Reverted by IO",
  FORWARDED_TO_CLERK: "With Clerk",
  REVERTEDBYEM: "Reverted by EM",
  REVERTED_BY_ASSISTANT_SENIOR_CLERK: "Reverted by Clerk",
  APPROVED_BY_ASSISTANT_SENIOR_CLERK: "Approved by Clerk",
  APPROVED_BY_EM: "Approved by EM",
  CHALLAN_GENERATED: "Challan Generated",
  DEPTCHALLANRECIEPT: "Payment Received",
  CERTIFICATECREATED: "Certificate Ready",
  CERTIFICATE_UPLOADED: "Cert Uploaded",
  CFCCERTIFICATE: "CFC Certificate",
  DISPATCHED: "Dispatched",
};

function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ label, value, accent }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-1 ${accent}`} />
      <div className="p-4">
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function CfcQueuePage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    cfcApi.queue()
      .then(setApps)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = apps.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
  const withEM = (counts.FORWARDED_TO_EM || 0) + (counts.APPROVED_BY_ASSISTANT_SENIOR_CLERK || 0) + (counts.REVERTED_BY_ASSISTANT_SENIOR_CLERK || 0);
  const withClerk = counts.FORWARDED_TO_CLERK || 0;
  const finalization = (counts.APPROVED_BY_EM || 0) + (counts.CHALLAN_GENERATED || 0) + (counts.DEPTCHALLANRECIEPT || 0) + (counts.CERTIFICATECREATED || 0) + (counts.CERTIFICATE_UPLOADED || 0) + (counts.CFCCERTIFICATE || 0);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="text-[12px] text-slate-500">
        Dashboard <span className="mx-1 text-slate-300">›</span>
        <span className="font-medium text-slate-800">CFC Queue</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">CFC Workflow Queue</h1>
          <p className="mt-0.5 text-sm text-slate-500">Applications pending action based on your role</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total in Queue" value={apps.length} accent="bg-[#1a2744]" />
        <StatCard label="Pending (IO)" value={counts.SUBMITTED || 0} accent="bg-blue-500" />
        <StatCard label="With EM / Clerk" value={withEM + withClerk} accent="bg-purple-500" />
        <StatCard label="Finalization" value={finalization} accent="bg-emerald-500" />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading queue…</div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <div className="text-3xl mb-2">📋</div>
            <div className="font-medium text-slate-600">No applications in your queue</div>
            <div className="text-sm mt-1">All clear — or check your role assignment</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Application No", "Service", "Status", "Submitted", ""].map(h => (
                  <th key={h} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">
                    {app.applicationNo || app.id?.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                    {app.serviceId?.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[app.status] || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABEL[app.status] || app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmt(app.submittedAt || app.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/cfc/applications/${app.id}`)}
                      className="rounded-lg bg-[#1a2744] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 transition-colors"
                    >
                      Open →
                    </button>
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
