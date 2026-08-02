import React, { useEffect, useState, useCallback } from "react";
import { applicationsApi, paymentsApi } from "../api/client";
import {
  IndianRupee, RefreshCw, X, CheckCircle2, Clock, XCircle,
  FileText, AlertCircle, Plus, CreditCard, Landmark,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────

const APP_STATUS_STYLE = {
  DRAFT:       "bg-slate-100 text-slate-600",
  SUBMITTED:   "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  APPROVED:    "bg-emerald-100 text-emerald-700",
  REJECTED:    "bg-red-100 text-red-700",
  DISPATCHED:  "bg-emerald-100 text-emerald-700",
};

const CHALLAN_STYLE = {
  PENDING:   { cls: "bg-amber-100 text-amber-700",   icon: Clock },
  PAID:      { cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  CANCELLED: { cls: "bg-slate-100 text-slate-500",   icon: XCircle },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Field (floating label) ────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div className="relative">
      <label className={`absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-slate-500 z-10 ${required ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

const finput = "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none";

// ── Challan Panel (right drawer) ──────────────────────────────────────────

function ChallanPanel({ application, onClose }) {
  const [challans, setChallans]       = useState([]);
  const [settled, setSettled]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showOffline, setShowOffline] = useState(null); // challan id
  const [genForm, setGenForm]         = useState({ amount: "", purpose: "" });
  const [offForm, setOffForm]         = useState({ bankName: "", receiptNo: "", depositDate: "", proofDocumentPath: "" });
  const [saving, setSaving]           = useState(false);

  const loadChallans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        paymentsApi.listChallans(application.id),
        paymentsApi.allSettled(application.id),
      ]);
      setChallans(list);
      setSettled(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [application.id]);

  useEffect(() => { loadChallans(); }, [loadChallans]);

  async function handleGenerate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentsApi.generateChallan({
        applicationId: application.id,
        amount: Number(genForm.amount),
        purpose: genForm.purpose,
        generatedByUserId: null,
        generatedAtStageId: null,
        parentChallanId: null,
      });
      setGenForm({ amount: "", purpose: "" });
      setShowGenerate(false);
      await loadChallans();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleOffline(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentsApi.payOffline(showOffline, {
        bankName: offForm.bankName,
        receiptNo: offForm.receiptNo,
        depositDate: offForm.depositDate,
        proofDocumentPath: offForm.proofDocumentPath || null,
      });
      setShowOffline(null);
      setOffForm({ bankName: "", receiptNo: "", depositDate: "", proofDocumentPath: "" });
      await loadChallans();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const totalPaid = challans.filter(c => c.status === "PAID").reduce((s, c) => s + (c.amount || 0), 0);
  const totalPending = challans.filter(c => c.status === "PENDING").reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {application.applicationNo || application.id.slice(0, 8).toUpperCase()}
            </h2>
            <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${APP_STATUS_STYLE[application.status] || "bg-slate-100 text-slate-600"}`}>
              {(application.status || "").replace("_", " ")}
            </span>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Gate status */}
          {!loading && settled !== null && (
            <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${settled ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              {settled
                ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                : <Clock size={18} className="text-amber-600 flex-shrink-0" />}
              <div>
                <div className={`text-sm font-semibold ${settled ? "text-emerald-700" : "text-amber-700"}`}>
                  {settled ? "All challans settled — can proceed" : "Payment pending — blocked at payment stage"}
                </div>
              </div>
            </div>
          )}

          {/* Mini stats */}
          {!loading && challans.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Challans", value: challans.length, cls: "text-slate-800" },
                { label: "Amount Paid",    value: `₹${totalPaid.toLocaleString("en-IN")}`, cls: "text-emerald-700" },
                { label: "Amount Due",     value: `₹${totalPending.toLocaleString("en-IN")}`, cls: totalPending > 0 ? "text-amber-700" : "text-slate-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <div className={`text-lg font-bold ${s.cls}`}>{s.value}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Challans list */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-bold text-slate-700">Challans {!loading && `(${challans.length})`}</span>
              <button onClick={() => setShowGenerate(v => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                <Plus size={12} /> Generate
              </button>
            </div>

            {/* Generate form */}
            {showGenerate && (
              <form onSubmit={handleGenerate} className="border-b border-slate-100 bg-blue-50 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Amount (₹)" required>
                    <input type="number" required value={genForm.amount}
                      onChange={e => setGenForm(f => ({ ...f, amount: e.target.value }))}
                      className={finput} placeholder="0" />
                  </Field>
                  <Field label="Purpose" required>
                    <input required value={genForm.purpose}
                      onChange={e => setGenForm(f => ({ ...f, purpose: e.target.value }))}
                      className={finput} placeholder="e.g. Processing fee" />
                  </Field>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowGenerate(false)}
                    className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Generating…" : "Generate Challan"}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading challans…</div>
            ) : challans.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No challans yet for this application</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {challans.map(c => {
                  const cs = CHALLAN_STYLE[c.status] || CHALLAN_STYLE.PENDING;
                  const CIcon = cs.icon;
                  const isOpen = showOffline === c.id;
                  return (
                    <div key={c.id}>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800">{c.challanNo || c.id.slice(0, 8).toUpperCase()}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{c.purpose || "—"}</div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className="text-sm font-bold text-slate-700">₹{(c.amount || 0).toLocaleString("en-IN")}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cs.cls}`}>
                            <CIcon size={11} /> {c.status}
                          </span>
                          {c.status === "PENDING" && (
                            <button onClick={() => setShowOffline(isOpen ? null : c.id)}
                              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                              <Landmark size={11} /> Offline
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Offline payment form */}
                      {isOpen && (
                        <form onSubmit={handleOffline} className="border-t border-slate-100 bg-amber-50 p-4 space-y-4">
                          <div className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                            <Landmark size={13} /> Record Offline Payment
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Bank Name" required>
                              <input required value={offForm.bankName}
                                onChange={e => setOffForm(f => ({ ...f, bankName: e.target.value }))}
                                className={finput} placeholder="e.g. SBI" />
                            </Field>
                            <Field label="Receipt No" required>
                              <input required value={offForm.receiptNo}
                                onChange={e => setOffForm(f => ({ ...f, receiptNo: e.target.value }))}
                                className={finput} placeholder="REC-00001" />
                            </Field>
                            <Field label="Deposit Date" required>
                              <input type="date" required value={offForm.depositDate}
                                onChange={e => setOffForm(f => ({ ...f, depositDate: e.target.value }))}
                                className={finput} />
                            </Field>
                            <Field label="Proof Document Path">
                              <input value={offForm.proofDocumentPath}
                                onChange={e => setOffForm(f => ({ ...f, proofDocumentPath: e.target.value }))}
                                className={finput} placeholder="optional path" />
                            </Field>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowOffline(null)}
                              className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                              Cancel
                            </button>
                            <button type="submit" disabled={saving}
                              className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                              {saving ? "Recording…" : "Record Payment"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Multiple challans can exist per application. The application stays blocked at the payment-check
            stage until every pending challan is PAID or CANCELLED.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [selectedApp, setSelectedApp]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApplications(await applicationsApi.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = applications.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.applicationNo || a.id || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Multi-challan management — online & offline payments</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Info strip */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 px-5 py-3 flex items-center gap-3 text-sm text-blue-700">
        <CreditCard size={16} className="flex-shrink-0" />
        Select an application to manage its challans — generate, record offline payments, or track payment status.
      </div>

      {/* Search + table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
          <FileText size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by application no…"
            className="flex-1 text-sm text-slate-700 outline-none placeholder:text-slate-400" />
          <span className="text-xs text-slate-400">{filtered.length} applications</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading applications…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {search ? "No applications match your search" : "No applications found"}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Application No", "Status", "Created On", "Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold font-mono text-slate-800">
                      {app.applicationNo || app.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{app.id.slice(0, 12)}…</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${APP_STATUS_STYLE[app.status] || "bg-slate-100 text-slate-600"}`}>
                      {(app.status || "").replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{fmtDate(app.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setSelectedApp(app)}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                      <IndianRupee size={12} /> Manage Challans
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Challan panel */}
      {selectedApp && (
        <ChallanPanel
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
