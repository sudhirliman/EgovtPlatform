import React, { useEffect, useState, useCallback, useRef } from "react";
import { boardsApi, departmentsApi, servicesApi, formDesignerApi, masterFormFieldsApi } from "../api/client";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, X, AlertCircle, GripVertical,
  Type, Hash, CalendarDays, List, Paperclip, AlignLeft, CheckSquare,
  RefreshCw, FileText, LayoutTemplate, Fingerprint, CreditCard,
  Smartphone, MapPin, Circle, ToggleLeft, Copy, ArrowUp, ArrowDown,
} from "lucide-react";

// ── Field type palette definition ────────────────────────────────────────

const PALETTE = [
  { type: "TEXT",          label: "Text Input",     icon: Type,          color: "bg-blue-100 text-blue-700" },
  { type: "TEXTAREA",      label: "Text Area",      icon: AlignLeft,     color: "bg-sky-100 text-sky-700" },
  { type: "NUMBER",        label: "Number",         icon: Hash,          color: "bg-violet-100 text-violet-700" },
  { type: "DATE",          label: "Date",           icon: CalendarDays,  color: "bg-emerald-100 text-emerald-700" },
  { type: "DROPDOWN",      label: "Dropdown",       icon: List,          color: "bg-amber-100 text-amber-700" },
  { type: "RADIO_BUTTONS", label: "Radio Buttons",  icon: Circle,        color: "bg-orange-100 text-orange-700" },
  { type: "CHECKBOX",      label: "Checkbox",       icon: CheckSquare,   color: "bg-green-100 text-green-700" },
  { type: "TOGGLE",        label: "Toggle Switch",  icon: ToggleLeft,    color: "bg-teal-100 text-teal-700" },
  { type: "FILE",          label: "File Upload",    icon: Paperclip,     color: "bg-rose-100 text-rose-700" },
  { type: "AADHAAR",       label: "Aadhaar No.",    icon: Fingerprint,   color: "bg-red-100 text-red-700" },
  { type: "PAN",           label: "PAN Number",     icon: CreditCard,    color: "bg-indigo-100 text-indigo-700" },
  { type: "MOBILE",        label: "Mobile Number",  icon: Smartphone,    color: "bg-cyan-100 text-cyan-700" },
  { type: "GPS",           label: "GPS Location",   icon: MapPin,        color: "bg-pink-100 text-pink-700" },
  { type: "SECTION_HEADER",label: "Section Header", icon: LayoutTemplate,color: "bg-slate-200 text-slate-700" },
];

const TYPE_META = Object.fromEntries(PALETTE.map(p => [p.type, p]));

const OPERATORS       = ["EQUALS", "NOT_EQUALS", "IN"];
const CROSS_OPERATORS = ["EQUALS", "NOT_EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUAL", "LESS_THAN", "LESS_THAN_OR_EQUAL"];
const HAS_OPTIONS     = ["DROPDOWN", "RADIO_BUTTONS"];

const emptyField = (order, type = "TEXT") => ({
  fieldKey: "", label: "", labelMarathi: "", type, required: true, fullWidth: false,
  displayOrder: order, options: "",
  conditionFieldKey: "", conditionOperator: "EQUALS", conditionValue: "",
  requiredConditionFieldKey: "", requiredConditionOperator: "EQUALS", requiredConditionValue: "",
  crossValidateFieldKey: "", crossValidateOperator: "GREATER_THAN_OR_EQUAL", crossValidateMessage: "",
});
const emptyDoc = (order) => ({
  documentName: "", mandatory: true, allowedFileTypes: "pdf,jpg,png", maxFileSizeMb: 5, maxCount: 1, displayOrder: order,
});

// ── Utilities ─────────────────────────────────────────────────────────────

function parseOptions(vr) {
  try { return (JSON.parse(vr || "{}").options || []).join(", "); } catch { return ""; }
}
function toValidationRules(csv) {
  const opts = csv.split(",").map(s => s.trim()).filter(Boolean);
  return opts.length ? JSON.stringify({ options: opts }) : null;
}
function autoKey(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// ── Shared UI helpers ─────────────────────────────────────────────────────

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
  const isSectionHeader = form.type === "SECTION_HEADER";
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleLabelChange(e) {
    const val = e.target.value;
    set("label", val);
    if (!isEdit && !form.fieldKey) set("fieldKey", autoKey(val));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-8 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl my-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {TYPE_META[form.type] && (
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${TYPE_META[form.type].color}`}>
                {React.createElement(TYPE_META[form.type].icon, { size: 16 })}
              </span>
            )}
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Edit Field" : `Add ${TYPE_META[form.type]?.label || "Field"}`}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <form onSubmit={onSave} className="px-6 py-5 space-y-5">
          {/* Field Key + Type */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Label (English)" required>
              <input required value={form.label} onChange={handleLabelChange}
                className={inp} placeholder={isSectionHeader ? "e.g. Applicant Details" : "e.g. Applicant Name"} />
            </Field>
            <Field label="Field Key" required>
              <input required value={form.fieldKey} onChange={e => set("fieldKey", e.target.value)}
                className={`${inp} font-mono`} placeholder="e.g. applicant_name" />
            </Field>
          </div>

          {/* Marathi label */}
          <Field label="Label (Marathi / Hindi — optional)">
            <input value={form.labelMarathi} onChange={e => set("labelMarathi", e.target.value)}
              className={inp} placeholder="मराठी / हिंदी मध्ये लेबल" />
          </Field>

          {!isSectionHeader && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type" required>
                  <select value={form.type} onChange={e => set("type", e.target.value)} className={inp}>
                    {PALETTE.filter(p => p.type !== "SECTION_HEADER").map(p => (
                      <option key={p.type} value={p.type}>{p.label}</option>
                    ))}
                  </select>
                </Field>
                {HAS_OPTIONS.includes(form.type) && (
                  <Field label="Options (comma-separated)">
                    <input value={form.options} onChange={e => set("options", e.target.value)}
                      className={inp} placeholder="Yes, No, Maybe" />
                  </Field>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <Toggle checked={form.required} onChange={v => set("required", v)} label="Required field" />
                <Toggle checked={form.fullWidth} onChange={v => set("fullWidth", v)} label="Full width (span both columns)" />
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
                    {fields.filter(f => f.fieldKey !== form.fieldKey && f.type !== "SECTION_HEADER").map(f => (
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
                    <Field label={form.conditionOperator === "IN" ? "Values (comma-sep)" : "Value"}>
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
                    {fields.filter(f => f.fieldKey !== form.fieldKey && f.type !== "SECTION_HEADER").map(f => (
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
                    <Field label={form.requiredConditionOperator === "IN" ? "Values (comma-sep)" : "Value"}>
                      <input value={form.requiredConditionValue} onChange={e => set("requiredConditionValue", e.target.value)}
                        className={inp} placeholder="Yes" />
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
                <Field label="Compare against">
                  <select value={form.crossValidateFieldKey} onChange={e => set("crossValidateFieldKey", e.target.value)} className={inp}>
                    <option value="">No cross-field check</option>
                    {fields.filter(f => f.fieldKey !== form.fieldKey && f.type !== "SECTION_HEADER").map(f => (
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
            </>
          )}

          <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              {isEdit ? "Save Changes" : "Add to Form"}
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
              className={inp} placeholder="e.g. Aadhaar Card" />
          </Field>
          <Field label="Allowed File Types">
            <input value={form.allowedFileTypes} onChange={e => set("allowedFileTypes", e.target.value)}
              className={inp} placeholder="pdf,jpg,png" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max Size (MB)">
              <input type="number" min="1" value={form.maxFileSizeMb} onChange={e => set("maxFileSizeMb", Number(e.target.value))} className={inp} />
            </Field>
            <Field label="Max Count">
              <input type="number" min="1" value={form.maxCount} onChange={e => set("maxCount", Number(e.target.value))} className={inp} />
            </Field>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <Toggle checked={form.mandatory} onChange={v => set("mandatory", v)} label="Mandatory document" />
          </div>
          <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
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

// ── Preview Panel ─────────────────────────────────────────────────────────

function parseVisible(f, vals) {
  if (!f.conditionFieldKey) return true;
  const a = (vals[f.conditionFieldKey] ?? "").toString().trim();
  const e = (f.conditionValue || "").toString().trim();
  if (f.conditionOperator === "NOT_EQUALS") return a !== e;
  if (f.conditionOperator === "IN") return e.split(",").map(v => v.trim()).includes(a);
  return a === e;
}

function PreviewPanel({ fields, documents, onClose }) {
  const [vals, setVals] = useState({});
  const [errs, setErrs] = useState({});
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }));

  function validate() {
    const errors = {};
    for (const f of fields.filter(f => f.type !== "SECTION_HEADER" && parseVisible(f, vals))) {
      if (f.required && !(vals[f.fieldKey] || "").toString().trim())
        errors[f.fieldKey] = `${f.label} is required`;
    }
    setErrs(errors);
  }

  const visible = fields.filter(f => f.type === "SECTION_HEADER" || parseVisible(f, vals));

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-800">Live Preview</h2>
          <div className="flex items-center gap-2">
            <button onClick={validate}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <RefreshCw size={12} /> Validate
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {visible.map(f => {
            if (f.type === "SECTION_HEADER") {
              return (
                <div key={f.id} className="border-b-2 border-slate-200 pb-1 pt-2">
                  <span className="text-sm font-bold text-slate-700">{f.label}</span>
                  {f.labelMarathi && <span className="ml-2 text-xs text-slate-400">{f.labelMarathi}</span>}
                </div>
              );
            }
            const meta = TYPE_META[f.type];
            return (
              <div key={f.id} className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                  {f.labelMarathi && <span className="ml-2 text-xs text-slate-400 font-normal">{f.labelMarathi}</span>}
                </label>
                {f.type === "TEXTAREA" ? (
                  <textarea rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={vals[f.fieldKey] || ""} onChange={e => set(f.fieldKey, e.target.value)} />
                ) : ["DROPDOWN"].includes(f.type) ? (
                  <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={vals[f.fieldKey] || ""} onChange={e => set(f.fieldKey, e.target.value)}>
                    <option value="">Select…</option>
                    {parseOptions(f.validationRules).split(",").map(o => o.trim()).filter(Boolean).map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === "RADIO_BUTTONS" ? (
                  <div className="flex flex-wrap gap-3">
                    {parseOptions(f.validationRules).split(",").map(o => o.trim()).filter(Boolean).map(o => (
                      <label key={o} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={f.fieldKey} value={o}
                          checked={vals[f.fieldKey] === o} onChange={() => set(f.fieldKey, o)} />
                        <span className="text-sm">{o}</span>
                      </label>
                    ))}
                  </div>
                ) : f.type === "CHECKBOX" || f.type === "TOGGLE" ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded"
                      checked={vals[f.fieldKey] === "true"} onChange={e => set(f.fieldKey, String(e.target.checked))} />
                    <span className="text-sm text-slate-600">{f.label}</span>
                  </label>
                ) : f.type === "FILE" ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-4 text-slate-400">
                    <Paperclip size={16} className="mb-1" /><span className="text-sm">Choose file</span>
                  </div>
                ) : f.type === "GPS" ? (
                  <div className="flex gap-2">
                    <input className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Latitude" />
                    <input className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Longitude" />
                  </div>
                ) : (
                  <input
                    type={f.type === "NUMBER" ? "number" : f.type === "DATE" ? "date" : "text"}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder={f.type === "AADHAAR" ? "XXXX XXXX XXXX" : f.type === "PAN" ? "ABCDE1234F" : f.type === "MOBILE" ? "10-digit mobile" : ""}
                    value={vals[f.fieldKey] || ""} onChange={e => set(f.fieldKey, e.target.value)} />
                )}
                {errs[f.fieldKey] && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errs[f.fieldKey]}</p>
                )}
              </div>
            );
          })}
          {documents.length > 0 && (
            <div className="border-t border-slate-100 pt-4 space-y-1.5">
              <p className="text-sm font-semibold text-slate-700 mb-2">Documents Required</p>
              {documents.map(d => (
                <div key={d.id} className="flex items-center gap-2 text-sm text-slate-600">
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
  const [libraryFields, setLibraryFields] = useState([]);
  const [sidebarTab, setSidebarTab]   = useState("types");
  const [librarySearch, setLibrarySearch] = useState("");
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [canvasDragOver, setCanvasDragOver] = useState(false);

  const [fieldPanel, setFieldPanel]   = useState(null);
  const [fieldForm, setFieldForm]     = useState(emptyField(0));
  const [docPanel, setDocPanel]       = useState(null);
  const [docForm, setDocForm]         = useState(emptyDoc(0));
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragIndex = useRef(null);

  useEffect(() => {
    Promise.all([boardsApi.list(), masterFormFieldsApi.list()])
      .then(([b, lib]) => { setBoards(b); setLibraryFields(lib.filter(f => f.active)); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
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

  const reload = useCallback(async (id) => {
    const [f, d] = await Promise.all([formDesignerApi.fields(id), formDesignerApi.documents(id)]);
    setFields(f); setDocuments(d);
  }, []);

  useEffect(() => {
    if (!serviceId) { setFields([]); setDocuments([]); return; }
    reload(serviceId).catch(e => setError(e.message));
  }, [serviceId, reload]);

  // ── Field save ────────────────────────────────────────────────────────────

  async function saveField(e) {
    e.preventDefault();
    try {
      const payload = {
        fieldKey: fieldForm.fieldKey,
        label: fieldForm.label,
        labelMarathi: fieldForm.labelMarathi || null,
        type: fieldForm.type,
        required: fieldForm.type === "SECTION_HEADER" ? false : fieldForm.required,
        fullWidth: fieldForm.type === "SECTION_HEADER" ? true : fieldForm.fullWidth,
        displayOrder: fieldForm.displayOrder,
        validationRules: HAS_OPTIONS.includes(fieldForm.type) ? toValidationRules(fieldForm.options) : null,
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
      await reload(serviceId);
    } catch (e) { setError(e.message); }
  }

  async function deleteField(f) {
    if (!window.confirm(`Delete "${f.label}"?`)) return;
    try { await formDesignerApi.deleteField(serviceId, f.id); await reload(serviceId); }
    catch (e) { setError(e.message); }
  }

  async function copyField(f) {
    try {
      await formDesignerApi.addField(serviceId, {
        fieldKey: f.fieldKey + "_copy", label: f.label + " (Copy)", labelMarathi: f.labelMarathi,
        type: f.type, required: f.required, fullWidth: f.fullWidth,
        displayOrder: fields.length, validationRules: f.validationRules,
        conditionFieldKey: f.conditionFieldKey, conditionOperator: f.conditionOperator, conditionValue: f.conditionValue,
        requiredConditionFieldKey: f.requiredConditionFieldKey, requiredConditionOperator: f.requiredConditionOperator, requiredConditionValue: f.requiredConditionValue,
        crossValidateFieldKey: f.crossValidateFieldKey, crossValidateOperator: f.crossValidateOperator, crossValidateMessage: f.crossValidateMessage,
      });
      await reload(serviceId);
    } catch (e) { setError(e.message); }
  }

  function openEdit(f) {
    setFieldForm({
      fieldKey: f.fieldKey, label: f.label, labelMarathi: f.labelMarathi || "",
      type: f.type, required: f.required, fullWidth: f.fullWidth,
      displayOrder: f.displayOrder, options: parseOptions(f.validationRules),
      conditionFieldKey: f.conditionFieldKey || "", conditionOperator: f.conditionOperator || "EQUALS", conditionValue: f.conditionValue || "",
      requiredConditionFieldKey: f.requiredConditionFieldKey || "", requiredConditionOperator: f.requiredConditionOperator || "EQUALS", requiredConditionValue: f.requiredConditionValue || "",
      crossValidateFieldKey: f.crossValidateFieldKey || "", crossValidateOperator: f.crossValidateOperator || "GREATER_THAN_OR_EQUAL", crossValidateMessage: f.crossValidateMessage || "",
    });
    setFieldPanel(f);
  }

  // ── Library insert ────────────────────────────────────────────────────────

  function insertFromLibrary(mf) {
    if (!serviceId) { setError("Please select a board, department, and service first."); return; }
    setFieldForm({
      fieldKey: mf.fieldKey,
      label: mf.label,
      labelMarathi: mf.labelMarathi || "",
      type: mf.type,
      required: mf.defaultRequired,
      fullWidth: mf.fullWidth || false,
      displayOrder: fields.length,
      options: parseOptions(mf.validationRules),
      conditionFieldKey: "", conditionOperator: "EQUALS", conditionValue: "",
      requiredConditionFieldKey: "", requiredConditionOperator: "EQUALS", requiredConditionValue: "",
      crossValidateFieldKey: "", crossValidateOperator: "GREATER_THAN_OR_EQUAL", crossValidateMessage: "",
    });
    setFieldPanel({});
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────

  async function handleCanvasDrop(e, dropIdx) {
    e.preventDefault();
    const libraryId = e.dataTransfer.getData("libraryFieldId");
    if (libraryId) {
      const mf = libraryFields.find(f => f.id === libraryId);
      if (mf) { setCanvasDragOver(false); setDragOverIndex(null); insertFromLibrary(mf); }
      return;
    }
    const paletteType = e.dataTransfer.getData("paletteType");
    if (paletteType) {
      setCanvasDragOver(false);
      setDragOverIndex(null);
      setFieldForm(emptyField(dropIdx !== undefined ? dropIdx : fields.length, paletteType));
      setFieldPanel({});
      return;
    }
    const fromIdx = dragIndex.current;
    if (fromIdx === null || fromIdx === dropIdx) { setDragOverIndex(null); dragIndex.current = null; return; }
    const reordered = [...fields];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setFields(reordered);
    setDragOverIndex(null);
    dragIndex.current = null;
    try { await formDesignerApi.reorderFields(serviceId, reordered.map(f => f.id)); }
    catch (e) { setError(e.message); await reload(serviceId); }
  }

  async function moveField(i, dir) {
    const newOrder = [...fields];
    const s = i + dir;
    if (s < 0 || s >= newOrder.length) return;
    [newOrder[i], newOrder[s]] = [newOrder[s], newOrder[i]];
    setFields(newOrder);
    try { await formDesignerApi.reorderFields(serviceId, newOrder.map(f => f.id)); }
    catch (e) { setError(e.message); await reload(serviceId); }
  }

  // ── Document handlers ─────────────────────────────────────────────────────

  async function saveDoc(e) {
    e.preventDefault();
    try {
      if (docPanel?.id) { await formDesignerApi.updateDocument(serviceId, docPanel.id, docForm); }
      else { await formDesignerApi.addDocument(serviceId, docForm); }
      setDocPanel(null); await reload(serviceId);
    } catch (e) { setError(e.message); }
  }

  async function deactivateDoc(d) {
    if (!window.confirm(`Remove "${d.documentName}"?`)) return;
    try { await formDesignerApi.deactivateDocument(serviceId, d.id); await reload(serviceId); }
    catch (e) { setError(e.message); }
  }

  async function moveDoc(i, dir) {
    const newOrder = [...documents];
    const s = i + dir;
    if (s < 0 || s >= newOrder.length) return;
    [newOrder[i], newOrder[s]] = [newOrder[s], newOrder[i]];
    setDocuments(newOrder);
    try { await formDesignerApi.reorderDocuments(serviceId, newOrder.map(d => d.id)); }
    catch (e) { setError(e.message); await reload(serviceId); }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div className="py-16 text-center text-sm text-slate-400">Loading…</div>;

  const inpSel = `${inp} text-sm`;

  return (
    <div className="-mx-6 -mt-6 flex" style={{ minHeight: "calc(100vh - 64px)" }}>

      {/* ── Left palette sidebar ────────────────────────────────────────── */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 flex-shrink-0">
          <button
            onClick={() => setSidebarTab("types")}
            className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${sidebarTab === "types" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/40" : "text-slate-400 hover:text-slate-600"}`}
          >
            FIELD TYPES
          </button>
          <button
            onClick={() => setSidebarTab("library")}
            className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${sidebarTab === "library" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/40" : "text-slate-400 hover:text-slate-600"}`}
          >
            LIBRARY
            {libraryFields.length > 0 && (
              <span className="ml-1 rounded-full bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-500">{libraryFields.length}</span>
            )}
          </button>
        </div>

        {sidebarTab === "types" ? (
          /* ── Field Types palette ── */
          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="px-3 py-3 space-y-1 flex-1">
              {PALETTE.map(({ type, label, icon: Icon, color }) => (
                <div
                  key={type}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData("paletteType", type);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-grab active:cursor-grabbing hover:bg-slate-50 select-none group transition-colors"
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${color}`}>
                    <Icon size={13} />
                  </span>
                  <span className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900">{label}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-4 py-3 flex-shrink-0">
              <p className="text-[10px] text-slate-400">Drag onto canvas or click Library tab for saved fields</p>
            </div>
          </div>
        ) : (
          /* ── Library tab ── */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search */}
            <div className="px-3 py-2.5 border-b border-slate-100 flex-shrink-0">
              <input
                value={librarySearch}
                onChange={e => setLibrarySearch(e.target.value)}
                placeholder="Search fields…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {libraryFields.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[11px] text-slate-400">No library fields yet.</p>
                  <p className="text-[10px] text-slate-300 mt-1">Add fields in Master Setup → Form Fields</p>
                </div>
              ) : (() => {
                const q = librarySearch.toLowerCase();
                const filtered = libraryFields.filter(f =>
                  f.label.toLowerCase().includes(q) ||
                  f.fieldKey.toLowerCase().includes(q) ||
                  (f.labelMarathi || "").toLowerCase().includes(q)
                );
                if (filtered.length === 0) return (
                  <p className="py-6 text-center text-[11px] text-slate-400">No results</p>
                );
                return filtered.map(mf => {
                  const meta = TYPE_META[mf.type] || TYPE_META["TEXT"];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={mf.id}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData("libraryFieldId", mf.id);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => insertFromLibrary(mf)}
                      title={`Click to add "${mf.label}" to form`}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 cursor-pointer hover:border-blue-200 hover:bg-blue-50/50 select-none group transition-colors"
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${meta.color}`}>
                        <Icon size={13} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-slate-700 group-hover:text-blue-700 truncate">{mf.label}</div>
                        {mf.labelMarathi && <div className="text-[10px] text-slate-400 truncate">{mf.labelMarathi}</div>}
                        <div className="text-[10px] text-slate-400 font-mono truncate">{mf.fieldKey}</div>
                      </div>
                      {mf.systemDefined && (
                        <span className="rounded bg-violet-50 px-1 py-0.5 text-[9px] font-bold text-violet-500 flex-shrink-0">SYS</span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            <div className="border-t border-slate-100 px-3 py-2.5 flex-shrink-0">
              <p className="text-[10px] text-slate-400">Click or drag a field to add it to the canvas</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main canvas area ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col bg-slate-50">

        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-slate-500 z-10">Board</label>
              <select value={boardId} onChange={e => setBoardId(e.target.value)} className={inpSel}>
                <option value="">Select board</option>
                {boards.map(b => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
              </select>
            </div>
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-slate-500 z-10">Department</label>
              <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} disabled={!boardId}
                className={inpSel + (!boardId ? " opacity-40 cursor-not-allowed" : "")}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
              </select>
            </div>
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-slate-500 z-10">Service</label>
              <select value={serviceId} onChange={e => setServiceId(e.target.value)} disabled={!departmentId}
                className={inpSel + (!departmentId ? " opacity-40 cursor-not-allowed" : "")}>
                <option value="">Select service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.nameEnglish}</option>)}
              </select>
            </div>
          </div>
          {serviceId && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400">{fields.length} field{fields.length !== 1 ? "s" : ""}</span>
              <button onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <Eye size={14} /> Preview
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" /> {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
          </div>
        )}

        {/* Canvas instruction bar */}
        {serviceId && (
          <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200 flex items-center gap-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            <span>Form Canvas</span>
            <span className="text-slate-300">·</span>
            <span>Drag from left panel to add · Drag grip to reorder · Click pencil to edit</span>
          </div>
        )}

        {/* Canvas body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!serviceId ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FileText size={48} className="text-slate-200 mb-4" />
              <p className="text-base font-medium text-slate-400">Select a board, department, and service</p>
              <p className="text-sm text-slate-300 mt-1">to start designing your form</p>
            </div>
          ) : (
            <div className="flex gap-6">

              {/* Field canvas (left 2/3) */}
              <div className="flex-1 min-w-0">
                <div
                  onDragOver={e => { e.preventDefault(); setCanvasDragOver(true); }}
                  onDragLeave={() => setCanvasDragOver(false)}
                  onDrop={e => { setCanvasDragOver(false); handleCanvasDrop(e, fields.length); }}
                  className={`min-h-[300px] rounded-2xl transition-colors ${canvasDragOver && fields.length === 0 ? "bg-blue-50 border-2 border-dashed border-blue-400" : ""}`}
                >
                  {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center">
                      <LayoutTemplate size={36} className="text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-400">Drag a field type from the left panel</p>
                      <p className="text-xs text-slate-300 mt-1">or start with a Section Header to group your fields</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {fields.map((f, i) => {
                        const isSection  = f.type === "SECTION_HEADER";
                        const isFullSpan = isSection || f.fullWidth;
                        const meta       = TYPE_META[f.type] || TYPE_META["TEXT"];
                        const Icon       = meta.icon;

                        return (
                          <div
                            key={f.id}
                            draggable
                            onDragStart={e => { dragIndex.current = i; e.dataTransfer.effectAllowed = "move"; }}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setCanvasDragOver(false); setDragOverIndex(i); }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={e => { e.stopPropagation(); handleCanvasDrop(e, i); }}
                            className={`
                              ${isFullSpan ? "col-span-2" : ""}
                              rounded-xl border bg-white px-4 py-3 select-none transition-all
                              ${dragOverIndex === i ? "border-blue-400 bg-blue-50 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"}
                              ${isSection ? "bg-slate-50 border-slate-300" : ""}
                            `}
                          >
                            {isSection ? (
                              /* Section header row */
                              <div className="flex items-center gap-3">
                                <GripVertical size={15} className="text-slate-300 cursor-grab flex-shrink-0" />
                                <LayoutTemplate size={16} className="text-slate-500 flex-shrink-0" />
                                <span className="text-sm font-bold text-slate-700 flex-1">{f.label}</span>
                                {f.labelMarathi && <span className="text-[11px] text-slate-400">{f.labelMarathi}</span>}
                                <div className="flex items-center gap-1 ml-2">
                                  <button onClick={() => openEdit(f)} className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil size={12} /></button>
                                  <button onClick={() => deleteField(f)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ) : (
                              /* Regular field row */
                              <div className="flex items-center gap-2.5">
                                <GripVertical size={15} className="text-slate-300 cursor-grab flex-shrink-0" />
                                <span className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${meta.color}`}>
                                  <Icon size={14} />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-slate-800 truncate">{f.label}</div>
                                  {f.labelMarathi && <div className="text-[10px] text-slate-400 truncate">{f.labelMarathi}</div>}
                                </div>
                                {/* Badges */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {f.required && <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600">Req</span>}
                                  {f.conditionFieldKey && <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">If</span>}
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <button onClick={() => moveField(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20"><ArrowUp size={11} /></button>
                                  <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} className="rounded p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20"><ArrowDown size={11} /></button>
                                  <button onClick={() => copyField(f)} className="rounded p-1 text-slate-300 hover:text-blue-500"><Copy size={11} /></button>
                                  <button onClick={() => openEdit(f)} className="rounded p-1 text-slate-400 hover:text-blue-600"><Pencil size={11} /></button>
                                  <button onClick={() => deleteField(f)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 size={11} /></button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Drop zone at end */}
                      <div
                        className="col-span-2"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => handleCanvasDrop(e, fields.length)}
                      >
                        <div className="rounded-xl border-2 border-dashed border-slate-200 py-4 text-center text-xs text-slate-300 hover:border-blue-300 hover:text-blue-400 transition-colors">
                          Drop here to add at end
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Document checklist (right 1/3) */}
              <div className="w-64 flex-shrink-0">
                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-700">Documents</span>
                      <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{documents.length}</span>
                    </div>
                    <button onClick={() => { setDocForm(emptyDoc(documents.length)); setDocPanel({}); }}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {documents.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">No documents yet</div>
                    ) : documents.map((d, i) => (
                      <div key={d.id} className="flex items-start gap-2 rounded-lg border border-slate-100 px-2.5 py-2 hover:border-slate-200">
                        <Paperclip size={12} className={`mt-0.5 flex-shrink-0 ${d.mandatory ? "text-red-400" : "text-slate-300"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-slate-700 truncate">{d.documentName}</div>
                          <div className="text-[10px] text-slate-400">{d.allowedFileTypes} · {d.maxFileSizeMb}MB</div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button onClick={() => moveDoc(i, -1)} disabled={i === 0} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20"><ArrowUp size={10} /></button>
                          <button onClick={() => moveDoc(i, 1)} disabled={i === documents.length - 1} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20"><ArrowDown size={10} /></button>
                          <button onClick={() => { setDocForm({ documentName: d.documentName, mandatory: d.mandatory, allowedFileTypes: d.allowedFileTypes || "", maxFileSizeMb: d.maxFileSizeMb || 5, maxCount: d.maxCount || 1, displayOrder: d.displayOrder }); setDocPanel(d); }}
                            className="p-0.5 text-slate-400 hover:text-blue-600"><Pencil size={10} /></button>
                          <button onClick={() => deactivateDoc(d)} className="p-0.5 text-slate-400 hover:text-red-600"><Trash2 size={10} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {fieldPanel !== null && (
        <FieldModal panel={fieldPanel} form={fieldForm} setForm={setFieldForm}
          fields={fields} onClose={() => setFieldPanel(null)} onSave={saveField} />
      )}
      {docPanel !== null && (
        <DocumentModal panel={docPanel} form={docForm} setForm={setDocForm}
          onClose={() => setDocPanel(null)} onSave={saveDoc} />
      )}
      {showPreview && (
        <PreviewPanel fields={fields} documents={documents} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
