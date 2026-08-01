import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { applicationsApi, paymentsApi } from "../api/client";
import { PageHeader, Card, Badge, ErrorBanner, LoadingRow, Tabs, Table } from "../components/ui.jsx";

const STATUS_TONE = {
  DRAFT: "default",
  SUBMITTED: "warning",
  IN_PROGRESS: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  DISPATCHED: "success",
};

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function DetailsTab({ application }) {
  let formData = {};
  try {
    formData = application.formData ? JSON.parse(application.formData) : {};
  } catch {
    formData = { raw: application.formData };
  }
  const entries = Object.entries(formData);

  return (
    <Card>
      <div className="mb-3 text-[13px] font-medium text-slate-900">Submitted form data</div>
      {entries.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-slate-400">No form data captured yet</div>
      ) : (
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {entries.map(([key, value]) => (
            <div key={key}>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{key}</div>
              <div className="text-[13px] text-slate-800">{String(value)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DocumentsTab({ documents }) {
  return (
    <Card>
      <Table
        emptyText="No documents uploaded yet"
        columns={[
          { key: "fileName", header: "File name" },
          { key: "documentType", header: "Type", render: (d) => <Badge tone={d.documentType === "MANDATORY" ? "warning" : "default"}>{d.documentType}</Badge> },
          { key: "uploadedAt", header: "Uploaded at", render: (d) => formatDate(d.uploadedAt) },
        ]}
        rows={documents}
      />
    </Card>
  );
}

function TimelineTab({ history }) {
  return (
    <Card>
      <div className="mb-3 text-[13px] font-medium text-slate-900">Stage-wise timeline</div>
      {history.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-slate-400">No stage activity recorded yet</div>
      ) : (
        <ol className="relative border-l border-slate-200 pl-4">
          {history.map((h) => (
            <li key={h.id} className="mb-4 last:mb-0">
              <div className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
              <div className="text-[13px] font-medium text-slate-800">{h.action}</div>
              <div className="text-xs text-slate-500">{formatDate(h.actedAt)}</div>
              {h.remarks && <div className="mt-1 text-[13px] text-slate-600">{h.remarks}</div>}
              {h.breached && <Badge tone="danger">SLA breached</Badge>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function PaymentTab({ challans }) {
  return (
    <Card>
      <Table
        emptyText="No challans generated for this application"
        columns={[
          { key: "challanNo", header: "Challan no" },
          { key: "amount", header: "Amount", render: (c) => `\u20B9${c.amount}` },
          { key: "purpose", header: "Purpose" },
          {
            key: "status",
            header: "Status",
            render: (c) => (
              <Badge tone={c.status === "PAID" ? "success" : c.status === "CANCELLED" ? "default" : "warning"}>{c.status}</Badge>
            ),
          },
        ]}
        rows={challans}
      />
    </Card>
  );
}

const TABS = [
  { key: "details", label: "Application details" },
  { key: "documents", label: "Documents" },
  { key: "timeline", label: "Workflow & timeline" },
  { key: "payment", label: "Payment" },
];

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [challans, setChallans] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <LoadingRow label="Loading application..." />;
  if (!application) return <ErrorBanner message={error || "Application not found"} />;

  return (
    <div>
      <div className="mb-2 text-[13px] text-slate-500">
        <Link to="/applications" className="hover:underline">Applications</Link> / Application details
      </div>
      <PageHeader
        title={application.applicationNo || application.id.slice(0, 8)}
        subtitle={`Service ${application.serviceId?.slice(0, 8)} \u00b7 submitted ${formatDate(application.submittedAt || application.createdAt)}`}
        action={<Badge tone={STATUS_TONE[application.status] || "default"}>{application.status}</Badge>}
      />
      <ErrorBanner message={error} />

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "details" && <DetailsTab application={application} />}
      {activeTab === "documents" && <DocumentsTab documents={documents} />}
      {activeTab === "timeline" && <TimelineTab history={history} />}
      {activeTab === "payment" && <PaymentTab challans={challans} />}
    </div>
  );
}
