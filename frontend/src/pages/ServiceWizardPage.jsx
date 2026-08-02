import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardsApi, departmentsApi, servicesApi, formDesignerApi, workflowApi, rolesApi } from "../api/client";
import {
  Check, ChevronRight, X, AlertCircle, Plus, Trash2, Paperclip,
  Type, Hash, CalendarDays, List, AlignLeft, CheckSquare, ToggleLeft,
  Circle, LayoutTemplate, Fingerprint, CreditCard, Smartphone, MapPin, FileStack,
} from "lucide-react";

const APPLICABILITY_OPTIONS = ["CITIZEN", "GOVERNMENT", "BOTH"];
const MODE_OPTIONS = ["ONLINE", "OFFLINE", "BOTH"];
const STAGE_TYPES = ["SCRUTINY", "PAYMENT_CHECK", "CERTIFICATE_GENERATION", "NOTESHEET_GENERATION", "DISPATCH"];

const FIELD_TYPES = [
  { value: "TEXT",           label: "Text Input",     icon: Type },
  { value: "TEXTAREA",       label: "Text Area",      icon: AlignLeft },
  { value: "NUMBER",         label: "Number",         icon: Hash },
  { value: "DATE",           label: "Date",           icon: CalendarDays },
  { value: "DROPDOWN",       label: "Dropdown",       icon: List },
  { value: "RADIO_BUTTONS",  label: "Radio Buttons",  icon: Circle },
  { value: "CHECKBOX",       label: "Checkbox",       icon: CheckSquare },
  { value: "TOGGLE",         label: "Toggle Switch",  icon: ToggleLeft },
  { value: "FILE",           label: "File Upload",    icon: FileStack },
  { value: "AADHAAR",        label: "Aadhaar No.",    icon: Fingerprint },
  { value: "PAN",            label: "PAN Number",     icon: CreditCard },
  { value: "MOBILE",         label: "Mobile Number",  icon: Smartphone },
  { value: "GPS",            label: "GPS Location",   icon: MapPin },
  { value: "SECTION_HEADER", label: "Section Header", icon: LayoutTemplate },
];

const STEPS = [
  { key: "basic",    label: "Basic Info",       sub: "Service details & settings" },
  { key: "documents",label: "Documents",        sub: "Required document checklist" },
  { key: "form",     label: "Form Fields",      sub: "Applicant-facing fields" },
  { key: "workflow", label: "Workflow",         sub: "Stages & SLA" },
  { key: "review",   label: "Review & Publish", sub: "Confirm and finish" },
];

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
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-slate-700">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export default function ServiceWizardPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [error, setError] = useState("");

  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const [basic, setBasic] = useState({
    boardId: "", departmentId: "",
    nameEnglish: "", nameMarathi: "", code: "", description: "",
    serviceCategory: "", serviceType: "",
    applicability: "BOTH", mode: "ONLINE",
    applicationFee: 0, processingFee: 0, securityDeposit: 0,
    slaDays: 21, applicationNumberFormat: "", certificateNumberFormat: "",
    active: true, workingDaysOnly: false, approvalRequired: true,
    digitalSignatureRequired: false, aaplesarkarIntegrationRequired: false,
    digilockerIntegrationRequired: false, challanRequired: true,
    qrCodeRequired: false, appealAllowed: true, grievanceAllowed: true,
  });
  const [service, setService] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [newDoc, setNewDoc] = useState({ documentName: "", mandatory: true, allowedFileTypes: "pdf,jpg,png", maxFileSizeMb: 5, maxCount: 1, displayOrder: 1 });

  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ fieldKey: "", label: "", labelMarathi: "", type: "TEXT", required: true, fullWidth: false, displayOrder: 1 });

  const [workflow, setWorkflow] = useState(null);
  const [stages, setStages] = useState([]);
  const [newStage, setNewStage] = useState({ sequenceOrder: 1, stageName: "", stageType: "SCRUTINY", slaHours: 24, eligibleRoleIds: [] });

  useEffect(() => {
    boardsApi.list().then(setBoards).catch(e => setError(e.message));
    rolesApi.list().then(setRoles).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!basic.boardId) return setDepartments([]);
    departmentsApi.list(basic.boardId).then(setDepartments).catch(e => setError(e.message));
  }, [basic.boardId]);

  function goTo(i) {
    if (i <= stepIndex || completed.includes(i - 1) || i === 0) setStepIndex(i);
  }
  function markDoneAndNext() {
    setCompleted(c => [...new Set([...c, stepIndex])]);
    setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
  }

  async function createService(e) {
    e.preventDefault();
    try {
      const created = await servicesApi.create({ ...basic });
      setService(created);
      markDoneAndNext();
    } catch (e) { setError(e.message); }
  }

  async function addDocument(e) {
    e.preventDefault();
    try {
      await formDesignerApi.addDocument(service.id, { ...newDoc, displayOrder: documents.length + 1 });
      setDocuments(await formDesignerApi.documents(service.id));
      setNewDoc({ documentName: "", mandatory: true, allowedFileTypes: "pdf,jpg,png", maxFileSizeMb: 5, maxCount: 1, displayOrder: 1 });
    } catch (e) { setError(e.message); }
  }

  async function removeDocument(d) {
    try {
      await formDesignerApi.deactivateDocument(service.id, d.id);
      setDocuments(await formDesignerApi.documents(service.id));
    } catch (e) { setError(e.message); }
  }

  async function addField(e) {
    e.preventDefault();
    try {
      const payload = {
        ...newField,
        labelMarathi: newField.labelMarathi || null,
        displayOrder: fields.length + 1,
        validationRules: null,
        conditionFieldKey: null, conditionOperator: null, conditionValue: null,
        requiredConditionFieldKey: null, requiredConditionOperator: null, requiredConditionValue: null,
        crossValidateFieldKey: null, crossValidateOperator: null, crossValidateMessage: null,
      };
      await formDesignerApi.addField(service.id, payload);
      setFields(await formDesignerApi.fields(service.id));
      setNewField({ fieldKey: "", label: "", labelMarathi: "", type: "TEXT", required: true, fullWidth: false, displayOrder: 1 });
    } catch (e) { setError(e.message); }
  }

  async function removeField(f) {
    try {
      await formDesignerApi.deleteField(service.id, f.id);
      setFields(await formDesignerApi.fields(service.id));
    } catch (e) { setError(e.message); }
  }

  async function ensureWorkflow() {
    if (workflow) return workflow;
    const created = await workflowApi.create({ serviceId: service.id });
    setWorkflow(created);
    return created;
  }

  async function addStage(e) {
    e.preventDefault();
    try {
      const wf = await ensureWorkflow();
      await workflowApi.addStage(wf.id, { ...newStage, sequenceOrder: stages.length + 1 });
      setStages(await workflowApi.stages(wf.id));
      setNewStage({ sequenceOrder: 1, stageName: "", stageType: "SCRUTINY", slaHours: 24, eligibleRoleIds: [] });
    } catch (e) { setError(e.message); }
  }

  function toggleRole(id) {
    setNewStage(s => ({
      ...s,
      eligibleRoleIds: s.eligibleRoleIds.includes(id)
        ? s.eligibleRoleIds.filter(r => r !== id)
        : [...s.eligibleRoleIds, id],
    }));
  }

  function autoKey(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  const currentKey = STEPS[stepIndex].key;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Add New Service</h1>
        <p className="text-sm text-slate-500 mt-0.5">Set up basic info, documents, form fields, and workflow in one place</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <div className="flex gap-6 items-start">

        {/* ── Vertical Stepper ── */}
        <div className="w-56 flex-shrink-0 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Steps</p>
          </div>
          <div className="p-3 space-y-1">
            {STEPS.map((step, i) => {
              const isDone    = completed.includes(i);
              const isActive  = i === stepIndex;
              const isLocked  = i > stepIndex && !completed.includes(i - 1) && i !== 0;
              return (
                <button
                  key={step.key}
                  onClick={() => goTo(i)}
                  disabled={isLocked}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40
                    ${isActive ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"}`}
                >
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors
                    ${isDone ? "bg-emerald-500 text-white" : isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {isDone ? <Check size={13} /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] font-semibold truncate ${isActive ? "text-blue-700" : isDone ? "text-slate-700" : "text-slate-500"}`}>
                      {step.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{step.sub}</div>
                  </div>
                  {isActive && <ChevronRight size={13} className="text-blue-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          {service && (
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="text-[10px] text-slate-400 font-mono truncate">{service.code}</p>
              <p className="text-[11px] text-slate-600 font-medium truncate">{service.nameEnglish}</p>
            </div>
          )}
        </div>

        {/* ── Step Content ── */}
        <div className="flex-1 min-w-0">

          {/* ── Step 1: Basic Info ── */}
          {currentKey === "basic" && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Basic Information</h2>
                <p className="text-sm text-slate-500 mt-0.5">Core service details, fees, and configuration flags</p>
              </div>
              <form onSubmit={createService} className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Service Code" required>
                    <input required value={basic.code} onChange={e => setBasic({ ...basic, code: e.target.value })} className={inp} placeholder="MHADA_TRANSFER" />
                  </Field>
                  <Field label="Name (English)" required>
                    <input required value={basic.nameEnglish} onChange={e => setBasic({ ...basic, nameEnglish: e.target.value })} className={inp} />
                  </Field>
                  <Field label="Name (Marathi)">
                    <input value={basic.nameMarathi} onChange={e => setBasic({ ...basic, nameMarathi: e.target.value })} className={inp} />
                  </Field>
                </div>

                <Field label="Description">
                  <textarea rows={2} value={basic.description} onChange={e => setBasic({ ...basic, description: e.target.value }) } className={inp} />
                </Field>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Board" required>
                    <select required value={basic.boardId} onChange={e => setBasic({ ...basic, boardId: e.target.value, departmentId: "" })} className={inp}>
                      <option value="">Select board</option>
                      {boards.map(b => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
                    </select>
                  </Field>
                  <Field label="Department" required>
                    <select required value={basic.departmentId} onChange={e => setBasic({ ...basic, departmentId: e.target.value })}
                      disabled={!basic.boardId} className={inp + (!basic.boardId ? " opacity-50" : "")}>
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
                    </select>
                  </Field>
                  <Field label="Service Category">
                    <input value={basic.serviceCategory} onChange={e => setBasic({ ...basic, serviceCategory: e.target.value })} className={inp} />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Service Type">
                    <input value={basic.serviceType} onChange={e => setBasic({ ...basic, serviceType: e.target.value })} className={inp} />
                  </Field>
                  <Field label="Applicability">
                    <select value={basic.applicability} onChange={e => setBasic({ ...basic, applicability: e.target.value })} className={inp}>
                      {APPLICABILITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Mode">
                    <select value={basic.mode} onChange={e => setBasic({ ...basic, mode: e.target.value })} className={inp}>
                      {MODE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Application Fee (₹)">
                    <input type="number" min="0" value={basic.applicationFee} onChange={e => setBasic({ ...basic, applicationFee: Number(e.target.value) })} className={inp} />
                  </Field>
                  <Field label="Processing Fee (₹)">
                    <input type="number" min="0" value={basic.processingFee} onChange={e => setBasic({ ...basic, processingFee: Number(e.target.value) })} className={inp} />
                  </Field>
                  <Field label="Security Deposit (₹)">
                    <input type="number" min="0" value={basic.securityDeposit} onChange={e => setBasic({ ...basic, securityDeposit: Number(e.target.value) })} className={inp} />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="SLA (days)">
                    <input type="number" min="1" value={basic.slaDays} onChange={e => setBasic({ ...basic, slaDays: Number(e.target.value) })} className={inp} />
                  </Field>
                  <Field label="Application No. Format">
                    <input value={basic.applicationNumberFormat} onChange={e => setBasic({ ...basic, applicationNumberFormat: e.target.value })} className={inp} placeholder="MHADA-{YYYY}-{SEQ}" />
                  </Field>
                  <Field label="Certificate No. Format">
                    <input value={basic.certificateNumberFormat} onChange={e => setBasic({ ...basic, certificateNumberFormat: e.target.value })} className={inp} placeholder="CERT-{YYYY}-{SEQ}" />
                  </Field>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Configuration Flags</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <Toggle checked={basic.active} onChange={v => setBasic({ ...basic, active: v })} label="Active" />
                    <Toggle checked={basic.workingDaysOnly} onChange={v => setBasic({ ...basic, workingDaysOnly: v })} label="Working days only" />
                    <Toggle checked={basic.challanRequired} onChange={v => setBasic({ ...basic, challanRequired: v })} label="Challan required" />
                    <Toggle checked={basic.approvalRequired} onChange={v => setBasic({ ...basic, approvalRequired: v })} label="Approval required" />
                    <Toggle checked={basic.digitalSignatureRequired} onChange={v => setBasic({ ...basic, digitalSignatureRequired: v })} label="Digital signature" />
                    <Toggle checked={basic.qrCodeRequired} onChange={v => setBasic({ ...basic, qrCodeRequired: v })} label="QR code required" />
                    <Toggle checked={basic.aaplesarkarIntegrationRequired} onChange={v => setBasic({ ...basic, aaplesarkarIntegrationRequired: v })} label="Aaplesarkar integration" />
                    <Toggle checked={basic.digilockerIntegrationRequired} onChange={v => setBasic({ ...basic, digilockerIntegrationRequired: v })} label="DigiLocker integration" />
                    <Toggle checked={basic.grievanceAllowed} onChange={v => setBasic({ ...basic, grievanceAllowed: v })} label="Grievance allowed" />
                    <Toggle checked={basic.appealAllowed} onChange={v => setBasic({ ...basic, appealAllowed: v })} label="Appeal allowed" />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button type="submit" disabled={!!service}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
                    {service ? <><Check size={15} /> Service Created</> : "Create Service & Continue"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Step 2: Documents ── */}
          {currentKey === "documents" && service && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Document Checklist</h2>
                <p className="text-sm text-slate-500 mt-0.5">Documents required from applicants for {service.nameEnglish}</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* Document list */}
                {documents.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                    No documents added yet — add at least one required document below
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((d, i) => (
                      <div key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <Paperclip size={14} className={d.mandatory ? "text-red-400 flex-shrink-0" : "text-slate-300 flex-shrink-0"} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-slate-800">{d.documentName}</span>
                          <span className="ml-2 text-xs text-slate-400">{d.allowedFileTypes} · max {d.maxFileSizeMb}MB</span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.mandatory ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"}`}>
                          {d.mandatory ? "Mandatory" : "Optional"}
                        </span>
                        <button onClick={() => removeDocument(d)} className="rounded-lg p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add document form */}
                <form onSubmit={addDocument} className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Document</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Document Name" required>
                      <input required value={newDoc.documentName} onChange={e => setNewDoc({ ...newDoc, documentName: e.target.value })}
                        className={inp} placeholder="e.g. Aadhaar Card" />
                    </Field>
                    <Field label="Allowed File Types">
                      <input value={newDoc.allowedFileTypes} onChange={e => setNewDoc({ ...newDoc, allowedFileTypes: e.target.value })}
                        className={inp} placeholder="pdf,jpg,png" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Max Size (MB)">
                      <input type="number" min="1" value={newDoc.maxFileSizeMb} onChange={e => setNewDoc({ ...newDoc, maxFileSizeMb: Number(e.target.value) })} className={inp} />
                    </Field>
                    <Field label="Max Count">
                      <input type="number" min="1" value={newDoc.maxCount} onChange={e => setNewDoc({ ...newDoc, maxCount: Number(e.target.value) })} className={inp} />
                    </Field>
                    <div className="flex items-center justify-between pt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newDoc.mandatory} onChange={e => setNewDoc({ ...newDoc, mandatory: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                        <span className="text-sm text-slate-700">Mandatory</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      <Plus size={14} /> Add Document
                    </button>
                  </div>
                </form>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button onClick={markDoneAndNext}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Form Fields ── */}
          {currentKey === "form" && service && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Form Fields</h2>
                <p className="text-sm text-slate-500 mt-0.5">Quick-add fields here; use Form Designer for advanced conditions & ordering</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {fields.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                    No fields added yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map(f => {
                      const meta = FIELD_TYPES.find(t => t.value === f.type);
                      const Icon = meta?.icon || Type;
                      return (
                        <div key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                          <Icon size={14} className="text-slate-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-slate-800">{f.label}</span>
                            {f.labelMarathi && <span className="ml-1 text-xs text-slate-400">{f.labelMarathi}</span>}
                            <span className="ml-2 font-mono text-xs text-slate-400">({f.fieldKey})</span>
                          </div>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">{meta?.label || f.type}</span>
                          {f.required && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">Req</span>}
                          <button onClick={() => removeField(f)} className="rounded-lg p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add field form */}
                <form onSubmit={addField} className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Field</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Label (English)" required>
                      <input required value={newField.label}
                        onChange={e => {
                          const label = e.target.value;
                          setNewField(f => ({ ...f, label, fieldKey: f.fieldKey || autoKey(label) }));
                        }}
                        className={inp} placeholder="e.g. Applicant Name" />
                    </Field>
                    <Field label="Label (Marathi)">
                      <input value={newField.labelMarathi} onChange={e => setNewField(f => ({ ...f, labelMarathi: e.target.value }))}
                        className={inp} placeholder="मराठी लेबल" />
                    </Field>
                    <Field label="Field Key" required>
                      <input required value={newField.fieldKey} onChange={e => setNewField(f => ({ ...f, fieldKey: e.target.value }))}
                        className={`${inp} font-mono`} placeholder="applicant_name" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <Field label="Type">
                      <select value={newField.type} onChange={e => setNewField(f => ({ ...f, type: e.target.value }))} className={inp}>
                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </Field>
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input type="checkbox" checked={newField.required} onChange={e => setNewField(f => ({ ...f, required: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                      <span className="text-sm text-slate-700">Required</span>
                    </label>
                    <div className="flex justify-end">
                      <button type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                        <Plus size={14} /> Add Field
                      </button>
                    </div>
                  </div>
                </form>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button onClick={markDoneAndNext}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Workflow ── */}
          {currentKey === "workflow" && service && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Workflow Stages</h2>
                <p className="text-sm text-slate-500 mt-0.5">Define processing stages and SLA for {service.nameEnglish}</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {stages.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                    No stages yet — add the first processing stage below
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stages.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-slate-800">{s.stageName}</span>
                          {s.slaHours && <span className="ml-2 text-xs text-slate-400">SLA: {s.slaHours}h</span>}
                        </div>
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-600">{s.stageType}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add stage form */}
                <form onSubmit={addStage} className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Stage</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Stage Name" required>
                      <input required value={newStage.stageName} onChange={e => setNewStage(s => ({ ...s, stageName: e.target.value }))}
                        className={inp} placeholder="e.g. Document Scrutiny" />
                    </Field>
                    <Field label="Stage Type">
                      <select value={newStage.stageType} onChange={e => setNewStage(s => ({ ...s, stageType: e.target.value }))} className={inp}>
                        {STAGE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                      </select>
                    </Field>
                    <Field label="SLA (hours)">
                      <input type="number" min="1" value={newStage.slaHours} onChange={e => setNewStage(s => ({ ...s, slaHours: Number(e.target.value) }))} className={inp} />
                    </Field>
                  </div>
                  {roles.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-500">Eligible Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {roles.map(r => (
                          <label key={r.id} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 cursor-pointer text-sm transition-colors
                            ${newStage.eligibleRoleIds.includes(r.id) ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                            <input type="checkbox" checked={newStage.eligibleRoleIds.includes(r.id)} onChange={() => toggleRole(r.id)} className="sr-only" />
                            {r.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      <Plus size={14} /> Add Stage
                    </button>
                  </div>
                </form>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button onClick={markDoneAndNext}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Review ── */}
          {currentKey === "review" && service && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Review & Publish</h2>
                <p className="text-sm text-slate-500 mt-0.5">Confirm the setup before finishing</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Service", value: `${service.nameEnglish} (${service.code})` },
                    { label: "Department", value: departments.find(d => d.id === service.departmentId)?.nameEnglish || service.departmentId },
                    { label: "Mode", value: service.mode },
                    { label: "SLA", value: `${service.slaDays} days` },
                    { label: "Documents", value: `${documents.length} configured` },
                    { label: "Form Fields", value: `${fields.length} fields` },
                    { label: "Workflow Stages", value: `${stages.length} stages` },
                    { label: "Status", value: service.active ? "Active" : "Inactive" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-400 font-medium mb-0.5">{label}</div>
                      <div className="text-sm font-semibold text-slate-800">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start gap-3">
                  <Check size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Service created successfully!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">You can further configure the form in Form Designer and the workflow in Workflow Builder.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => navigate("/form-designer")}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Open Form Designer
                  </button>
                  <button onClick={() => navigate("/master/services")}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    <Check size={15} /> Done — Go to Services
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Locked step message */}
          {currentKey !== "basic" && !service && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-12 text-center">
              <p className="text-sm text-slate-400">Complete <strong>Basic Info</strong> first to create the service and unlock this step.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
