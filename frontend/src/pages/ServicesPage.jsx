import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardsApi, departmentsApi, servicesApi } from "../api/client";
import { Plus, Pencil, ToggleLeft, ToggleRight, X, AlertCircle, Boxes, Search } from "lucide-react";

const APPLICABILITY_OPTIONS = ["CITIZEN", "GOVERNMENT", "BOTH"];
const MODE_OPTIONS = ["ONLINE", "OFFLINE", "BOTH"];

function Field({ label, required, children }) {
  return (
    <div className="relative">
      <label className={`absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-slate-500 z-10${required ? " after:content-['*'] after:text-red-500 after:ml-0.5" : ""}`}>
        {label}
      </label>
      {children}
    </div>
  );
}
const inp = "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none bg-white";

function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-700">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

const emptyEdit = (s) => ({
  nameEnglish: s?.nameEnglish || "",
  nameMarathi: s?.nameMarathi || "",
  code: s?.code || "",
  description: s?.description || "",
  boardId: s?.boardId || "",
  departmentId: s?.departmentId || "",
  serviceCategory: s?.serviceCategory || "",
  serviceType: s?.serviceType || "",
  applicability: s?.applicability || "BOTH",
  mode: s?.mode || "ONLINE",
  applicationFee: s?.applicationFee ?? 0,
  processingFee: s?.processingFee ?? 0,
  securityDeposit: s?.securityDeposit ?? 0,
  slaDays: s?.slaDays ?? 21,
  applicationNumberFormat: s?.applicationNumberFormat || "",
  certificateNumberFormat: s?.certificateNumberFormat || "",
  active: s?.active ?? true,
  workingDaysOnly: s?.workingDaysOnly ?? false,
  challanRequired: s?.challanRequired ?? true,
  approvalRequired: s?.approvalRequired ?? true,
  digitalSignatureRequired: s?.digitalSignatureRequired ?? false,
  qrCodeRequired: s?.qrCodeRequired ?? false,
  aaplesarkarIntegrationRequired: s?.aaplesarkarIntegrationRequired ?? false,
  digilockerIntegrationRequired: s?.digilockerIntegrationRequired ?? false,
  grievanceAllowed: s?.grievanceAllowed ?? true,
  appealAllowed: s?.appealAllowed ?? true,
});

export default function ServicesPage() {
  const navigate = useNavigate();
  const [allBoards, setAllBoards] = useState([]);
  const [allDepts, setAllDepts] = useState([]);
  const [services, setServices] = useState([]);
  const [filterBoard, setFilterBoard] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit modal state
  const [editPanel, setEditPanel] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editDepts, setEditDepts] = useState([]);
  const set = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  async function load() {
    try {
      setLoading(true);
      const [b, d, s] = await Promise.all([boardsApi.list(), departmentsApi.list(), servicesApi.list()]);
      setAllBoards(b); setAllDepts(d); setServices(s);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!filterBoard) { setAllDepts([]); setFilterDept(""); return; }
    departmentsApi.list(filterBoard).then(d => { setAllDepts(d); setFilterDept(""); }).catch(e => setError(e.message));
  }, [filterBoard]);

  useEffect(() => {
    servicesApi.list(filterDept || undefined).then(setServices).catch(e => setError(e.message));
  }, [filterDept]);

  function openEdit(s) {
    setEditForm(emptyEdit(s));
    setEditPanel(s);
    if (s.boardId) {
      departmentsApi.list(s.boardId).then(setEditDepts).catch(e => setError(e.message));
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await servicesApi.update(editPanel.id, editForm);
      setEditPanel(null);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function toggleActive(s) {
    const action = s.active ? "deactivate" : "activate";
    if (!window.confirm(`${s.active ? "Deactivate" : "Activate"} "${s.nameEnglish}"?`)) return;
    try {
      await servicesApi.deactivate(s.id);
      await load();
    } catch (e) { setError(e.message); }
  }

  function deptName(id) {
    return allDepts.find(d => d.id === id)?.nameEnglish || "-";
  }

  const q = search.toLowerCase();
  const visible = services.filter(s =>
    s.nameEnglish?.toLowerCase().includes(q) ||
    s.nameMarathi?.toLowerCase().includes(q) ||
    s.code?.toLowerCase().includes(q)
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Boxes size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Services</h1>
            <p className="text-sm text-slate-500 mt-0.5">All services across boards and departments</p>
          </div>
        </div>
        <button onClick={() => navigate("/services/new")}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 flex-shrink-0">
          <Plus size={15} /> Add New Service
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services…"
            className="w-56 rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none shadow-sm" />
        </div>
        <select value={filterBoard} onChange={e => setFilterBoard(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none shadow-sm">
          <option value="">All boards</option>
          {allBoards.map(b => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          disabled={!filterBoard}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none shadow-sm disabled:opacity-40">
          <option value="">All departments</option>
          {allDepts.map(d => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <Boxes size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">{search ? "No services match your search" : "No services yet"}</p>
            <button onClick={() => navigate("/services/new")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus size={13} /> Add first service
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Mode</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee (₹)</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800">{s.nameEnglish}</div>
                    {s.nameMarathi && <div className="text-xs text-slate-400">{s.nameMarathi}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">{s.code}</code>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{deptName(s.departmentId)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">{s.mode}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600 text-xs">
                    {s.applicationFee > 0 ? `₹${s.applicationFee}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(s)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggleActive(s)}
                        className={`rounded-lg p-1.5 transition-colors ${s.active ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" : "text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"}`}
                        title={s.active ? "Deactivate" : "Activate"}>
                        {s.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && services.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          {services.filter(s => s.active).length} active · {services.filter(s => !s.active).length} inactive · {services.length} total
        </p>
      )}

      {/* Edit Modal */}
      {editPanel && editForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-6 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl my-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Service</h2>
              <button onClick={() => setEditPanel(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={saveEdit} className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Service Code" required>
                  <input required value={editForm.code} onChange={e => set("code", e.target.value)} className={inp} />
                </Field>
                <Field label="Name (English)" required>
                  <input required value={editForm.nameEnglish} onChange={e => set("nameEnglish", e.target.value)} className={inp} />
                </Field>
                <Field label="Name (Marathi)">
                  <input value={editForm.nameMarathi} onChange={e => set("nameMarathi", e.target.value)} className={inp} />
                </Field>
              </div>

              <Field label="Description">
                <textarea rows={2} value={editForm.description} onChange={e => set("description", e.target.value)} className={inp} />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Board" required>
                  <select required value={editForm.boardId}
                    onChange={e => { set("boardId", e.target.value); set("departmentId", ""); departmentsApi.list(e.target.value).then(setEditDepts); }}
                    className={inp}>
                    <option value="">Select board</option>
                    {allBoards.map(b => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
                  </select>
                </Field>
                <Field label="Department" required>
                  <select required value={editForm.departmentId} onChange={e => set("departmentId", e.target.value)}
                    disabled={!editForm.boardId} className={inp + (!editForm.boardId ? " opacity-50" : "")}>
                    <option value="">Select department</option>
                    {editDepts.map(d => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
                  </select>
                </Field>
                <Field label="Service Category">
                  <input value={editForm.serviceCategory} onChange={e => set("serviceCategory", e.target.value)} className={inp} />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Service Type">
                  <input value={editForm.serviceType} onChange={e => set("serviceType", e.target.value)} className={inp} />
                </Field>
                <Field label="Applicability">
                  <select value={editForm.applicability} onChange={e => set("applicability", e.target.value)} className={inp}>
                    {APPLICABILITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Mode">
                  <select value={editForm.mode} onChange={e => set("mode", e.target.value)} className={inp}>
                    {MODE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Application Fee (₹)">
                  <input type="number" min="0" value={editForm.applicationFee} onChange={e => set("applicationFee", Number(e.target.value))} className={inp} />
                </Field>
                <Field label="Processing Fee (₹)">
                  <input type="number" min="0" value={editForm.processingFee} onChange={e => set("processingFee", Number(e.target.value))} className={inp} />
                </Field>
                <Field label="SLA (days)">
                  <input type="number" min="1" value={editForm.slaDays} onChange={e => set("slaDays", Number(e.target.value))} className={inp} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Application Number Format">
                  <input value={editForm.applicationNumberFormat} onChange={e => set("applicationNumberFormat", e.target.value)} className={inp} placeholder="MHADA-{YYYY}-{SEQ}" />
                </Field>
                <Field label="Certificate Number Format">
                  <input value={editForm.certificateNumberFormat} onChange={e => set("certificateNumberFormat", e.target.value)} className={inp} placeholder="CERT-{YYYY}-{SEQ}" />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-x-6 gap-y-3 rounded-xl bg-slate-50 px-5 py-4">
                <Toggle checked={editForm.active} onChange={v => set("active", v)} label="Active" />
                <Toggle checked={editForm.workingDaysOnly} onChange={v => set("workingDaysOnly", v)} label="Working days only" />
                <Toggle checked={editForm.challanRequired} onChange={v => set("challanRequired", v)} label="Challan required" />
                <Toggle checked={editForm.approvalRequired} onChange={v => set("approvalRequired", v)} label="Approval required" />
                <Toggle checked={editForm.digitalSignatureRequired} onChange={v => set("digitalSignatureRequired", v)} label="Digital signature" />
                <Toggle checked={editForm.qrCodeRequired} onChange={v => set("qrCodeRequired", v)} label="QR code required" />
                <Toggle checked={editForm.aaplesarkarIntegrationRequired} onChange={v => set("aaplesarkarIntegrationRequired", v)} label="Aaplesarkar integration" />
                <Toggle checked={editForm.digilockerIntegrationRequired} onChange={v => set("digilockerIntegrationRequired", v)} label="DigiLocker integration" />
                <Toggle checked={editForm.grievanceAllowed} onChange={v => set("grievanceAllowed", v)} label="Grievance allowed" />
                <Toggle checked={editForm.appealAllowed} onChange={v => set("appealAllowed", v)} label="Appeal allowed" />
              </div>

              <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
                <button type="button" onClick={() => setEditPanel(null)}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
