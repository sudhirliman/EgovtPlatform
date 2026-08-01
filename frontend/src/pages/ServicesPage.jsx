import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardsApi, departmentsApi, servicesApi } from "../api/client";
import { PageHeader, Card, Button, Select, Table, Badge, ErrorBanner, LoadingRow } from "../components/ui.jsx";
import { Plus } from "lucide-react";

export default function ServicesPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [boardId, setBoardId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [b, d, s] = await Promise.all([boardsApi.list(), departmentsApi.list(), servicesApi.list()]);
        setBoards(b);
        setDepartments(d);
        setServices(s);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!boardId) return;
    departmentsApi.list(boardId).then(setDepartments).catch((e) => setError(e.message));
    setDepartmentId("");
  }, [boardId]);

  useEffect(() => {
    servicesApi.list(departmentId || undefined).then(setServices).catch((e) => setError(e.message));
  }, [departmentId]);

  function deptName(id) {
    return departments.find((d) => d.id === id)?.nameEnglish || "-";
  }

  const visibleDepartments = boardId ? departments.filter((d) => d.boardId === boardId) : departments;

  if (loading) return <LoadingRow label="Loading services..." />;

  return (
    <div>
      <PageHeader
        title="Service master"
        subtitle="Services across all departments"
        action={
          <Button onClick={() => navigate("/services/new")}>
            <Plus size={15} aria-hidden="true" /> Add new service
          </Button>
        }
      />
      <ErrorBanner message={error} />

      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Filter by board" value={boardId} onChange={(e) => setBoardId(e.target.value)}>
            <option value="">All boards</option>
            {boards.map((b) => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
          </Select>
          <Select label="Filter by department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">All departments</option>
            {visibleDepartments.map((d) => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        <Table
          emptyText="No services yet - use Add new service"
          columns={[
            { key: "nameEnglish", header: "Name (English)" },
            { key: "nameMarathi", header: "Name (Marathi)", render: (s) => s.nameMarathi || "-" },
            { key: "department", header: "Department", render: (s) => deptName(s.departmentId) },
            { key: "code", header: "Code" },
            { key: "mode", header: "Mode" },
            { key: "active", header: "Status", render: (s) => <Badge tone={s.active ? "success" : "default"}>{s.active ? "Active" : "Inactive"}</Badge> },
          ]}
          rows={services}
        />
      </Card>
    </div>
  );
}
