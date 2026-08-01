import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applicationsApi, cfcApi, getUsersByRoleName } from "../api/client";

// ── Constants ──────────────────────────────────────────────────────────────

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
  DISPATCHED: "Dispatched ✓",
};

const VERIFY_STAGE = {
  FORWARDED_TO_CLERK: "CLERK",
  APPROVED_BY_ASSISTANT_SENIOR_CLERK: "EM",
  REVERTED_BY_ASSISTANT_SENIOR_CLERK: "EM",
};

function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{value || "—"}</div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-[13px] font-semibold text-slate-700">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Document Verification Row ──────────────────────────────────────────────

function DocVerifyRow({ doc, verification, stage, appId, onDone }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const apiFn = stage === "CLERK" ? cfcApi.verifyDocByClerk : cfcApi.verifyDocByEM;

  async function submit() {
    if (!remark.trim()) { setErr("Remark is required"); return; }
    setSaving(true);
    setErr(null);
    try {
      await apiFn(appId, { documentId: doc.id, action, remark: remark.trim() });
      setOpen(false);
      setRemark("");
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isVerified = !!verification;
  const isAccepted = verification?.action === "ACCEPTED";

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">{doc.fileName || doc.documentType || `Document ${doc.id?.slice(0, 6)}`}</span>
          {doc.documentType === "MANDATORY" && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">MANDATORY</span>
          )}
          {isVerified && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isAccepted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {isAccepted ? "✓ Accepted" : "✗ Rejected"}
            </span>
          )}
        </div>
        {!open && (
          <div className="flex gap-1.5">
            <button onClick={() => { setAction("ACCEPTED"); setOpen(true); }}
              className="rounded px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
              Accept
            </button>
            <button onClick={() => { setAction("REJECTED"); setOpen(true); }}
              className="rounded px-2.5 py-1 text-[11px] font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100">
              Reject
            </button>
          </div>
        )}
      </div>
      {isVerified && !open && (
        <div className="mt-1 text-[11px] text-slate-500">Remark: {verification.remark}</div>
      )}
      {open && (
        <div className="mt-2 space-y-2">
          <div className="text-[11px] font-medium text-slate-600">
            {action === "ACCEPTED" ? "✓ Accepting" : "✗ Rejecting"} — add remark:
          </div>
          <textarea
            value={remark}
            onChange={e => setRemark(e.target.value)}
            rows={2}
            className="w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="Enter remark (required)"
          />
          {err && <div className="text-[11px] text-red-600">{err}</div>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving}
              className={`rounded px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50 ${action === "ACCEPTED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
              {saving ? "Saving…" : "Confirm"}
            </button>
            <button onClick={() => { setOpen(false); setErr(null); setRemark(""); }}
              className="rounded px-3 py-1.5 text-[11px] text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Action Modal ───────────────────────────────────────────────────────────

function ActionModal({ config, onClose, onSubmit, loading, error }) {
  const [form, setForm] = useState({ selectedOfficerId: "", remarks: "", amount: "", filePath: "" });

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-800">{config.title}</h3>
          {config.description && <p className="mt-0.5 text-sm text-slate-500">{config.description}</p>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {config.officerField && (
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-slate-600 uppercase tracking-wide">
                {config.officerField.label}
              </label>
              {config.officers?.length === 0 ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                  No {config.officerField.label} found with this role. Assign role first.
                </div>
              ) : (
                <select
                  required
                  value={form.selectedOfficerId}
                  onChange={e => set("selectedOfficerId", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
                >
                  <option value="">— Select officer —</option>
                  {(config.officers || []).map(o => (
                    <option key={o.id} value={o.id}>{o.name || o.identifier}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          {config.amountField && (
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-slate-600 uppercase tracking-wide">Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={form.amount}
                onChange={e => set("amount", e.target.value)}
                placeholder="Enter challan amount"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          )}
          {config.filePathField && (
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-slate-600 uppercase tracking-wide">Certificate File Path</label>
              <input
                type="text"
                required
                value={form.filePath}
                onChange={e => set("filePath", e.target.value)}
                placeholder="/uploads/certificates/cert_12345.pdf"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          )}
          {config.remarksField && (
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-slate-600 uppercase tracking-wide">
                Remarks {config.remarksRequired && <span className="text-red-500">*</span>}
              </label>
              <textarea
                required={config.remarksRequired}
                value={form.remarks}
                onChange={e => set("remarks", e.target.value)}
                rows={3}
                placeholder={config.remarksRequired ? "Remarks are required" : "Optional remarks…"}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          )}
          {config.confirmOnly && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {config.confirmMessage || "Are you sure you want to proceed?"}
            </div>
          )}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || (config.officerField && config.officers?.length === 0)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${config.danger ? "bg-red-600 hover:bg-red-700" : "bg-[#1a2744] hover:bg-blue-900"}`}
            >
              {loading ? "Processing…" : config.submitLabel || "Confirm"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Action Panel ───────────────────────────────────────────────────────────

function ActionPanel({ app, documents, docVerifications, onRefresh }) {
  const [modal, setModal] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const status = app.status;
  const verifyStage = VERIFY_STAGE[status];

  const verifyMap = Object.fromEntries(
    docVerifications.filter(v => v.verificationStage === verifyStage).map(v => [v.documentId, v])
  );
  const allDocsVerified = documents.length > 0 && documents.every(d => verifyMap[d.id]);

  async function openModal(type) {
    setModalError(null);
    setOfficers([]);
    let loadedOfficers = [];
    if (type === "outward-to-em") {
      loadedOfficers = await getUsersByRoleName("CFC_EM").catch(() => []);
    } else if (type === "forward-to-clerk") {
      loadedOfficers = await getUsersByRoleName("CFC_CLERK").catch(() => []);
    }
    setOfficers(loadedOfficers);
    setModal(type);
  }

  async function handleSubmit(form) {
    setModalLoading(true);
    setModalError(null);
    try {
      switch (modal) {
        case "outward-to-em":
          await cfcApi.outwardToEM(app.id, { selectedEmId: form.selectedOfficerId, remarks: form.remarks || null });
          break;
        case "revert-io":
          await cfcApi.revertByIO(app.id, { remarks: form.remarks });
          break;
        case "forward-to-clerk":
          await cfcApi.forwardToClerk(app.id, { selectedClerkId: form.selectedOfficerId });
          break;
        case "revert-em":
          await cfcApi.revertByEM(app.id, { remarks: form.remarks });
          break;
        case "approve-clerk":
          await cfcApi.approveByClerk(app.id, { remarks: form.remarks });
          break;
        case "revert-clerk":
          await cfcApi.revertByClerk(app.id, { remarks: form.remarks });
          break;
        case "approve-em":
          await cfcApi.approveByEM(app.id, { remarks: form.remarks });
          break;
        case "generate-challan":
          await cfcApi.generateChallan(app.id, { amount: parseFloat(form.amount), purpose: form.remarks || null });
          break;
        case "record-payment":
          await cfcApi.recordPayment(app.id);
          break;
        case "finalize":
          await cfcApi.finalize(app.id, { remarks: form.remarks || null });
          break;
        case "upload-certificate":
          await cfcApi.uploadCertificate(app.id, { filePath: form.filePath });
          break;
        case "outward-cert":
          await cfcApi.outwardCertificate(app.id, { remarks: form.remarks || null });
          break;
        case "dispatch":
          await cfcApi.dispatch(app.id, { remarks: form.remarks || null });
          break;
        default:
          break;
      }
      setModal(null);
      onRefresh();
    } catch (e) {
      setModalError(e.message);
    } finally {
      setModalLoading(false);
    }
  }

  const MODAL_CONFIGS = {
    "outward-to-em": {
      title: "Outward to Estate Manager",
      description: "Select an EM to forward this application",
      officerField: { label: "Estate Manager" },
      officers,
      remarksField: true,
      remarksRequired: false,
      submitLabel: "Forward to EM",
    },
    "revert-io": {
      title: "Revert to Applicant",
      description: "This will mark the application as reverted by IO",
      remarksField: true,
      remarksRequired: true,
      submitLabel: "Revert",
      danger: true,
    },
    "forward-to-clerk": {
      title: "Forward to Clerk",
      description: "Select an Assistant/Senior Clerk",
      officerField: { label: "Clerk" },
      officers,
      submitLabel: "Forward to Clerk",
    },
    "revert-em": {
      title: "Revert by Estate Manager",
      remarksField: true,
      remarksRequired: true,
      submitLabel: "Revert",
      danger: true,
    },
    "approve-clerk": {
      title: "Approve by Clerk",
      description: "All documents have been verified. Confirm approval.",
      remarksField: true,
      remarksRequired: true,
      submitLabel: "Approve",
    },
    "revert-clerk": {
      title: "Revert by Clerk",
      remarksField: true,
      remarksRequired: true,
      submitLabel: "Revert",
      danger: true,
    },
    "approve-em": {
      title: "Approve by Estate Manager",
      description: "All documents verified. Confirm EM approval.",
      remarksField: true,
      remarksRequired: true,
      submitLabel: "Approve",
    },
    "generate-challan": {
      title: "Generate Challan",
      description: "Enter the challan amount for this application",
      amountField: true,
      remarksField: true,
      remarksRequired: false,
      submitLabel: "Generate Challan",
    },
    "record-payment": {
      title: "Record Payment",
      confirmOnly: true,
      confirmMessage: "Mark this challan as paid and move to the next stage?",
      submitLabel: "Confirm Payment",
    },
    "finalize": {
      title: "Finalize Application",
      description: "Mark certificate as created",
      remarksField: true,
      remarksRequired: false,
      submitLabel: "Finalize",
    },
    "upload-certificate": {
      title: "Upload Certificate",
      filePathField: true,
      submitLabel: "Upload",
    },
    "outward-cert": {
      title: "Outward Certificate",
      description: "Mark certificate as ready for dispatch",
      remarksField: true,
      remarksRequired: false,
      submitLabel: "Outward Certificate",
    },
    "dispatch": {
      title: "Dispatch",
      description: "Mark application as dispatched — final step",
      remarksField: true,
      remarksRequired: false,
      submitLabel: "Dispatch",
    },
  };

  function ActionBtn({ label, type, variant = "primary", disabled = false }) {
    const styles = {
      primary: "bg-[#1a2744] text-white hover:bg-blue-900",
      success: "bg-emerald-600 text-white hover:bg-emerald-700",
      danger: "bg-red-600 text-white hover:bg-red-700",
      warning: "bg-amber-500 text-white hover:bg-amber-600",
    };
    return (
      <button
        onClick={() => openModal(type)}
        disabled={disabled}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]}`}
      >
        {label}
      </button>
    );
  }

  const TERMINAL = ["DISPATCHED", "REVERTEDBYIO", "REVERTEDBYEM"];
  const isTerminal = TERMINAL.includes(status);

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-[13px] font-semibold text-slate-700">Action Panel</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">Actions available for current stage</p>
        </div>
        <div className="space-y-2 p-4">
          {isTerminal ? (
            <div className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
              {status === "DISPATCHED" ? "✓ Application completed" : "⚠ Application reverted — no further actions"}
            </div>
          ) : null}

          {status === "SUBMITTED" && (
            <>
              <ActionBtn label="Outward to Estate Manager →" type="outward-to-em" variant="primary" />
              <ActionBtn label="Revert to Applicant" type="revert-io" variant="danger" />
            </>
          )}

          {status === "FORWARDED_TO_EM" && (
            <>
              <ActionBtn label="Forward to Clerk →" type="forward-to-clerk" variant="primary" />
              <ActionBtn label="Revert to IO" type="revert-em" variant="danger" />
            </>
          )}

          {(status === "FORWARDED_TO_CLERK") && (
            <>
              {!allDocsVerified && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
                  Verify all documents below before approving or reverting.
                </div>
              )}
              <ActionBtn label="Approve by Clerk ✓" type="approve-clerk" variant="success" disabled={!allDocsVerified} />
              <ActionBtn label="Revert to EM" type="revert-clerk" variant="danger" disabled={!allDocsVerified} />
            </>
          )}

          {(status === "APPROVED_BY_ASSISTANT_SENIOR_CLERK" || status === "REVERTED_BY_ASSISTANT_SENIOR_CLERK") && (
            <>
              {!allDocsVerified && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
                  Verify all documents below before approving or reverting.
                </div>
              )}
              <ActionBtn label="Approve by EM ✓" type="approve-em" variant="success" disabled={!allDocsVerified} />
              <ActionBtn label="Revert to IO" type="revert-em" variant="danger" />
            </>
          )}

          {status === "APPROVED_BY_EM" && (
            <ActionBtn label="Generate Challan" type="generate-challan" variant="warning" />
          )}

          {status === "CHALLAN_GENERATED" && (
            <ActionBtn label="Record Payment Received" type="record-payment" variant="success" />
          )}

          {status === "DEPTCHALLANRECIEPT" && (
            <ActionBtn label="Finalize → Create Certificate" type="finalize" variant="primary" />
          )}

          {status === "CERTIFICATECREATED" && (
            <ActionBtn label="Upload Certificate" type="upload-certificate" variant="primary" />
          )}

          {status === "CERTIFICATE_UPLOADED" && (
            <ActionBtn label="Outward Certificate" type="outward-cert" variant="primary" />
          )}

          {status === "CFCCERTIFICATE" && (
            <ActionBtn label="Dispatch ✓" type="dispatch" variant="success" />
          )}
        </div>

        {/* Assignment info */}
        <div className="border-t border-slate-100 p-4 space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Assignments</div>
          {[
            { label: "IO", id: app.assignedIoId },
            { label: "EM", id: app.assignedEmId },
            { label: "Clerk", id: app.assignedClerkId },
          ].map(({ label, id }) => (
            <div key={label} className="flex items-center justify-between text-[12px]">
              <span className="text-slate-500">{label}</span>
              <span className="font-mono text-slate-700">{id ? id.slice(0, 8) + "…" : "Not assigned"}</span>
            </div>
          ))}
        </div>
      </div>

      {modal && MODAL_CONFIGS[modal] && (
        <ActionModal
          config={MODAL_CONFIGS[modal]}
          onClose={() => { setModal(null); setModalError(null); }}
          onSubmit={handleSubmit}
          loading={modalLoading}
          error={modalError}
        />
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CfcApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docVerifications, setDocVerifications] = useState([]);
  const [actionHistory, setActionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [application, docs, verifications, history] = await Promise.all([
        applicationsApi.get(id),
        applicationsApi.documents(id).catch(() => []),
        cfcApi.getDocVerifications(id).catch(() => []),
        cfcApi.getActions(id).catch(() => []),
      ]);
      setApp(application);
      setDocuments(docs);
      setDocVerifications(verifications);
      setActionHistory(history);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const verifyStage = app ? VERIFY_STAGE[app.status] : null;
  const verifyMap = Object.fromEntries(
    docVerifications.filter(v => v.verificationStage === verifyStage).map(v => [v.documentId, v])
  );

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading application…</div>
  );
  if (error || !app) return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{error || "Not found"}</div>
  );

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="text-[12px] text-slate-500">
        <button onClick={() => navigate("/cfc/queue")} className="hover:underline">CFC Queue</button>
        <span className="mx-1 text-slate-300">›</span>
        <span className="font-medium text-slate-800">{app.applicationNo || id.slice(0, 8)}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 font-mono">{app.applicationNo || "Application"}</h1>
            <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_COLOR[app.status] || "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABEL[app.status] || app.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Service: {app.serviceId?.slice(0, 8)}… · Submitted: {fmt(app.submittedAt || app.createdAt)}
          </p>
        </div>
        <button onClick={load} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Refresh
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">

        {/* Left column */}
        <div className="space-y-5">

          {/* Application info */}
          <SectionCard title="Application Details">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoRow label="Application No" value={app.applicationNo} />
              <InfoRow label="Status" value={STATUS_LABEL[app.status] || app.status} />
              <InfoRow label="Service ID" value={app.serviceId?.slice(0, 8) + "…"} />
              <InfoRow label="Submitted" value={fmt(app.submittedAt)} />
              <InfoRow label="Created" value={fmt(app.createdAt)} />
              <InfoRow label="Last Updated" value={fmt(app.lastSavedAt)} />
            </div>
            {app.formData && (() => {
              try {
                const data = JSON.parse(app.formData);
                const entries = Object.entries(data);
                return entries.length > 0 ? (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Form Data</div>
                    <div className="grid grid-cols-2 gap-3">
                      {entries.map(([k, v]) => <InfoRow key={k} label={k} value={String(v)} />)}
                    </div>
                  </div>
                ) : null;
              } catch { return null; }
            })()}
          </SectionCard>

          {/* Documents */}
          <SectionCard title={`Documents ${verifyStage ? `— ${verifyStage} Verification` : ""}`}>
            {documents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  verifyStage ? (
                    <DocVerifyRow
                      key={doc.id}
                      doc={doc}
                      verification={verifyMap[doc.id]}
                      stage={verifyStage}
                      appId={id}
                      onDone={load}
                    />
                  ) : (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                      <span className="text-slate-700">{doc.fileName || doc.documentType || doc.id?.slice(0, 8)}</span>
                      <span className="text-[11px] text-slate-400">{fmt(doc.uploadedAt)}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </SectionCard>

          {/* Action history */}
          <SectionCard title="Workflow History">
            {actionHistory.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No actions recorded yet</p>
            ) : (
              <ol className="relative border-l border-slate-200 pl-5 space-y-4">
                {actionHistory.map((h, i) => (
                  <li key={h.id || i} className="relative">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600 border-2 border-white" />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">{h.actionType || h.toStatus}</span>
                      {h.fromStatus && (
                        <span className="text-[10px] text-slate-400">{h.fromStatus} → {h.toStatus}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{fmt(h.actedAt)}</div>
                    {h.remarks && <div className="mt-1 text-xs text-slate-600 italic">"{h.remarks}"</div>}
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>

        {/* Right column — action panel */}
        <div>
          <ActionPanel
            app={app}
            documents={documents}
            docVerifications={docVerifications}
            onRefresh={load}
          />
        </div>
      </div>
    </div>
  );
}
