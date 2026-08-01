import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { applicationsApi, boardsApi, departmentsApi, servicesApi } from "../api/client";
import { PageHeader, Card, Table, Badge, ErrorBanner, LoadingRow, Button, Input, Select } from "../components/ui.jsx";

const STATUS_TONE = {
  DRAFT: "default",
  SUBMITTED: "warning",
  IN_PROGRESS: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  DISPATCHED: "success",
};

const STATUSES = ["DRAFT", "SUBMITTED", "IN_PROGRESS", "APPROVED", "REJECTED", "DISPATCHED"];
const PAGE_SIZE = 10;

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

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

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!filters.boardId) return setDepartments([]);
    departmentsApi.list(filters.boardId).then(setDepartments).catch((e) => setError(e.message));
  }, [filters.boardId]);

  useEffect(() => {
    if (!filters.departmentId) return setServices([]);
    servicesApi.list(filters.departmentId).then(setServices).catch((e) => setError(e.message));
  }, [filters.departmentId]);

  async function submit(id) {
    try {
      await applicationsApi.submit(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (filters.search) {
        const needle = filters.search.toLowerCase();
        const haystack = `${a.applicationNo || ""} ${a.id}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (filters.serviceId && a.serviceId !== filters.serviceId) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.fromDate && new Date(a.createdAt) < new Date(filters.fromDate)) return false;
      if (filters.toDate && new Date(a.createdAt) > new Date(filters.toDate + "T23:59:59")) return false;
      return true;
    });
  }, [applications, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setFilters({ search: "", boardId: "", departmentId: "", serviceId: "", status: "", fromDate: "", toDate: "" });
    setPage(1);
  }

  if (loading) return <LoadingRow label="Loading applications..." />;

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle={`${filtered.length} of ${applications.length} applications`}
        action={<Button variant="secondary" onClick={load}>Refresh</Button>}
      />
      <ErrorBanner message={error} />

      <Card className="mb-4">
        <div className="grid grid-cols-4 gap-3">
          <Input
            label="Search"
            placeholder="Application no or ID"
            value={filters.search}
            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
          />
          <Select label="Board" value={filters.boardId} onChange={(e) => { setFilters({ ...filters, boardId: e.target.value, departmentId: "", serviceId: "" }); setPage(1); }}>
            <option value="">All</option>
            {boards.map((b) => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
          </Select>
          <Select label="Department" value={filters.departmentId} onChange={(e) => { setFilters({ ...filters, departmentId: e.target.value, serviceId: "" }); setPage(1); }} disabled={!filters.boardId}>
            <option value="">All</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
          </Select>
          <Select label="Service" value={filters.serviceId} onChange={(e) => { setFilters({ ...filters, serviceId: e.target.value }); setPage(1); }} disabled={!filters.departmentId}>
            <option value="">All</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.nameEnglish}</option>)}
          </Select>
          <Select label="Status" value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="From date" type="date" value={filters.fromDate} onChange={(e) => { setFilters({ ...filters, fromDate: e.target.value }); setPage(1); }} />
          <Input label="To date" type="date" value={filters.toDate} onChange={(e) => { setFilters({ ...filters, toDate: e.target.value }); setPage(1); }} />
          <div className="flex items-end">
            <Button variant="secondary" onClick={resetFilters}>Reset filters</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          emptyText="No applications match these filters"
          columns={[
            {
              key: "applicationNo",
              header: "Application no",
              render: (r) => (
                <Link to={`/applications/${r.id}`} className="text-blue-700 hover:underline">
                  {r.applicationNo || r.id.slice(0, 8)}
                </Link>
              ),
            },
            { key: "serviceId", header: "Service id", render: (r) => r.serviceId?.slice(0, 8) },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge tone={STATUS_TONE[r.status] || "default"}>{r.status}</Badge>,
            },
            {
              key: "actions",
              header: "",
              render: (r) =>
                r.status === "DRAFT" ? (
                  <button className="text-xs text-blue-700 hover:underline" onClick={() => submit(r.id)}>
                    Submit
                  </button>
                ) : (
                  <Link to={`/applications/${r.id}`} className="text-xs text-slate-500 hover:underline">
                    View
                  </Link>
                ),
            },
          ]}
          rows={pageRows}
        />

        {filtered.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-[13px] text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
