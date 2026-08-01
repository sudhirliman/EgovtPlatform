import React, { useEffect, useState } from "react";
import { boardsApi, departmentsApi, servicesApi, formDesignerApi, masterFormFieldsApi } from "../api/client";
import {
  PageHeader, Card, Button, Input, Select, ErrorBanner, LoadingRow, Badge,
  SlideOver, Toggle,
} from "../components/ui.jsx";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, Library } from "lucide-react";

const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "DROPDOWN", "FILE", "TEXTAREA", "CHECKBOX"];

const emptyField = (order) => ({
  fieldKey: "", label: "", type: "TEXT", required: true, displayOrder: order, options: "",
  conditionFieldKey: "", conditionOperator: "EQUALS", conditionValue: "",
  requiredConditionFieldKey: "", requiredConditionOperator: "EQUALS", requiredConditionValue: "",
  crossValidateFieldKey: "", crossValidateOperator: "GREATER_THAN_OR_EQUAL", crossValidateMessage: "",
});
const OPERATORS = ["EQUALS", "NOT_EQUALS", "IN"];
const CROSS_OPERATORS = ["EQUALS", "NOT_EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUAL", "LESS_THAN", "LESS_THAN_OR_EQUAL"];
const emptyDoc = (order) => ({ documentName: "", mandatory: true, allowedFileTypes: "pdf,jpg,png", maxFileSizeMb: 5, maxCount: 1, displayOrder: order });

function parseOptions(validationRules) {
  try {
    const parsed = JSON.parse(validationRules || "{}");
    return (parsed.options || []).join(", ");
  } catch {
    return "";
  }
}
function toValidationRules(optionsCsv) {
  const options = optionsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  return options.length ? JSON.stringify({ options }) : null;
}

function isFieldVisible(field, values) {
  if (!field.conditionFieldKey) return true;
  const actual = (values[field.conditionFieldKey] ?? "").toString().trim();
  const expected = (field.conditionValue || "").toString().trim();
  switch (field.conditionOperator) {
    case "NOT_EQUALS":
      return actual !== expected;
    case "IN":
      return expected.split(",").map((v) => v.trim()).includes(actual);
    case "EQUALS":
    default:
      return actual === expected;
  }
}

function isFieldRequired(field, values) {
  if (field.required) return true;
  if (!field.requiredConditionFieldKey) return false;
  const actual = (values[field.requiredConditionFieldKey] ?? "").toString().trim();
  const expected = (field.requiredConditionValue || "").toString().trim();
  switch (field.requiredConditionOperator) {
    case "NOT_EQUALS":
      return actual !== expected;
    case "IN":
      return expected.split(",").map((v) => v.trim()).includes(actual);
    case "EQUALS":
    default:
      return actual === expected;
  }
}

function checkCrossValidation(field, values) {
  if (!field.crossValidateFieldKey) return null;
  const a = values[field.fieldKey];
  const b = values[field.crossValidateFieldKey];
  if (a === undefined || a === "" || b === undefined || b === "") return null; // nothing to compare yet
  const av = field.type === "NUMBER" ? Number(a) : a;
  const bv = field.type === "NUMBER" ? Number(b) : b;
  let ok;
  switch (field.crossValidateOperator) {
    case "EQUALS": ok = av === bv; break;
    case "NOT_EQUALS": ok = av !== bv; break;
    case "GREATER_THAN": ok = av > bv; break;
    case "GREATER_THAN_OR_EQUAL": ok = av >= bv; break;
    case "LESS_THAN": ok = av < bv; break;
    case "LESS_THAN_OR_EQUAL": ok = av <= bv; break;
    default: ok = true;
  }
  return ok ? null : (field.crossValidateMessage || `${field.label} fails cross-field validation`);
}

export default function FormDesignerPage() {
  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [boardId, setBoardId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [fields, setFields] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewValues, setPreviewValues] = useState({});
  const [previewErrors, setPreviewErrors] = useState({});

  const [fieldPanel, setFieldPanel] = useState(null); // null closed, {} new, {...field} edit
  const [fieldForm, setFieldForm] = useState(emptyField(0));
  const [docPanel, setDocPanel] = useState(null);
  const [docForm, setDocForm] = useState(emptyDoc(0));
  const [masterFields, setMasterFields] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    masterFormFieldsApi.list().then((all) => setMasterFields(all.filter((f) => f.active))).catch(() => {});
  }, []);

  useEffect(() => {
    boardsApi.list().then(setBoards).catch((e) => setError(e.message)).finally(() => setLoading(false));
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

  async function loadServiceForm(id) {
    const [f, d] = await Promise.all([formDesignerApi.fields(id), formDesignerApi.documents(id)]);
    setFields(f);
    setDocuments(d);
  }

  useEffect(() => {
    if (!serviceId) {
      setFields([]);
      setDocuments([]);
      return;
    }
    loadServiceForm(serviceId).catch((e) => setError(e.message));
  }, [serviceId]);

  // ---- Fields ----
  function openNewField() {
    setFieldForm(emptyField(fields.length));
    setFieldPanel({});
  }
  function insertFromLibrary(master) {
    setFieldForm({
      fieldKey: master.fieldKey,
      label: master.label,
      type: master.type,
      required: master.defaultRequired,
      displayOrder: fields.length,
      options: parseOptions(master.validationRules),
    });
    setShowLibrary(false);
    setFieldPanel({});
  }
  function openEditField(f) {
    setFieldForm({
      fieldKey: f.fieldKey, label: f.label, type: f.type, required: f.required, displayOrder: f.displayOrder,
      options: parseOptions(f.validationRules),
      conditionFieldKey: f.conditionFieldKey || "", conditionOperator: f.conditionOperator || "EQUALS",
      conditionValue: f.conditionValue || "",
      requiredConditionFieldKey: f.requiredConditionFieldKey || "", requiredConditionOperator: f.requiredConditionOperator || "EQUALS",
      requiredConditionValue: f.requiredConditionValue || "",
      crossValidateFieldKey: f.crossValidateFieldKey || "", crossValidateOperator: f.crossValidateOperator || "GREATER_THAN_OR_EQUAL",
      crossValidateMessage: f.crossValidateMessage || "",
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
    } catch (e) {
      setError(e.message);
    }
  }
  async function deleteField(f) {
    try {
      await formDesignerApi.deleteField(serviceId, f.id);
      await loadServiceForm(serviceId);
    } catch (e) {
      setError(e.message);
    }
  }
  async function moveField(index, direction) {
    const newOrder = [...fields];
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= newOrder.length) return;
    [newOrder[index], newOrder[swapWith]] = [newOrder[swapWith], newOrder[index]];
    try {
      await formDesignerApi.reorderFields(serviceId, newOrder.map((f) => f.id));
      await loadServiceForm(serviceId);
    } catch (e) {
      setError(e.message);
    }
  }

  // ---- Documents ----
  function openNewDoc() {
    setDocForm(emptyDoc(documents.length));
    setDocPanel({});
  }
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
    } catch (e) {
      setError(e.message);
    }
  }
  async function deactivateDoc(d) {
    try {
      await formDesignerApi.deactivateDocument(serviceId, d.id);
      await loadServiceForm(serviceId);
    } catch (e) {
      setError(e.message);
    }
  }
  async function moveDoc(index, direction) {
    const newOrder = [...documents];
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= newOrder.length) return;
    [newOrder[index], newOrder[swapWith]] = [newOrder[swapWith], newOrder[index]];
    try {
      await formDesignerApi.reorderDocuments(serviceId, newOrder.map((d) => d.id));
      await loadServiceForm(serviceId);
    } catch (e) {
      setError(e.message);
    }
  }

  function runPreviewValidation() {
    const errors = {};
    const visible = fields.filter((f) => isFieldVisible(f, previewValues));
    for (const f of visible) {
      const value = (previewValues[f.fieldKey] ?? "").toString().trim();
      if (isFieldRequired(f, previewValues) && !value) {
        errors[f.fieldKey] = `${f.label} is required`;
        continue;
      }
      const crossError = checkCrossValidation(f, previewValues);
      if (crossError) {
        errors[f.fieldKey] = crossError;
      }
    }
    setPreviewErrors(errors);
  }

  if (loading) return <LoadingRow label="Loading form designer..." />;

  return (
    <div>
      <PageHeader
        title="Form designer"
        subtitle="Define a service's application fields and required documents"
        action={
          serviceId ? (
            <Button variant="secondary" onClick={() => setShowPreview((s) => !s)}>
              <Eye size={15} aria-hidden="true" /> {showPreview ? "Hide preview" : "Show preview"}
            </Button>
          ) : null
        }
      />
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

      {serviceId && (
        <div className={`grid gap-4 ${showPreview ? "grid-cols-3" : "grid-cols-2"}`}>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] font-medium text-slate-900">Form fields</div>
              <div className="relative flex items-center gap-2">
                <Button variant="secondary" onClick={() => setShowLibrary((s) => !s)}>
                  <Library size={14} aria-hidden="true" /> Insert from library
                </Button>
                <Button onClick={openNewField}><Plus size={14} aria-hidden="true" /> Add field</Button>
                {showLibrary && (
                  <div className="absolute right-0 top-full z-10 mt-1 max-h-64 w-72 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                    {masterFields.length === 0 && (
                      <div className="p-3 text-[13px] text-slate-400">No master fields yet - add some under Master &gt; Form Fields</div>
                    )}
                    {masterFields.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => insertFromLibrary(m)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-slate-50"
                      >
                        <span>{m.label} <span className="text-slate-400">({m.fieldKey})</span></span>
                        <Badge>{m.type}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {fields.map((f, i) => (
                <div key={f.id} className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-[13px]">
                  <span>{f.label} <span className="text-slate-400">({f.fieldKey})</span></span>
                  <div className="flex items-center gap-1.5">
                    <Badge>{f.type}</Badge>
                    {f.required && <Badge tone="warning">required</Badge>}
                    {f.conditionFieldKey && <Badge tone="default">conditional</Badge>}
                    {f.requiredConditionFieldKey && <Badge tone="warning">req. if...</Badge>}
                    {f.crossValidateFieldKey && <Badge tone="default">cross-check</Badge>}
                    <button className="text-slate-400 hover:text-slate-700" onClick={() => moveField(i, -1)} disabled={i === 0}><ArrowUp size={13} aria-hidden="true" /></button>
                    <button className="text-slate-400 hover:text-slate-700" onClick={() => moveField(i, 1)} disabled={i === fields.length - 1}><ArrowDown size={13} aria-hidden="true" /></button>
                    <button className="text-slate-400 hover:text-blue-700" onClick={() => openEditField(f)}><Pencil size={13} aria-hidden="true" /></button>
                    <button className="text-slate-400 hover:text-red-600" onClick={() => deleteField(f)}><Trash2 size={13} aria-hidden="true" /></button>
                  </div>
                </div>
              ))}
              {fields.length === 0 && <div className="py-4 text-center text-[13px] text-slate-400">No fields yet</div>}
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] font-medium text-slate-900">Document checklist</div>
              <Button onClick={openNewDoc}><Plus size={14} aria-hidden="true" /> Add document</Button>
            </div>
            <div className="flex flex-col gap-1">
              {documents.map((d, i) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-[13px]">
                  <span>{d.documentName}</span>
                  <div className="flex items-center gap-1.5">
                    {d.mandatory ? <Badge tone="warning">mandatory</Badge> : <Badge>optional</Badge>}
                    <button className="text-slate-400 hover:text-slate-700" onClick={() => moveDoc(i, -1)} disabled={i === 0}><ArrowUp size={13} aria-hidden="true" /></button>
                    <button className="text-slate-400 hover:text-slate-700" onClick={() => moveDoc(i, 1)} disabled={i === documents.length - 1}><ArrowDown size={13} aria-hidden="true" /></button>
                    <button className="text-slate-400 hover:text-blue-700" onClick={() => openEditDoc(d)}><Pencil size={13} aria-hidden="true" /></button>
                    <button className="text-slate-400 hover:text-red-600" onClick={() => deactivateDoc(d)}><Trash2 size={13} aria-hidden="true" /></button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && <div className="py-4 text-center text-[13px] text-slate-400">No documents configured yet</div>}
            </div>
          </Card>

          {showPreview && (
            <Card>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[13px] font-medium text-slate-900">Citizen-facing preview</div>
                <Button variant="secondary" onClick={runPreviewValidation}>Validate</Button>
              </div>
              <div className="mb-3 text-xs text-slate-400">Fill values below - conditional fields appear/disappear live; click Validate to check required + cross-field rules</div>
              <div className="flex flex-col gap-3">
                {fields.filter((f) => isFieldVisible(f, previewValues)).map((f) => (
                  <label key={f.id} className="flex flex-col gap-1 text-[13px]">
                    <span className="text-slate-600">
                      {f.label}{isFieldRequired(f, previewValues) && <span className="text-red-500"> *</span>}
                      {f.conditionFieldKey && <span className="ml-1 text-xs text-slate-400">(conditional)</span>}
                    </span>
                    {f.type === "TEXTAREA" ? (
                      <textarea
                        rows={2}
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-[13px]"
                        value={previewValues[f.fieldKey] || ""}
                        onChange={(e) => setPreviewValues({ ...previewValues, [f.fieldKey]: e.target.value })}
                      />
                    ) : f.type === "DROPDOWN" ? (
                      <select
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-[13px]"
                        value={previewValues[f.fieldKey] || ""}
                        onChange={(e) => setPreviewValues({ ...previewValues, [f.fieldKey]: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {parseOptions(f.validationRules).split(",").map((o) => o.trim()).filter(Boolean).map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : f.type === "CHECKBOX" ? (
                      <input
                        type="checkbox"
                        className="w-4"
                        checked={previewValues[f.fieldKey] === "true"}
                        onChange={(e) => setPreviewValues({ ...previewValues, [f.fieldKey]: String(e.target.checked) })}
                      />
                    ) : f.type === "FILE" ? (
                      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-3 text-center text-slate-400">Choose file</div>
                    ) : (
                      <input
                        type={f.type === "NUMBER" ? "number" : f.type === "DATE" ? "date" : "text"}
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-[13px]"
                        value={previewValues[f.fieldKey] || ""}
                        onChange={(e) => setPreviewValues({ ...previewValues, [f.fieldKey]: e.target.value })}
                      />
                    )}
                    {previewErrors[f.fieldKey] && (
                      <span className="text-xs text-red-600">{previewErrors[f.fieldKey]}</span>
                    )}
                  </label>
                ))}
                {documents.length > 0 && (
                  <div className="mt-2 border-t border-slate-200 pt-3">
                    <div className="mb-2 text-[13px] font-medium text-slate-700">Documents to upload</div>
                    {documents.map((d) => (
                      <div key={d.id} className="mb-1 text-[13px] text-slate-600">
                        \u2022 {d.documentName}{d.mandatory && <span className="text-red-500"> *</span>}
                      </div>
                    ))}
                  </div>
                )}
                {fields.length === 0 && documents.length === 0 && (
                  <div className="py-4 text-center text-[13px] text-slate-400">Nothing to preview yet</div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      <SlideOver open={!!fieldPanel} title={fieldPanel?.id ? "Edit field" : "Add field"} onClose={() => setFieldPanel(null)}>
        <form onSubmit={saveField} className="flex h-full flex-col">
          <div className="flex flex-1 flex-col gap-4">
            <Input label="Field key (e.g. applicant_name)" value={fieldForm.fieldKey} onChange={(e) => setFieldForm({ ...fieldForm, fieldKey: e.target.value })} required />
            <Input label="Label" value={fieldForm.label} onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })} required />
            <Select label="Type" value={fieldForm.type} onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}>
              {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            {fieldForm.type === "DROPDOWN" && (
              <Input label="Options (comma-separated)" value={fieldForm.options} onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })} placeholder="General, OBC, SC, ST" />
            )}
            <Toggle checked={fieldForm.required} onChange={(v) => setFieldForm({ ...fieldForm, required: v })} label="Required" />

            <div className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 text-[13px] font-medium text-slate-700">Show only if (optional)</div>
              <div className="flex flex-col gap-3">
                <Select
                  label="Depends on field"
                  value={fieldForm.conditionFieldKey}
                  onChange={(e) => setFieldForm({ ...fieldForm, conditionFieldKey: e.target.value })}
                >
                  <option value="">Always visible</option>
                  {fields.filter((f) => f.fieldKey !== fieldForm.fieldKey).map((f) => (
                    <option key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                  ))}
                </Select>
                {fieldForm.conditionFieldKey && (
                  <>
                    <Select label="Condition" value={fieldForm.conditionOperator} onChange={(e) => setFieldForm({ ...fieldForm, conditionOperator: e.target.value })}>
                      {OPERATORS.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                    </Select>
                    <Input
                      label={fieldForm.conditionOperator === "IN" ? "Value(s) - comma-separated" : "Value"}
                      value={fieldForm.conditionValue}
                      onChange={(e) => setFieldForm({ ...fieldForm, conditionValue: e.target.value })}
                      placeholder={fieldForm.conditionOperator === "IN" ? "SC, ST, OBC" : "Yes"}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 text-[13px] font-medium text-slate-700">Conditionally required</div>
              <p className="mb-2 text-xs text-slate-400">Makes this field mandatory only when another field matches - independent of the Required toggle above.</p>
              <div className="flex flex-col gap-3">
                <Select
                  label="Depends on field"
                  value={fieldForm.requiredConditionFieldKey}
                  onChange={(e) => setFieldForm({ ...fieldForm, requiredConditionFieldKey: e.target.value })}
                >
                  <option value="">Not conditionally required</option>
                  {fields.filter((f) => f.fieldKey !== fieldForm.fieldKey).map((f) => (
                    <option key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                  ))}
                </Select>
                {fieldForm.requiredConditionFieldKey && (
                  <>
                    <Select label="Condition" value={fieldForm.requiredConditionOperator} onChange={(e) => setFieldForm({ ...fieldForm, requiredConditionOperator: e.target.value })}>
                      {OPERATORS.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                    </Select>
                    <Input
                      label={fieldForm.requiredConditionOperator === "IN" ? "Value(s) - comma-separated" : "Value"}
                      value={fieldForm.requiredConditionValue}
                      onChange={(e) => setFieldForm({ ...fieldForm, requiredConditionValue: e.target.value })}
                      placeholder={fieldForm.requiredConditionOperator === "IN" ? "SC, ST, OBC" : "Yes"}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 text-[13px] font-medium text-slate-700">Cross-field validation</div>
              <p className="mb-2 text-xs text-slate-400">Compares this field's value against another field's value (e.g. End Date must be on/after Start Date).</p>
              <div className="flex flex-col gap-3">
                <Select
                  label="Compare against field"
                  value={fieldForm.crossValidateFieldKey}
                  onChange={(e) => setFieldForm({ ...fieldForm, crossValidateFieldKey: e.target.value })}
                >
                  <option value="">No cross-field check</option>
                  {fields.filter((f) => f.fieldKey !== fieldForm.fieldKey).map((f) => (
                    <option key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                  ))}
                </Select>
                {fieldForm.crossValidateFieldKey && (
                  <>
                    <Select label="This field's value must be" value={fieldForm.crossValidateOperator} onChange={(e) => setFieldForm({ ...fieldForm, crossValidateOperator: e.target.value })}>
                      {CROSS_OPERATORS.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                    </Select>
                    <Input
                      label="Error message"
                      value={fieldForm.crossValidateMessage}
                      onChange={(e) => setFieldForm({ ...fieldForm, crossValidateMessage: e.target.value })}
                      placeholder="End date must be on or after start date"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setFieldPanel(null)}>Cancel</Button>
            <Button type="submit" className="flex-1 justify-center">{fieldPanel?.id ? "Save changes" : "Add field"}</Button>
          </div>
        </form>
      </SlideOver>

      <SlideOver open={!!docPanel} title={docPanel?.id ? "Edit document" : "Add document"} onClose={() => setDocPanel(null)}>
        <form onSubmit={saveDoc} className="flex h-full flex-col">
          <div className="flex flex-1 flex-col gap-4">
            <Input label="Document name" value={docForm.documentName} onChange={(e) => setDocForm({ ...docForm, documentName: e.target.value })} required />
            <Input label="Allowed file types (comma-separated)" value={docForm.allowedFileTypes} onChange={(e) => setDocForm({ ...docForm, allowedFileTypes: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Max size (MB)" type="number" value={docForm.maxFileSizeMb} onChange={(e) => setDocForm({ ...docForm, maxFileSizeMb: Number(e.target.value) })} />
              <Input label="Max count" type="number" value={docForm.maxCount} onChange={(e) => setDocForm({ ...docForm, maxCount: Number(e.target.value) })} />
            </div>
            <Toggle checked={docForm.mandatory} onChange={(v) => setDocForm({ ...docForm, mandatory: v })} label="Mandatory" />
          </div>
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setDocPanel(null)}>Cancel</Button>
            <Button type="submit" className="flex-1 justify-center">{docPanel?.id ? "Save changes" : "Add document"}</Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
