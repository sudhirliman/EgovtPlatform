import React, { useEffect, useState } from "react";
import { boardsApi, departmentsApi } from "../api/client";
import { PageHeader, Card, Button, Input, Select, Table, Badge, ErrorBanner, LoadingRow, SlideOver, Toggle } from "../components/ui.jsx";
import { Plus, Pencil } from "lucide-react";

const emptyForm = (boardId) => ({ boardId: boardId || "", nameEnglish: "", nameMarathi: "", code: "", active: true });

export default function DepartmentsPage() {
  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filterBoardId, setFilterBoardId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState(null);
  const [form, setForm] = useState(emptyForm());

  async function loadDepartments(boardId) {
    setDepartments(await departmentsApi.list(boardId || undefined));
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const b = await boardsApi.list();
        setBoards(b);
        await loadDepartments();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadDepartments(filterBoardId).catch((e) => setError(e.message));
  }, [filterBoardId]);

  function boardName(id) {
    return boards.find((b) => b.id === id)?.nameEnglish || "-";
  }

  function openNew() {
    setForm(emptyForm(filterBoardId));
    setPanel({});
  }
  function openEdit(dept) {
    setForm({ boardId: dept.boardId, nameEnglish: dept.nameEnglish, nameMarathi: dept.nameMarathi || "", code: dept.code, active: dept.active });
    setPanel(dept);
  }

  async function save(e) {
    e.preventDefault();
    if (!form.boardId) return setError("Select a board first");
    try {
      if (panel?.id) {
        await departmentsApi.update(panel.id, form);
      } else {
        await departmentsApi.create(form);
      }
      setPanel(null);
      await loadDepartments(filterBoardId);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <LoadingRow label="Loading departments..." />;

  return (
    <div>
      <PageHeader
        title="Department master"
        subtitle="Departments across all boards"
        action={
          <Button onClick={openNew}>
            <Plus size={15} aria-hidden="true" /> Add department
          </Button>
        }
      />
      <ErrorBanner message={error} />

      <Card className="mb-4">
        <Select label="Filter by board" value={filterBoardId} onChange={(e) => setFilterBoardId(e.target.value)} className="max-w-xs">
          <option value="">All boards</option>
          {boards.map((b) => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
        </Select>
      </Card>

      <Card>
        <Table
          emptyText="No departments yet"
          columns={[
            { key: "nameEnglish", header: "Name (English)" },
            { key: "nameMarathi", header: "Name (Marathi)", render: (d) => d.nameMarathi || "-" },
            { key: "board", header: "Board", render: (d) => boardName(d.boardId) },
            { key: "code", header: "Code" },
            { key: "active", header: "Status", render: (d) => <Badge tone={d.active ? "success" : "default"}>{d.active ? "Active" : "Inactive"}</Badge> },
            {
              key: "actions",
              header: "",
              render: (d) => (
                <button className="text-slate-400 hover:text-blue-700" onClick={() => openEdit(d)}>
                  <Pencil size={14} aria-hidden="true" />
                </button>
              ),
            },
          ]}
          rows={departments}
        />
      </Card>

      <SlideOver open={!!panel} title={panel?.id ? "Edit department" : "Add department"} onClose={() => setPanel(null)}>
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="flex flex-1 flex-col gap-4">
            <Select label="Board" value={form.boardId} onChange={(e) => setForm({ ...form, boardId: e.target.value })} required>
              <option value="">Select board</option>
              {boards.map((b) => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
            </Select>
            <Input label="Department code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <Input label="Department name (English)" value={form.nameEnglish} onChange={(e) => setForm({ ...form, nameEnglish: e.target.value })} required />
            <Input label="Department name (Marathi)" value={form.nameMarathi} onChange={(e) => setForm({ ...form, nameMarathi: e.target.value })} />
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
          </div>
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setPanel(null)}>Cancel</Button>
            <Button type="submit" className="flex-1 justify-center">{panel?.id ? "Save changes" : "Add department"}</Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
