import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { departmentsApi, servicesApi, boardsApi, workflowApi, rolesApi } from "../api/client";
import { PageHeader, Card, Button, Input, Select, ErrorBanner, LoadingRow, Badge, SlideOver, Toggle } from "../components/ui.jsx";
import { Plus, Trash2 } from "lucide-react";

const STAGE_TYPES = ["SCRUTINY", "PAYMENT_CHECK", "CERTIFICATE_GENERATION", "NOTESHEET_GENERATION", "DISPATCH"];
const STAGE_COLORS = {
  SCRUTINY: "#0f6e56",
  PAYMENT_CHECK: "#993c1d",
  CERTIFICATE_GENERATION: "#3b6d11",
  NOTESHEET_GENERATION: "#854f0b",
  DISPATCH: "#1d4ed8",
};

const V_SPACING = 110;
const CANVAS_X = 260;

function TerminalNode({ data }) {
  return (
    <div className="rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-[12px] font-medium text-slate-500">
      {data.label}
    </div>
  );
}

function StageNode({ data }) {
  return (
    <div
      onClick={data.onClick}
      className="w-56 cursor-pointer rounded-lg border-2 bg-white px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderColor: STAGE_COLORS[data.stageType] || "#94a3b8" }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-800">{data.sequenceOrder}. {data.stageName}</span>
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
          className="text-slate-300 hover:text-red-600"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: STAGE_COLORS[data.stageType] || "#94a3b8" }}>
          {data.stageType}
        </span>
        {data.slaHours && <span className="text-[11px] text-slate-400">SLA {data.slaHours}h</span>}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { stage: StageNode, terminal: TerminalNode };

export default function WorkflowBuilderPage() {
  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [roles, setRoles] = useState([]);

  const [boardId, setBoardId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [workflow, setWorkflow] = useState(null);
  const [stages, setStages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [panel, setPanel] = useState(null); // null closed, {} new, {...stage} edit
  const [form, setForm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [b, r] = await Promise.all([boardsApi.list(), rolesApi.list()]);
        setBoards(b);
        setRoles(r);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!boardId) return setDepartments([]);
    departmentsApi.list(boardId).then(setDepartments).catch((e) => setError(e.message));
    setDepartmentId("");
    setServiceId("");
  }, [boardId]);

  useEffect(() => {
    if (!departmentId) return setServices([]);
    servicesApi.list(departmentId).then(setServices).catch((e) => setError(e.message));
    setServiceId("");
  }, [departmentId]);

  async function loadWorkflow() {
    const list = await workflowApi.list(serviceId);
    const wf = list[0] || null;
    setWorkflow(wf);
    setStages(wf ? await workflowApi.stages(wf.id) : []);
  }

  useEffect(() => {
    if (!serviceId) {
      setWorkflow(null);
      setStages([]);
      return;
    }
    loadWorkflow().catch((e) => setError(e.message));
  }, [serviceId]);

  async function createWorkflow() {
    try {
      const wf = await workflowApi.create({ serviceId });
      setWorkflow(wf);
      setStages([]);
    } catch (e) {
      setError(e.message);
    }
  }

  function openNewStage(stageType) {
    setForm({ sequenceOrder: stages.length + 1, stageName: "", stageType: stageType || "SCRUTINY", slaHours: 24, escalationRoleId: "", eligibleRoleIds: [] });
    setPanel({});
  }

  async function openEditStage(stage) {
    try {
      const roleIds = await workflowApi.stageRoles(workflow.id, stage.id);
      setForm({
        sequenceOrder: stage.sequenceOrder, stageName: stage.stageName, stageType: stage.stageType,
        slaHours: stage.slaHours || 24, escalationRoleId: stage.escalationRoleId || "", eligibleRoleIds: roleIds,
      });
      setPanel(stage);
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveStage(e) {
    e.preventDefault();
    try {
      const payload = { ...form, escalationRoleId: form.escalationRoleId || null };
      if (panel?.id) {
        await workflowApi.updateStage(workflow.id, panel.id, payload);
      } else {
        await workflowApi.addStage(workflow.id, payload);
      }
      setPanel(null);
      await loadWorkflow();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteStage(stage) {
    try {
      await workflowApi.deleteStage(workflow.id, stage.id);
      await loadWorkflow();
    } catch (e) {
      setError(e.message);
    }
  }

  function toggleRole(id) {
    setForm((f) => ({
      ...f,
      eligibleRoleIds: f.eligibleRoleIds.includes(id) ? f.eligibleRoleIds.filter((r) => r !== id) : [...f.eligibleRoleIds, id],
    }));
  }

  // ---- React Flow graph derived from stages (Start -> stages in order -> End) ----
  const { nodes, edges } = useMemo(() => {
    const n = [
      { id: "start", type: "terminal", position: { x: CANVAS_X, y: 0 }, data: { label: "Start" }, draggable: false },
    ];
    const e = [];
    let prevId = "start";
    stages.forEach((s, i) => {
      const id = s.id;
      n.push({
        id,
        type: "stage",
        position: { x: CANVAS_X - 112, y: (i + 1) * V_SPACING },
        data: {
          stageName: s.stageName, stageType: s.stageType, slaHours: s.slaHours, sequenceOrder: s.sequenceOrder,
          onClick: () => openEditStage(s),
          onDelete: () => deleteStage(s),
        },
      });
      e.push({ id: `${prevId}-${id}`, source: prevId, target: id, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#94a3b8" } });
      prevId = id;
    });
    n.push({ id: "end", type: "terminal", position: { x: CANVAS_X, y: (stages.length + 1) * V_SPACING }, data: { label: "End" }, draggable: false });
    e.push({ id: `${prevId}-end`, source: prevId, target: "end", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#94a3b8" } });
    return { nodes: n, edges: e };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages]);

  const onNodeDragStop = useCallback(
    async (event, draggedNode) => {
      if (draggedNode.type !== "stage") return;
      const stageNodes = nodes.filter((n) => n.type === "stage");
      const updatedYs = stageNodes.map((n) => (n.id === draggedNode.id ? draggedNode.position.y : n.position.y));
      const orderedIds = stageNodes
        .map((n, i) => ({ id: n.id, y: updatedYs[i] }))
        .sort((a, b) => a.y - b.y)
        .map((n) => n.id);
      try {
        await workflowApi.reorderStages(workflow.id, orderedIds);
        await loadWorkflow();
      } catch (e) {
        setError(e.message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, workflow]
  );

  if (loading) return <LoadingRow label="Loading workflow builder..." />;

  const slaCount = stages.filter((s) => s.slaHours).length;

  return (
    <div>
      <PageHeader title="Workflow builder" subtitle="Visual canvas - drag stages to reorder, click to edit" />
      <ErrorBanner message={error} />

      <Card className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <Select label="Board" value={boardId} onChange={(e) => setBoardId(e.target.value)}>
            <option value="">Select board</option>
            {boards.map((b) => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
          </Select>
          <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!boardId}>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
          </Select>
          <Select label="Service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={!departmentId}>
            <option value="">Select service</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.nameEnglish}</option>)}
          </Select>
        </div>
      </Card>

      {serviceId && !workflow && (
        <Card className="mb-4">
          <div className="mb-2 text-[13px] text-slate-600">No workflow configured for this service yet.</div>
          <Button onClick={createWorkflow}>Create workflow</Button>
        </Card>
      )}

      {workflow && (
        <>
          <Card className="mb-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div><div className="text-lg font-semibold text-slate-900">{stages.length}</div><div className="text-[11px] text-slate-500">Total stages</div></div>
              <div><div className="text-lg font-semibold text-slate-900">{new Set(stages.map((s) => s.stageType)).size}</div><div className="text-[11px] text-slate-500">Distinct types</div></div>
              <div><div className="text-lg font-semibold text-emerald-600">{slaCount}</div><div className="text-[11px] text-slate-500">SLA enabled</div></div>
              <div><div className="text-lg font-semibold text-slate-900">{stages.filter((s) => s.stageType === "SCRUTINY").length}</div><div className="text-[11px] text-slate-500">Scrutiny steps</div></div>
            </div>
          </Card>

          <div className="grid grid-cols-4 gap-4">
            <Card className="col-span-1 h-fit">
              <div className="mb-2 text-[13px] font-medium text-slate-900">Add stage</div>
              <div className="flex flex-col gap-1.5">
                {STAGE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => openNewStage(t)}
                    className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[t] }} />
                    {t.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">Drag a stage box on the canvas to reorder it. Click a stage to edit its SLA and eligible roles.</p>
            </Card>

            <Card className="col-span-3 p-0" style={{ height: 520 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeDragStop={onNodeDragStop}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={16} color="#e2e8f0" />
                <Controls showInteractive={false} />
              </ReactFlow>
            </Card>
          </div>
        </>
      )}

      <SlideOver open={!!panel} title={panel?.id ? "Edit stage" : "Add stage"} onClose={() => setPanel(null)}>
        {form && (
          <form onSubmit={saveStage} className="flex h-full flex-col">
            <div className="flex flex-1 flex-col gap-4">
              <Input label="Stage name" value={form.stageName} onChange={(e) => setForm({ ...form, stageName: e.target.value })} required />
              <Select label="Stage type" value={form.stageType} onChange={(e) => setForm({ ...form, stageType: e.target.value })}>
                {STAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Input label="SLA hours" type="number" min="0" value={form.slaHours} onChange={(e) => setForm({ ...form, slaHours: Number(e.target.value) })} />
              <Select label="Escalation role (optional)" value={form.escalationRoleId} onChange={(e) => setForm({ ...form, escalationRoleId: e.target.value })}>
                <option value="">None</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
              <div>
                <div className="mb-1 text-[13px] text-slate-600">Eligible roles</div>
                <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {roles.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 py-0.5 text-[12px] text-slate-600">
                      <input type="checkbox" checked={form.eligibleRoleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
                      {r.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-200 pt-4">
              <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setPanel(null)}>Cancel</Button>
              <Button type="submit" className="flex-1 justify-center">{panel?.id ? "Save changes" : "Add stage"}</Button>
            </div>
          </form>
        )}
      </SlideOver>
    </div>
  );
}
