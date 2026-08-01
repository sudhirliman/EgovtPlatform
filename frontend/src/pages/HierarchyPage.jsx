import React, { useEffect, useState } from "react";
import { boardsApi, departmentsApi, servicesApi } from "../api/client";
import {
  PageHeader,
  Card,
  Button,
  Input,
  Table,
  Badge,
  ErrorBanner,
  LoadingRow,
  SlideOver,
  Breadcrumb,
  Toggle,
} from "../components/ui.jsx";
import { Plus, Pencil } from "lucide-react";

const EMPTY_BOARD = { nameEnglish: "", nameMarathi: "", code: "", active: true };
const EMPTY_DEPT = { nameEnglish: "", nameMarathi: "", code: "", active: true };

export default function HierarchyPage() {
  // navigation level: "boards" | "departments" | "services"
  const [level, setLevel] = useState("boards");
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [boardPanel, setBoardPanel] = useState(null); // null closed, {} new, {...board} edit
  const [deptPanel, setDeptPanel] = useState(null);
  const [boardForm, setBoardForm] = useState(EMPTY_BOARD);
  const [deptForm, setDeptForm] = useState(EMPTY_DEPT);

  async function loadBoards() {
    setBoards(await boardsApi.list());
  }
  async function loadDepartments(boardId) {
    setDepartments(await departmentsApi.list(boardId));
  }
  async function loadServices(departmentId) {
    setServices(await servicesApi.list(departmentId));
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadBoards();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openBoard(board) {
    setSelectedBoard(board);
    setLevel("departments");
    loadDepartments(board.id).catch((e) => setError(e.message));
  }
  function openDepartment(dept) {
    setSelectedDepartment(dept);
    setLevel("services");
    loadServices(dept.id).catch((e) => setError(e.message));
  }
  function backToBoards() {
    setLevel("boards");
    setSelectedBoard(null);
    setSelectedDepartment(null);
  }
  function backToDepartments() {
    setLevel("departments");
    setSelectedDepartment(null);
  }

  function openNewBoard() {
    setBoardForm(EMPTY_BOARD);
    setBoardPanel({});
  }
  function openEditBoard(board) {
    setBoardForm({ nameEnglish: board.nameEnglish, nameMarathi: board.nameMarathi || "", code: board.code, active: board.active });
    setBoardPanel(board);
  }
  async function saveBoard(e) {
    e.preventDefault();
    try {
      if (boardPanel?.id) {
        await boardsApi.update(boardPanel.id, boardForm);
      } else {
        await boardsApi.create(boardForm);
      }
      setBoardPanel(null);
      await loadBoards();
    } catch (e) {
      setError(e.message);
    }
  }

  function openNewDept() {
    setDeptForm(EMPTY_DEPT);
    setDeptPanel({});
  }
  function openEditDept(dept) {
    setDeptForm({ nameEnglish: dept.nameEnglish, nameMarathi: dept.nameMarathi || "", code: dept.code, active: dept.active });
    setDeptPanel(dept);
  }
  async function saveDept(e) {
    e.preventDefault();
    try {
      const payload = { ...deptForm, boardId: selectedBoard.id };
      if (deptPanel?.id) {
        await departmentsApi.update(deptPanel.id, payload);
      } else {
        await departmentsApi.create(payload);
      }
      setDeptPanel(null);
      await loadDepartments(selectedBoard.id);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <LoadingRow label="Loading hierarchy..." />;

  return (
    <div>
      {level === "boards" && (
        <>
          <Breadcrumb items={[{ label: "Boards" }]} />
          <PageHeader
            title="Boards"
            subtitle="Top-level organisations - MHADA, and any others you add"
            action={
              <Button onClick={openNewBoard}>
                <Plus size={15} aria-hidden="true" /> Add board
              </Button>
            }
          />
          <ErrorBanner message={error} />
          <Card>
            <Table
              emptyText="No boards yet"
              columns={[
                { key: "nameEnglish", header: "Name (English)", render: (b) => (
                  <button className="text-blue-700 hover:underline" onClick={() => openBoard(b)}>{b.nameEnglish}</button>
                ) },
                { key: "nameMarathi", header: "Name (Marathi)", render: (b) => b.nameMarathi || "-" },
                { key: "code", header: "Code" },
                { key: "active", header: "Status", render: (b) => <Badge tone={b.active ? "success" : "default"}>{b.active ? "Active" : "Inactive"}</Badge> },
                { key: "actions", header: "", render: (b) => (
                  <button className="text-slate-400 hover:text-blue-700" onClick={() => openEditBoard(b)}><Pencil size={14} aria-hidden="true" /></button>
                ) },
              ]}
              rows={boards}
            />
          </Card>
        </>
      )}

      {level === "departments" && selectedBoard && (
        <>
          <Breadcrumb items={[{ label: "Boards", onClick: backToBoards }, { label: selectedBoard.nameEnglish }]} />
          <PageHeader
            title={`Departments - ${selectedBoard.nameEnglish}`}
            action={
              <Button onClick={openNewDept}>
                <Plus size={15} aria-hidden="true" /> Add department
              </Button>
            }
          />
          <ErrorBanner message={error} />
          <Card>
            <Table
              emptyText="No departments yet"
              columns={[
                { key: "nameEnglish", header: "Name (English)", render: (d) => (
                  <button className="text-blue-700 hover:underline" onClick={() => openDepartment(d)}>{d.nameEnglish}</button>
                ) },
                { key: "nameMarathi", header: "Name (Marathi)", render: (d) => d.nameMarathi || "-" },
                { key: "code", header: "Code" },
                { key: "active", header: "Status", render: (d) => <Badge tone={d.active ? "success" : "default"}>{d.active ? "Active" : "Inactive"}</Badge> },
                { key: "actions", header: "", render: (d) => (
                  <button className="text-slate-400 hover:text-blue-700" onClick={() => openEditDept(d)}><Pencil size={14} aria-hidden="true" /></button>
                ) },
              ]}
              rows={departments}
            />
          </Card>
        </>
      )}

      {level === "services" && selectedDepartment && (
        <>
          <Breadcrumb items={[
            { label: "Boards", onClick: backToBoards },
            { label: selectedBoard.nameEnglish, onClick: backToDepartments },
            { label: selectedDepartment.nameEnglish },
          ]} />
          <PageHeader
            title={`Services - ${selectedDepartment.nameEnglish}`}
            subtitle="Use the Add new service wizard for full service configuration"
          />
          <ErrorBanner message={error} />
          <Card>
            <Table
              emptyText="No services yet - use Add new service from the sidebar"
              columns={[
                { key: "nameEnglish", header: "Name (English)" },
                { key: "nameMarathi", header: "Name (Marathi)", render: (s) => s.nameMarathi || "-" },
                { key: "code", header: "Code" },
                { key: "mode", header: "Mode" },
                { key: "active", header: "Status", render: (s) => <Badge tone={s.active ? "success" : "default"}>{s.active ? "Active" : "Inactive"}</Badge> },
              ]}
              rows={services}
            />
          </Card>
        </>
      )}

      <SlideOver open={!!boardPanel} title={boardPanel?.id ? "Edit board" : "Add board"} onClose={() => setBoardPanel(null)}>
        <form onSubmit={saveBoard} className="flex h-full flex-col">
          <div className="flex-1 flex flex-col gap-4">
            <Input label="Board code" value={boardForm.code} onChange={(e) => setBoardForm({ ...boardForm, code: e.target.value })} required />
            <Input label="Board name (English)" value={boardForm.nameEnglish} onChange={(e) => setBoardForm({ ...boardForm, nameEnglish: e.target.value })} required />
            <Input label="Board name (Marathi)" value={boardForm.nameMarathi} onChange={(e) => setBoardForm({ ...boardForm, nameMarathi: e.target.value })} />
            <Toggle checked={boardForm.active} onChange={(v) => setBoardForm({ ...boardForm, active: v })} label="Active" />
          </div>
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setBoardPanel(null)}>Cancel</Button>
            <Button type="submit" className="flex-1 justify-center">{boardPanel?.id ? "Save changes" : "Add board"}</Button>
          </div>
        </form>
      </SlideOver>

      <SlideOver open={!!deptPanel} title={deptPanel?.id ? "Edit department" : "Add department"} onClose={() => setDeptPanel(null)}>
        <form onSubmit={saveDept} className="flex h-full flex-col">
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <div className="mb-1 text-[13px] text-slate-600">Board</div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                {selectedBoard?.nameEnglish}
              </div>
            </div>
            <Input label="Department code" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} required />
            <Input label="Department name (English)" value={deptForm.nameEnglish} onChange={(e) => setDeptForm({ ...deptForm, nameEnglish: e.target.value })} required />
            <Input label="Department name (Marathi)" value={deptForm.nameMarathi} onChange={(e) => setDeptForm({ ...deptForm, nameMarathi: e.target.value })} />
            <Toggle checked={deptForm.active} onChange={(v) => setDeptForm({ ...deptForm, active: v })} label="Active" />
          </div>
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setDeptPanel(null)}>Cancel</Button>
            <Button type="submit" className="flex-1 justify-center">{deptPanel?.id ? "Save changes" : "Add department"}</Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
