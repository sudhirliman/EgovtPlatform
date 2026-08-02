import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { applicationsApi, paymentsApi } from "../api/client";
import { ChevronRight, Home, FileText, Clock, CheckCircle2, XCircle, File, IndianRupee, AlertCircle } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  DRAFT:       { cls: "bg-slate-100 text-slate-600",     icon: FileText },
  SUBMITTED:   { cls: "bg-amber-100 text-amber-700",     icon: Clock },
  IN_PROGRESS: { cls: "bg-blue-100 text-blue-700",       icon: Clock },
  APPROVED:    { cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  REJECTED:    { cls: "bg-red-100 text-red-700",         icon: XCircle },
  DISPATCHED:  { cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

const CHALLAN_STATUS = {
  PAID:      "bg-emerald-100 text-emerald-700",
  PENDING:   "bg-amber-100 text-amber-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Tab bar ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "details",   label: "Application Details" },
  { key: "documents", label: "Documents" },
  { key: "timeline",  label: "Workflow & Timeline" },
  { key: "payment",   label: "Payment" },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-5">
      {TABS.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === t.key
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Details Tab ───────────────────────────────────────────────────────────

function DetailsTab({ application }) {
  let formData = {};
  try { formData = application.formData ? JSON.parse(application.formData) : {}; } catch { formData = {}; }
  const entries = Object.entries(formData);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Application Info</h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          {[
            ["Application No", application.applicationNo || application.id?.slice(0, 8).toUpperCase()],
            ["Service ID",     application.serviceId ? application.serviceId.slice(0, 8) + "…" : "—"],
            ["Applicant ID",   application.applicantUserId ? application.applicantUserId.slice(0, 8) + "…" : "—"],
            ["Created On",     fmtDate(application.createdAt)],
            ["Submitted On",   fmtDate(application.submittedAt)],
            ["Last Updated",   fmt(application.updatedAt)],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
              <div className="text-sm font-medium text-slate-800">{val || "—"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Submitted Form Data</h3>
        {entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No form data captured yet</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {entries.map(([key, value]) => (
              <div key={key}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="text-sm text-slate-800 break-words">{String(value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────

function DocumentsTab({ documents }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <span className="text-sm font-bold text-slate-700">Uploaded Documents ({documents.length})</span>
      </div>
      {documents.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">No documents uploaded yet</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["File Name", "Type", "Uploaded At"].map(h => (
                <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map(d => (
              <tr key={d.id} className="hover:bg-slate-50/60">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <File size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{d.fileName || "—"}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    d.documentType === "MANDATORY" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>{d.documentType}</span>
                </td>
                <td className="px-6 py-3.5 text-sm text-slate-500">{fmt(d.uploadedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────

function TimelineTab({ history }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-700 mb-5">Stage-wise Workflow Timeline</h3>
      {history.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">No stage activity recorded yet</div>
      ) : (
        <ol className="relative">
          {history.map((h, i) => {
            const isSuccess  = h.action === "APPROVED" || h.action === "DISPATCHED";
            const isDanger   = h.action === "REJECTED" || h.action === "SENT_BACK";
            const dotColor   = isSuccess ? "bg-emerald-100 text-emerald-600" : isDanger ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600";
            const emoji      = isSuccess ? "✓" : isDanger ? "✕" : "→";
            return (
              <li key={h.id} className="flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${dotColor}`}>
                    {emoji}
                  </div>
                  {i < history.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                </div>
                <div className="pb-2 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{h.action?.replace(/_/g, " ")}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{fmt(h.actedAt)}</div>
                  {h.remarks && (
                    <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-600">
                      {h.remarks}
                    </div>
                  )}
                  {h.breached && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                      <AlertCircle size={11} /> SLA Breached
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ── Payment Tab ───────────────────────────────────────────────────────────

function PaymentTab({ challans }) {
  const total = challans.filter(c => c.status === "PAID").reduce((s, c) => s + (c.amount || 0), 0);
  return (
    <div className="space-y-4">
      {total > 0 && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
            <IndianRupee size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Total Paid</div>
            <div className="text-2xl font-bold text-emerald-800">₹{total.toLocaleString("en-IN")}</div>
          </div>
        </div>
      )}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-700">Challans ({challans.length})</span>
        </div>
        {challans.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No challans generated for this application</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Challan No", "Amount", "Purpose", "Status"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challans.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-3.5 text-sm font-mono font-medium text-slate-700">{c.challanNo || "—"}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-slate-800">₹{(c.amount || 0).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{c.purpose || "—"}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CHALLAN_STATUS[c.status] || "bg-slate-100 text-slate-600"}`}>
                      {c.status}
                    </span>
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

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments]     = useState([]);
  const [history, setHistory]         = useState([]);
  const [challans, setChallans]       = useState([]);
  const [activeTab, setActiveTab]     = useState("details");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [app, docs, hist, chal] = await Promise.all([
          applicationsApi.get(id),
          applicationsApi.documents(id),
          applicationsApi.history(id),
          paymentsApi.listChallans(id),
        ]);
        setApplication(app);
        setDocuments(docs);
        setHistory(hist);
        setChallans(chal);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-sm text-slate-400">Loading application…</div>
  );

  if (!application) return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {error || "Application not found"}
    </div>
  );

  const s = STATUS_STYLE[application.status] || STATUS_STYLE.DRAFT;
  const StatusIcon = s.icon;

  return (
    <div className="space-y-5">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-[12px] text-slate-500">
        <Home size={12} />
        <Link to="/" className="hover:text-blue-600">Dashboard</Link>
        <ChevronRight size={11} />
        <Link to="/applications" className="hover:text-blue-600">Applications</Link>
        <ChevronRight size={11} />
        <span className="font-medium text-slate-700">
          {application.applicationNo || application.id?.slice(0, 8).toUpperCase()}
        </span>
      </nav>

      {/* Header card */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Application</div>
            <h1 className="text-2xl font-bold text-slate-900">
              {application.applicationNo || application.id?.slice(0, 8).toUpperCase()}
            </h1>
            <div className="mt-1 text-sm text-slate-500">
              Service: <span className="font-mono">{application.serviceId?.slice(0, 8)}…</span>
              <span className="mx-2 text-slate-300">·</span>
              Created: {fmtDate(application.submittedAt || application.createdAt)}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${s.cls}`}>
            <StatusIcon size={14} />
            {(application.status || "").replace("_", " ")}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Tabs + content */}
      <div>
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === "details"   && <DetailsTab   application={application} />}
        {activeTab === "documents" && <DocumentsTab documents={documents} />}
        {activeTab === "timeline"  && <TimelineTab  history={history} />}
        {activeTab === "payment"   && <PaymentTab   challans={challans} />}
      </div>

    </div>
  );
}
