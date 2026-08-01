import React, { useEffect, useState } from "react";
import { boardsApi } from "../api/client";
import { PageHeader, Card, Button, Input, Table, Badge, ErrorBanner, LoadingRow, SlideOver, Toggle } from "../components/ui.jsx";
import { Plus, Pencil } from "lucide-react";

const EMPTY_BOARD = { nameEnglish: "", nameMarathi: "", code: "", active: true };

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState(null); // null closed, {} new, {...board} edit
  const [form, setForm] = useState(EMPTY_BOARD);

  async function load() {
    try {
      setLoading(true);
      setBoards(await boardsApi.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(EMPTY_BOARD);
    setPanel({});
  }
  function openEdit(board) {
    setForm({ nameEnglish: board.nameEnglish, nameMarathi: board.nameMarathi || "", code: board.code, active: board.active });
    setPanel(board);
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (panel?.id) {
        await boardsApi.update(panel.id, form);
      } else {
        await boardsApi.create(form);
      }
      setPanel(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <LoadingRow label="Loading boards..." />;

  return (
    <div>
      <PageHeader
        title="Board master"
        subtitle="Top-level organisations - MHADA, and any others you add"
        action={
          <Button onClick={openNew}>
            <Plus size={15} aria-hidden="true" /> Add board
          </Button>
        }
      />
      <ErrorBanner message={error} />

      <Card>
        <Table
          emptyText="No boards yet"
          columns={[
            { key: "nameEnglish", header: "Name (English)" },
            { key: "nameMarathi", header: "Name (Marathi)", render: (b) => b.nameMarathi || "-" },
            { key: "code", header: "Code" },
            { key: "active", header: "Status", render: (b) => <Badge tone={b.active ? "success" : "default"}>{b.active ? "Active" : "Inactive"}</Badge> },
            {
              key: "actions",
              header: "",
              render: (b) => (
                <button className="text-slate-400 hover:text-blue-700" onClick={() => openEdit(b)}>
                  <Pencil size={14} aria-hidden="true" />
                </button>
              ),
            },
          ]}
          rows={boards}
        />
      </Card>

      <SlideOver open={!!panel} title={panel?.id ? "Edit board" : "Add board"} onClose={() => setPanel(null)}>
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="flex flex-1 flex-col gap-4">
            <Input label="Board code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <Input label="Board name (English)" value={form.nameEnglish} onChange={(e) => setForm({ ...form, nameEnglish: e.target.value })} required />
            <Input label="Board name (Marathi)" value={form.nameMarathi} onChange={(e) => setForm({ ...form, nameMarathi: e.target.value })} />
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
          </div>
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setPanel(null)}>Cancel</Button>
            <Button type="submit" className="flex-1 justify-center">{panel?.id ? "Save changes" : "Add board"}</Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
