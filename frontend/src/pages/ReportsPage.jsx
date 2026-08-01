import React, { useEffect, useState } from "react";
import { boardsApi, departmentsApi, servicesApi, reportsApi } from "../api/client";
import { PageHeader, Card, Button, Select, Input, Table, Badge, ErrorBanner } from "../components/ui.jsx";

export default function ReportsPage() {
  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ boardId: "", departmentId: "", serviceId: "", fromDate: "", toDate: "" });
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    boardsApi.list().then(setBoards).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!filters.boardId) return setDepartments([]);
    departmentsApi.list(filters.boardId).then(setDepartments).catch((e) => setError(e.message));
  }, [filters.boardId]);

  useEffect(() => {
    if (!filters.departmentId) return setServices([]);
    servicesApi.list(filters.departmentId).then(setServices).catch((e) => setError(e.message));
  }, [filters.departmentId]);

  async function runReport() {
    try {
      const data = await reportsApi.pendency(filters);
      setRows(data);
      setLoaded(true);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Pendency report - filter by board / department / service / date range" />
      <ErrorBanner message={error} />

      <Card className="mb-4">
        <div className="grid grid-cols-5 gap-3">
          <Select label="Board" value={filters.boardId} onChange={(e) => setFilters({ ...filters, boardId: e.target.value, departmentId: "", serviceId: "" })}>
            <option value="">All</option>
            {boards.map((b) => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
          </Select>
          <Select label="Department" value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value, serviceId: "" })} disabled={!filters.boardId}>
            <option value="">All</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
          </Select>
          <Select label="Service" value={filters.serviceId} onChange={(e) => setFilters({ ...filters, serviceId: e.target.value })} disabled={!filters.departmentId}>
            <option value="">All</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.nameEnglish}</option>)}
          </Select>
          <Input label="From date" type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
          <Input label="To date" type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
        </div>
        <div className="mt-3">
          <Button onClick={runReport}>Run report</Button>
        </div>
      </Card>

      {loaded && (
        <Card>
          <div className="mb-3 text-[13px] font-medium text-slate-900">Pending applications ({rows.length})</div>
          <Table
            emptyText="No pending applications match these filters"
            columns={[
              { key: "applicationNo", header: "Application no", render: (r) => r.applicationNo || String(r.applicationId).slice(0, 8) },
              { key: "status", header: "Status", render: (r) => <Badge tone="warning">{r.status}</Badge> },
              { key: "currentStageId", header: "Current stage", render: (r) => String(r.currentStageId).slice(0, 8) },
            ]}
            rows={rows}
            keyField="applicationId"
          />
        </Card>
      )}
    </div>
  );
}
