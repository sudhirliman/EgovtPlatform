import React, { useEffect, useState, useCallback, useRef } from "react";
import { boardsApi, departmentsApi, servicesApi, formDesignerApi, masterFormFieldsApi } from "../api/client";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Library, X, AlertCircle, GripVertical,
  Type, Hash, CalendarDays, List, Paperclip, AlignLeft, CheckSquare, RefreshCw,
  FileText,
} from "lucide-react";

// ── Field type meta ───────────────────────────────────────────────────────

const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "DROPDOWN", "FILE", "TEXTAREA", "CHECKBOX"];
const TYPE_ICON = {
  TEXT: Type, NUMBER: Hash, DATE: CalendarDays, DROPDOWN: List,
  FILE: Paperclip, TEXTAREA: AlignLeft, CHECKBOX: CheckSquare,
};
const TYPE_COLOR = {
  TEXT:     "bg-blue-100 text-blue-700",
  NUMBER:   "bg-violet-100 text-violet-700",
  DATE:     "bg-emerald-100 text-emerald-700",
  DROPDOWN: "bg-amber-100 text-amber-700",
  FILE:     "bg-orange-100 text-orange-700",
  TEXTAREA: "bg-sky-100 text-sky-700",
  CHECKBOX: "bg-pink-100 text-pink-700",
};

const OPERATORS       = ["EQUALS", "NOT_EQUALS", "IN"];
const CROSS_OPERATORS = ["EQUALS", "NOT_EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUAL", "LESS_THAN", "LESS_THAN_OR_EQUAL"];

const emptyField = (order) => ({
  fieldKey: "", label: "", type: "TEXT", required: true, displayOrder: order, options: "",
  conditionFieldKey: "", conditionOperator: "EQUALS", conditionValue: "",
  requiredConditionFieldKey: "", requiredConditionOperator: "EQUALS", requiredConditionValue: "",
  crossValidateFieldKey: "", crossValidateOperator: "GREATER_THAN_OR_EQUAL", crossValidateMessage: "",
});
const emptyDoc = (order) => ({
  documentName: "", mandatory: true, allowedFileTypes: "pdf,jpg,png", maxFileSizeMb: 5, maxCount: 1, displayOrder: order,
});

// ── Utilities ─────────────────────────────────────────────────────────────

function parseOptions(validationRules) {
  try { return (JSON.parse(validationRules || "{}").options || []).join(", "); } catch { return ""; }
}
function toValidationRules(csv) {
  const opts = csv.split(",").map(s => s.trim()).filter(Boolean);
  return opts.length ? JSON.stringify({ options: opts }) : null;
}
function isFieldVisible(field, values) {
  if (!field.conditionFieldKey) return true;
  const actual   = (values[field.conditionFieldKey] ?? "").toString().trim();
  const expected = (field.conditionValue || "").toString().trim();
  if (field.conditionOperator === "NOT_EQUALS") return actual !== expected;
  if (field.conditionOperator === "IN") return expected.split(",").map(v => v.trim()).includes(actual);
  return actual === expected;
}
function isFieldRequired(field, values) {
  if (field.required) return true;
  if (!field.requiredConditionFieldKey) return false;
  const actual   = (values[field.requiredConditionFieldKey] ?? "").toString().trim();
  const expected = (field.requiredConditionValue || "").toString().trim();
  if (field.requiredConditionOperator === "NOT_EQUALS") return actual !== expected;
  if (field.requiredConditionOperator === "IN") return expected.split(",").map(v => v.trim()).includes(actual);
  return actual === expected;
}
function checkCrossValidation(field, values) {
  if (!field.crossValidateFieldKey) return null;
  const a = values[field.fieldKey], b = values[field.crossValidateFieldKey];
  if (a === undefined || a === "" || b === undefined || b === "") return null;
  const av = field.type === "NUMBER" ? Number(a) : a;
  const bv = field.type === "NUMBER" ? Number(b) : b;
  let ok;
  switch (field.crossValidateOperator) {
    case "EQUALS":              ok = av === bv; break;
    case "NOT_EQUALS":          ok = av !== bv; break;
    case "GREATER_THAN":        ok = av >   bv; break;
    case "GREATER_THAN_OR_EQUAL": ok = av >= bv; break;
    case "LESS_THAN":           ok = av <   bv; break;
    case "LESS_THAN_OR_EQUAL":  ok = av <= bv; break;
    default:                    ok = true;
  }
  return ok ? null : (field.crossValidateMessage || `${field.label} fails cross-field validation`);
}

// ── Shared UI primitives ──────────────────────────────────────────────────

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
const inp = "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none";

function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

// ── Field Modal ───────────────────────────────────────────────────────────

function FieldModal({ panel, form, setForm, fields, onClose, onSave }) {
  const isEdit = !!panel?.id;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-8 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl my-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Field" : "Add Field"}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <form onSubmit={onSave} className="px-6 py-5 space-y-5">
          {/* Basic */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Field Key" required>
              <input required value={form.fieldKey} onChange={e => set("fieldKey", e.target.value)}
                className={inp} placeholder="e.g. applicant_name" />
            </Field>
            <Field label="Label" required>
              <input required value={form.label} onChange={e => set("label", e.target.value)}
                className={inp} placeholder="e.g. Applicant Name" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" required>
              <select value={form.type} onChange={e => set("type", e.target.value)} className={inp}>
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            {form.type === "DROPDOWN" && (
              <Field label="Options (comma-separated)">
                <input value={form.options} onChange={e => set("options", e.target.value)}
                  className={inp} placeholder="General, OBC, SC, ST" />
              </Field>
            )}
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <Toggle checked={form.required} onChange={v => set("required", v)} label="Required field" />
          </div>

          {/* Visibility condition */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Visibility Condition</p>
              <p className="text-xs text-slate-400 mt-0.5">Show this field only when another field has a specific value</p>
            </div>
            <Field label="Show only when field">
              <select value={form.conditionFieldKey} onChange={e => set("conditionFieldKey", e.target.value)} className={inp}>
                <option value="">Always visible</option>
                {fields.filter(f => f.fieldKey !== form.fieldKey).map(f => (
                  <option key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                ))}
              </select>
            </Field>
            {form.conditionFieldKey && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Operator">
                  <select value={form.conditionOperator} onChange={e => set("conditionOperator", e.target.value)} className={inp}>
                    {OPERATORS.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                  </select>
                </Field>
                <Field label={form.conditionOperator === "IN" ? "Values (comma-separated)" : "Value"}>
                  <input value={form.conditionValue} onChange={e => set("conditionValue", e.target.value)}
                    className={inp} placeholder={form.conditionOperator === "IN" ? "SC, ST, OBC" : "Yes"} />
                </Field>
              </div>
            )}
          </div>

          {/* Conditional required */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Conditional Required</p>
              <p className="text-xs text-slate-400 mt-0.5">Make this field mandatory only when another field matches</p>
            </div>
            <Field label="Required when field">
              <select value={form.requiredConditionFieldKey} onChange={e => set("requiredConditionFieldKey", e.target.value)} className={inp}>
                <option value="">Not conditionally required</option>
                {fields.filter(f => f.fieldKey !== form.fieldKey).map(f => (
                  <option key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                ))}
              </select>
            </Field>
            {form.requiredConditionFieldKey && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Operator">
                  <select value={form.requiredConditionOperator} onChange={e => set("requiredConditionOperator", e.target.value)} className={inp}>
                    {OPERATORS.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                  </select>
                </Field>
                <Field label={form.requiredConditionOperator === "IN" ? "Values (comma-separated)" : "Value"}>
                  <input value={form.requiredConditionValue} onChange={e => set("requiredConditionValue", e.target.value)}
                    className={inp} placeholder={form.requiredConditionOperator === "IN" ? "SC, ST, OBC" : "Yes"} />
                </Field>
              </div>
            )}
          </div>

          {/* Cross-field validation */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Cross-field Validation</p>
              <p className="text-xs text-slate-400 mt-0.5">Compare this field against another (e.g. End Date &ge; Start Date)</p>
            </div>
            <Field label="Compare against field">
              <select value={form.crossValidateFieldKey} onChange={e => set("crossValidateFieldKey", e.target.value)} className={inp}>
                <option value="">No cross-field check</option>
                {fields.filter(f => f.fieldKey !== form.fieldKey).map(f => (
                  <option key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                ))}
              </select>
            </Field>
            {form.crossValidateFieldKey && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="This field must be">
                  <select value={form.crossValidateOperator} onChange={e => set("crossValidateOperator", e.target.value)} className={inp}>
                    {CROSS_OPERATORS.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                  </select>
                </Field>
                <Field label="Error message">
                  <input value={form.crossValidateMessage} onChange={e => set("crossValidateMessage", e.target.value)}
                    className={inp} placeholder="End date must be after start date" />
                </Field>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              {isEdit ? "Save Changes" : "Add Field"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Document Modal ────────────────────────────────────────────────────────

function DocumentModal({ panel, form, setForm, onClose, onSave }) {
  const isEdit = !!panel?.id;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Document" : "Add Document"}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={onSave} className="px-6 py-5 space-y-4">
          <Field label="Document Name" required>
            <input required value={form.documentName} onChange={e => set("documentName", e.target.value)}
              className={inp} placeholder="e.g. Aadhar Card" />
          </Field>
          <Field label="Allowed File Types">
            <input value={form.allowedFileTypes} onChange={e => set("allowedFileTypes", e.target.value)}
              className={inp} placeholder="pdf,jpg,png" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max Size (MB)">
              <input type="number" min="1" value={form.maxFileSizeMb} onChange={e => set("maxFileSizeMb", Number(e.target.value))}
                className={inp} />
            </Field>
            <Field label="Max Count">
              <input type="number" min="1" value={form.maxCount} onChange={e => set("maxCount", Number(e.target.value))}
                className={inp} />
            </Field>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <Toggle checked={form.mandatory} onChange={v => set("mandatory", v)} label="Mandatory document" />
          </div>
          <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              {isEdit ? "Save Changes" : "Add Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function FormDesignerPage() {
  const [boards, setBoards]           = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices]       = useState([]);
  const [boardId, setBoardId]         = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [serviceId, setServiceId]     = useState("");

  const [fields, setFields]           = useState([]);
  const [documents, setDocuments]     = useState([]);
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewValues, setPreviewValues] = useState({});
  const [previewErrors, setPreviewErrors] = useState({});

  const [fieldPanel, setFieldPanel]   = useState(null);
  const [fieldForm, setFieldForm]     = useState(emptyField(0));
  const [docPanel, setDocPanel]       = useState(null);
  const [docForm, setDocForm]         = useState(emptyDoc(0));
  const [masterFields, setMasterFields] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragIndex = useRef(null);

  useEffect(() => {
    masterFormFieldsApi.list().then(all => setMasterFields(all.filter(f => f.active))).catch(() => {});
  }, []);

  useEffect(() => {
    boardsApi.list().then(setBoards).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!boardId) { setDepartments([]); return; }
    departmentsApi.list(boardId).then(setDepartments).catch(e => setError(e.message));
    setDepartmentId(""); setServiceId("");
  }, [boardId]);

  useEffect(() => {
    if (!departmentId) { setServices([]); return; }
    servicesApi.list(departmentId).then(setServices).catch(e => setError(e.message));
    setServiceId("");
  }, [departmentId]);

  const loadServiceForm = useCallback(async (id) => {
    const [f, d] = await Promise.all([formDesignerApi.fields(id), formDesignerApi.documents(id)]);
    setFields(f);
    setDocuments(d);
  }, []);

  useEffect(() => {
    if (!serviceId) { setFields([]); setDocuments([]); return; }
    loadServiceForm(serviceId).catch(e => setError(e.message));
  }, [serviceId, loadServiceForm]);

  // ── Field actions ─────────────────────────────────────────────────────────

  function openNewField() { setFieldForm(emptyField(fields.length)); setFieldPanel({}); }

  function insertFromLibrary(master) {
    setFieldForm({
      fieldKey: master.fieldKey, label: master.label, type: master.type,
      required: master.defaultRequired, displayOrder: fields.length,
      options: parseOptions(master.validationRules),
      conditionFieldKey: "", conditionOperator: "EQUALS", conditionValue: "",
      requiredConditionFieldKey: "", requiredConditionOperator: "EQUALS", requiredConditionValue: "",
      crossValidateFieldKey: "", crossValidateOperator: "GREATER_THAN_OR_EQUAL", crossValidateMessage: "",
    });
    setShowLibrary(false);
    setFieldPanel({});
  }

  function openEditField(f) {
    setFieldForm({
      fieldKey: f.fieldKey, label: f.label, type: f.type, required: f.required, displayOrder: f.displayOrder,
      options: parseOptions(f.validationRules),
      conditionFieldKey: f.conditionFieldKey || "", conditionOperator: f.conditionOperator || "EQUALS", conditionValue: f.conditionValue || "",
      requiredConditionFieldKey: f.requiredConditionFieldKey || "", requiredConditionOperator: f.requiredConditionOperator || "EQUALS", requiredConditionValue: f.requiredConditionValue || "",
      crossValidateFieldKey: f.crossValidateFieldKey || "", crossValidateOperator: f.crossValidateOperator || "GREATER_THAN_OR_EQUAL", crossValidateMessage: f.crossValidateMessage || "",
    });
    setFieldPanel(f);
  }

  async function saveField(e) {
    e.preventDefault();
    try {
      const payload = {
        fieldKey: fieldForm.fieldKey, label: fieldForm.label, type: fieldForm.type,
        required: fieldForm.required, displayOrder: fieldForm.displayOrder,
        validationRules: fieldForm.type === "DROPDOWN" ? toValidationRules(fieldForm.options) : null,
        conditionFieldKey: fieldForm.conditionFieldKey || null,
        conditionOperator: fieldForm.conditionFieldKey ? fieldForm.conditionOperator : null,
        conditionValue: fieldForm.conditionFieldKey ? fieldForm.conditionValue : null,
        requiredConditionFieldKey: fieldForm.requiredConditionFieldKey || null,
        requiredConditionOperator: fieldForm.requiredConditionFieldKey ? fieldForm.requiredConditionOperator : null,
        requiredConditionValue: fieldForm.requiredConditionFieldKey ? fieldForm.requiredConditionValue : null,
        crossValidateFieldKey: fieldForm.crossValidateFieldKey || null,
        crossValidateOperator: fieldForm.crossValidateFieldKey ? fieldForm.crossValidateOperator : null,
        crossValidateMessage: fieldForm.crossValidateFieldKey ? fieldForm.crossValidateMessage : null,
      };
      if (fieldPanel?.id) {
        await formDesignerApi.updateField(serviceId, fieldPanel.id, payload);
      } else {
        await formDesignerApi.addField(serviceId, payload);
      }
      setFieldPanel(null);
      await loadServiceForm(serviceId);
    } catch (e) { setError(e.message); }
  }

  async function deleteField(f) {
    if (!window.confirm(`Delete field "${f.label}"?`)) return;
    try {
      await formDesignerApi.deleteField(serviceId, f.id);
      await loadServiceForm(serviceId);
    } catch (e) { setError(e.message); }
  }

  // ── Drag-to-reorder ──────────────────────────────────────────────────────

  async function handleDrop(dropIdx) {
    const fromIdx = dragIndex.current;
    if (fromIdx === null || fromIdx === dropIdx) { setDragOverIndex(null); return; }
    const reordered = [...fields];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setFields(reordered);
    setDragOverIndex(null);
    dragIndex.current = null;
    try {
      await formDesignerApi.reorderFields(serviceId, reordered.map(f => f.id));
    } catch (e) {
      setError(e.message);
      await loadServiceForm(serviceId);
    }
  }

  // ── Document actions ──────────────────────────────────────────────────────

  function openNewDoc() { setDocForm(emptyDoc(documents.length)); setDocPanel({}); }

  function openEditDoc(d) {
    setDocForm({ documentName: d.documentName, mandatory: d.mandatory, allowedFileTypes: d.allowedFileTypes || "", maxFileSizeMb: d.maxFileSizeMb || 5, maxCount: d.maxCount || 1, displayOrder: d.displayOrder });
    setDocPanel(d);
  }

  async function saveDoc(e) {
    e.preventDefault();
    try {
      if (docPanel?.id) {
        await formDesignerApi.updateDocument(serviceId, docPanel.id, docForm);
      } else {
        await formDesignerApi.addDocument(serviceId, docForm);
      }
      setDocPanel(null);
      await loadServiceForm(serviceId);
    } catch (e) { setError(e.message); }
  }

  async function deactivateDoc(d) {
    if (!window.confirm(`Remove document "${d.documentName}"?`)) return;
    try {
      await formDesignerApi.deactivateDocument(serviceId, d.id);
      await loadServiceForm(serviceId);
    } catch (e) { setError(e.message); }
  }

  async function moveDoc(index, direction) {
    const newOrder = [...documents];
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= newOrder.length) return;
    [newOrder[index], newOrder[swapWith]] = [newOrder[swapWith], newOrder[index]];
    setDocuments(newOrder);
    try {
      await formDesignerApi.reorderDocuments(serviceId, newOrder.map(d => d.id));
    } catch (e) {
      setError(e.message);
      await loadServiceForm(serviceId);
    }
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  function runPreviewValidation() {
    const errors = {};
    for (const f of fields.filter(f => isFieldVisible(f, previewValues))) {
      const val = (previewValues[f.fieldKey] ?? "").toString().trim();
      if (isFieldRequired(f, previewValues) && !val) { errors[f.fieldKey] = `${f.label} is required`; continue; }
      const crossErr = checkCrossValidation(f, previewValues);
      if (crossErr) errors[f.fieldKey] = crossErr;
    }
    setPreviewErrors(errors);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div className="py-16 text-center text-sm text-slate-400">Loading form designer…</div>;

  const inpSel = `${inp} bg-white`;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Form Designer</h1>
          <p className="text-sm text-slate-500 mt-0.5">Design application form fields and document checklists per service</p>
        </div>
        {serviceId && (
          <button onClick={() => setShowPreview(s => !s)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm">
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {/* Service selector */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Select Service</div>
        <div className="grid grid-cols-3 gap-5">
          <Field label="Board">
            <select value={boardId} onChange={e => setBoardId(e.target.value)} className={inpSel}>
              <option value="">Select board</option>
              {boards.map(b => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
            </select>
          </Field>
          <Field label="Department">
            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} disabled={!boardId}
              className={inpSel + (!boardId ? " opacity-40 cursor-not-allowed" : "")}>
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
            </select>
          </Field>
          <Field label="Service">
            <select value={serviceId} onChange={e => setServiceId(e.target.value)} disabled={!departmentId}
              className={inpSel + (!departmentId ? " opacity-40 cursor-not-allowed" : "")}>
              <option value="">Select service</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.nameEnglish}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {!serviceId && (
        <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 py-20 text-center">
          <FileText size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-400">Select a board, department, and service to start designing the form</p>
        </div>
      )}

      {serviceId && (
        <div className={`grid gap-5 ${showPreview ? "grid-cols-3" : "grid-cols-2"}`}>

          {/* ── Fields panel ────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">Form Fields</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {fields.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Library dropdown */}
                <div className="relative">
                  <button onClick={() => setShowLibrary(s => !s)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <Library size={13} /> Library
                  </button>
                  {showLibrary && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-72 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                      {masterFields.length === 0 ? (
                        <div className="p-4 text-xs text-slate-400">No master fields — add some under Master › Form Fields</div>
                      ) : masterFields.map(m => {
                        const TIcon = TYPE_ICON[m.type] || Type;
                        return (
                          <button key={m.id} onClick={() => insertFromLibrary(m)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${TYPE_COLOR[m.type] || "bg-slate-100 text-slate-500"}`}>
                              <TIcon size={13} />
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">{m.label}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{m.fieldKey}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button onClick={openNewField}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                  <Plus size={13} /> Add Field
                </button>
              </div>
            </div>

            <div className="p-3 space-y-2 min-h-[120px]">
              {fields.length === 0 ? (
                <div className="py-12 text-center">
                  <Type size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-400">No fields yet — add your first field above</p>
                </div>
              ) : fields.map((f, i) => {
                const TIcon = TYPE_ICON[f.type] || Type;
                return (
                  <div
                    key={f.id}
                    draggable
                    onDragStart={() => { dragIndex.current = i; }}
                    onDragOver={e => { e.preventDefault(); setDragOverIndex(i); }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={() => handleDrop(i)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all select-none ${
                      dragOverIndex === i
                        ? "border-blue-400 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <GripVertical size={15} className="text-slate-300 flex-shrink-0 cursor-grab active:cursor-grabbing" />

                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${TYPE_COLOR[f.type] || "bg-slate-100 text-slate-500"}`}>
                      <TIcon size={14} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{f.label}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{f.fieldKey}</div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {f.required && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">req</span>
                      )}
                      {f.conditionFieldKey && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">if</span>
                      )}
                      {f.crossValidateFieldKey && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">x</span>
                      )}
                      <button onClick={() => openEditField(f)}
                        className="ml-1 rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteField(f)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Documents panel ──────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">Document Checklist</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {documents.length}
                </span>
              </div>
              <button onClick={openNewDoc}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                <Plus size={13} /> Add Document
              </button>
            </div>

            <div className="p-3 space-y-2 min-h-[120px]">
              {documents.length === 0 ? (
                <div className="py-12 text-center">
                  <Paperclip size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-400">No documents configured yet</p>
                </div>
              ) : documents.map((d, i) => (
                <div key={d.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 hover:border-slate-300 hover:shadow-sm transition-all">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 mt-0.5 ${d.mandatory ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"}`}>
                    <Paperclip size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{d.documentName}</span>
                      {d.mandatory
                        ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">mandatory</span>
                        : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">optional</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {d.allowedFileTypes} · max {d.maxFileSizeMb}MB · up to {d.maxCount} file{d.maxCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => moveDoc(i, -1)} disabled={i === 0}
                      className="rounded-lg px-1.5 py-1 text-sm text-slate-300 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-20">↑</button>
                    <button onClick={() => moveDoc(i, 1)} disabled={i === documents.length - 1}
                      className="rounded-lg px-1.5 py-1 text-sm text-slate-300 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-20">↓</button>
                    <button onClick={() => openEditDoc(d)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deactivateDoc(d)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Preview panel ────────────────────────────────────────────── */}
          {showPreview && (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <span className="text-sm font-bold text-slate-800">Live Preview</span>
                  <span className="ml-2 text-xs text-slate-400">Citizen-facing view</span>
                </div>
                <button onClick={runPreviewValidation}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  <RefreshCw size={12} /> Validate
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto max-h-[680px]">
                {fields.filter(f => isFieldVisible(f, previewValues)).map(f => (
                  <div key={f.id} className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      {f.label}
                      {isFieldRequired(f, previewValues) && <span className="text-red-500 ml-0.5">*</span>}
                      {f.conditionFieldKey && (
                        <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">conditional</span>
                      )}
                    </label>
                    {f.type === "TEXTAREA" ? (
                      <textarea rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        value={previewValues[f.fieldKey] || ""}
                        onChange={e => setPreviewValues(v => ({ ...v, [f.fieldKey]: e.target.value }))} />
                    ) : f.type === "DROPDOWN" ? (
                      <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        value={previewValues[f.fieldKey] || ""}
                        onChange={e => setPreviewValues(v => ({ ...v, [f.fieldKey]: e.target.value }))}>
                        <option value="">Select…</option>
                        {parseOptions(f.validationRules).split(",").map(o => o.trim()).filter(Boolean).map(o => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : f.type === "CHECKBOX" ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300"
                          checked={previewValues[f.fieldKey] === "true"}
                          onChange={e => setPreviewValues(v => ({ ...v, [f.fieldKey]: String(e.target.checked) }))} />
                        <span className="text-sm text-slate-600">{f.label}</span>
                      </label>
                    ) : f.type === "FILE" ? (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-5 text-slate-400">
                        <Paperclip size={18} className="mb-1" />
                        <span className="text-sm">Choose file</span>
                      </div>
                    ) : (
                      <input
                        type={f.type === "NUMBER" ? "number" : f.type === "DATE" ? "date" : "text"}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        value={previewValues[f.fieldKey] || ""}
                        onChange={e => setPreviewValues(v => ({ ...v, [f.fieldKey]: e.target.value }))} />
                    )}
                    {previewErrors[f.fieldKey] && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={11} /> {previewErrors[f.fieldKey]}
                      </p>
                    )}
                  </div>
                ))}

                {documents.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <div className="text-sm font-semibold text-slate-700 mb-2">Documents Required</div>
                    {documents.map(d => (
                      <div key={d.id} className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                        <Paperclip size={13} className={d.mandatory ? "text-red-400" : "text-slate-300"} />
                        {d.documentName}
                        {d.mandatory && <span className="text-red-500 text-xs">*</span>}
                        <span className="text-[11px] text-slate-400">({d.allowedFileTypes})</span>
                      </div>
                    ))}
                  </div>
                )}

                {fields.length === 0 && documents.length === 0 && (
                  <div className="py-10 text-center text-sm text-slate-400">Nothing to preview yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {fieldPanel !== null && (
        <FieldModal
          panel={fieldPanel}
          form={fieldForm}
          setForm={setFieldForm}
          fields={fields}
          onClose={() => setFieldPanel(null)}
          onSave={saveField}
        />
      )}
      {docPanel !== null && (
        <DocumentModal
          panel={docPanel}
          form={docForm}
          setForm={setDocForm}
          onClose={() => setDocPanel(null)}
          onSave={saveDoc}
        />
      )}
    </div>
  );
}
