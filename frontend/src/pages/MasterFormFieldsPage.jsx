import React, { useEffect, useState } from "react";
import { masterFormFieldsApi } from "../api/client";
import { Plus, Pencil, Trash2, X, AlertCircle, BookOpen } from "lucide-react";
import {
  Type, Hash, CalendarDays, List, Paperclip, AlignLeft, CheckSquare,
  ToggleLeft, Circle, LayoutTemplate, Fingerprint, CreditCard, Smartphone, MapPin,
} from "lucide-react";

const FIELD_TYPES = [
  { value: "TEXT",           label: "Text Input" },
  { value: "TEXTAREA",       label: "Text Area" },
  { value: "NUMBER",         label: "Number" },
  { value: "DATE",           label: "Date" },
  { value: "DROPDOWN",       label: "Dropdown" },
  { value: "RADIO_BUTTONS",  label: "Radio Buttons" },
  { value: "CHECKBOX",       label: "Checkbox" },
  { value: "TOGGLE",         label: "Toggle Switch" },
  { value: "FILE",           label: "File Upload" },
  { value: "AADHAAR",        label: "Aadhaar No." },
  { value: "PAN",            label: "PAN Number" },
  { value: "MOBILE",         label: "Mobile Number" },
  { value: "GPS",            label: "GPS Location" },
  { value: "SECTION_HEADER", label: "Section Header" },
];

const TYPE_ICON = {
  TEXT: Type, TEXTAREA: AlignLeft, NUMBER: Hash, DATE: CalendarDays,
  DROPDOWN: List, RADIO_BUTTONS: Circle, CHECKBOX: CheckSquare, TOGGLE: ToggleLeft,
  FILE: Paperclip, AADHAAR: Fingerprint, PAN: CreditCard, MOBILE: Smartphone,
  GPS: MapPin, SECTION_HEADER: LayoutTemplate,
};
const TYPE_COLOR = {
  TEXT: "bg-blue-100 text-blue-700", TEXTAREA: "bg-sky-100 text-sky-700",
  NUMBER: "bg-violet-100 text-violet-700", DATE: "bg-emerald-100 text-emerald-700",
  DROPDOWN: "bg-amber-100 text-amber-700", RADIO_BUTTONS: "bg-orange-100 text-orange-700",
  CHECKBOX: "bg-green-100 text-green-700", TOGGLE: "bg-teal-100 text-teal-700",
  FILE: "bg-rose-100 text-rose-700", AADHAAR: "bg-red-100 text-red-700",
  PAN: "bg-indigo-100 text-indigo-700", MOBILE: "bg-cyan-100 text-cyan-700",
  GPS: "bg-pink-100 text-pink-700", SECTION_HEADER: "bg-slate-200 text-slate-700",
};

const HAS_OPTIONS = ["DROPDOWN", "RADIO_BUTTONS"];

function parseOptions(vr) {
  try { return (JSON.parse(vr || "{}").options || []).join(", "); } catch { return ""; }
}
function toValidationRules(csv) {
  const opts = csv.split(",").map(s => s.trim()).filter(Boolean);
  return opts.length ? JSON.stringify({ options: opts }) : null;
}

const emptyForm = () => ({
  fieldKey: "", label: "", labelMarathi: "", type: "TEXT",
  options: "", defaultRequired: false, fullWidth: false, active: true,
});

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

function ToggleSwitch({ checked, onChange, label }) {
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

export default function MasterFormFieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function load() {
    try {
      setLoading(true);
      setFields(await masterFormFieldsApi.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() { setForm(emptyForm()); setPanel({}); }
  function openEdit(f) {
    setForm({
      fieldKey: f.fieldKey, label: f.label, labelMarathi: f.labelMarathi || "",
      type: f.type, options: parseOptions(f.validationRules),
      defaultRequired: f.defaultRequired, fullWidth: f.fullWidth || false, active: f.active,
    });
    setPanel(f);
  }

  async function save(e) {
    e.preventDefault();
    try {
      const payload = {
        fieldKey: form.fieldKey, label: form.label, labelMarathi: form.labelMarathi || null,
        type: form.type, fullWidth: form.fullWidth,
        validationRules: HAS_OPTIONS.includes(form.type) ? toValidationRules(form.options) : null,
        defaultRequired: form.defaultRequired, active: form.active,
      };
      panel?.id ? await masterFormFieldsApi.update(panel.id, payload)
                 : await masterFormFieldsApi.create(payload);
      setPanel(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(f) {
    const action = f.systemDefined ? "deactivate" : "delete";
    if (!window.confirm(`${f.systemDefined ? "Deactivate" : "Delete"} "${f.label}"?`)) return;
    try {
      f.systemDefined ? await masterFormFieldsApi.deactivate(f.id)
                      : await masterFormFieldsApi.delete(f.id);
      await load();
    } catch (e) { setError(e.message); }
  }

  const q = search.toLowerCase();
  const visible = fields.filter(f =>
    f.label.toLowerCase().includes(q) ||
    f.fieldKey.toLowerCase().includes(q) ||
    (f.labelMarathi || "").toLowerCase().includes(q)
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Form Fields Library</h1>
            <p className="text-sm text-slate-500 mt-0.5">Reusable field definitions — select from these in the Form Designer</p>
          </div>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 flex-shrink-0">
          <Plus size={15} /> Add Field
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by label, key, or Marathi name…"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {search ? "No fields match your search" : "No master fields yet — click Add Field to create one"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Field</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Key</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Default</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Width</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map(f => {
                const Icon = TYPE_ICON[f.type] || Type;
                const color = TYPE_COLOR[f.type] || "bg-slate-100 text-slate-600";
                return (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${color}`}>
                          <Icon size={14} />
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800">{f.label}</div>
                          {f.labelMarathi && <div className="text-xs text-slate-400">{f.labelMarathi}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">{f.fieldKey}</code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
                        {FIELD_TYPES.find(t => t.value === f.type)?.label || f.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {f.defaultRequired
                        ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">Required</span>
                        : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Optional</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {f.fullWidth
                        ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">Full</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {f.systemDefined
                        ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">System</span>
                        : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Custom</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${f.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                        {f.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(f)} className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => remove(f)}
                          title={f.systemDefined ? "Deactivate (system fields can't be deleted)" : "Delete"}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!loading && fields.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          {fields.filter(f => f.active).length} active · {fields.filter(f => f.systemDefined).length} system · {fields.filter(f => !f.active).length} inactive
        </p>
      )}

      {/* Field Modal */}
      {panel !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{panel?.id ? "Edit Library Field" : "Add Library Field"}</h2>
              <button onClick={() => setPanel(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Label (English)" required>
                  <input required value={form.label}
                    onChange={e => { set("label", e.target.value); if (!panel?.id && !form.fieldKey) set("fieldKey", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")); }}
                    className={inp} placeholder="e.g. Applicant Name" />
                </Field>
                <Field label="Field Key" required>
                  <input required value={form.fieldKey} onChange={e => set("fieldKey", e.target.value)}
                    disabled={panel?.systemDefined}
                    className={`${inp} font-mono${panel?.systemDefined ? " opacity-50 cursor-not-allowed" : ""}`}
                    placeholder="applicant_name" />
                </Field>
              </div>

              <Field label="Label (Marathi / Hindi — optional)">
                <input value={form.labelMarathi} onChange={e => set("labelMarathi", e.target.value)}
                  className={inp} placeholder="मराठी / हिंदी मध्ये लेबल" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Type" required>
                  <select value={form.type} onChange={e => set("type", e.target.value)} className={inp}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                {HAS_OPTIONS.includes(form.type) && (
                  <Field label="Options (comma-separated)">
                    <input value={form.options} onChange={e => set("options", e.target.value)}
                      className={inp} placeholder="Option A, Option B" />
                  </Field>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 space-y-3">
                <ToggleSwitch checked={form.defaultRequired} onChange={v => set("defaultRequired", v)} label="Required by default" />
                <ToggleSwitch checked={form.fullWidth} onChange={v => set("fullWidth", v)} label="Full width (span both columns)" />
                <ToggleSwitch checked={form.active} onChange={v => set("active", v)} label="Active" />
              </div>

              <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
                <button type="button" onClick={() => setPanel(null)}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  {panel?.id ? "Save Changes" : "Add to Library"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
