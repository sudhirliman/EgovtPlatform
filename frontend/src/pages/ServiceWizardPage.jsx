import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  boardsApi,
  departmentsApi,
  servicesApi,
  formDesignerApi,
  workflowApi,
  rolesApi,
} from "../api/client";
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Badge,
  ErrorBanner,
  VerticalStepper,
  Toggle,
} from "../components/ui.jsx";

const APPLICABILITY_OPTIONS = ["CITIZEN", "GOVERNMENT", "BOTH"];
const MODE_OPTIONS = ["ONLINE", "OFFLINE", "BOTH"];

const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "DROPDOWN", "FILE", "TEXTAREA", "CHECKBOX"];
const STAGE_TYPES = ["SCRUTINY", "PAYMENT_CHECK", "CERTIFICATE_GENERATION", "NOTESHEET_GENERATION", "DISPATCH"];

const STEPS = [
  { key: "basic", label: "Basic information", subtitle: "Service details & category" },
  { key: "documents", label: "Documents", subtitle: "Required document checklist" },
  { key: "form", label: "Form fields", subtitle: "Applicant-facing fields" },
  { key: "workflow", label: "Workflow", subtitle: "Stages & SLA" },
  { key: "review", label: "Review & publish", subtitle: "Confirm and finish" },
];

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
  const [service, setService] = useState(null); // created service record

  const [documents, setDocuments] = useState([]);
  const [newDoc, setNewDoc] = useState({ documentName: "", mandatory: true, allowedFileTypes: "pdf,jpg,png", maxFileSizeMb: 5, maxCount: 1, displayOrder: 1 });

  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ fieldKey: "", label: "", type: "TEXT", required: true, displayOrder: 1 });

  const [workflow, setWorkflow] = useState(null);
  const [stages, setStages] = useState([]);
  const [newStage, setNewStage] = useState({ sequenceOrder: 1, stageName: "", stageType: "SCRUTINY", slaHours: 24, eligibleRoleIds: [] });

  useEffect(() => {
    boardsApi.list().then(setBoards).catch((e) => setError(e.message));
    rolesApi.list().then(setRoles).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!basic.boardId) return setDepartments([]);
    departmentsApi.list(basic.boardId).then(setDepartments).catch((e) => setError(e.message));
  }, [basic.boardId]);

  function goTo(i) {
    if (i <= stepIndex || completed.includes(i - 1)) setStepIndex(i);
  }
  function markDoneAndNext() {
    setCompleted((c) => [...new Set([...c, stepIndex])]);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  async function createService(e) {
    e.preventDefault();
    try {
      const created = await servicesApi.create({ ...basic });
      setService(created);
      markDoneAndNext();
    } catch (e) {
      setError(e.message);
    }
  }

  async function addDocument(e) {
    e.preventDefault();
    try {
      await formDesignerApi.addDocument(service.id, newDoc);
      setDocuments(await formDesignerApi.documents(service.id));
      setNewDoc({ documentName: "", mandatory: true, allowedFileTypes: "pdf,jpg,png", maxFileSizeMb: 5, maxCount: 1, displayOrder: documents.length + 2 });
    } catch (e) {
      setError(e.message);
    }
  }

  async function addField(e) {
    e.preventDefault();
    try {
      await formDesignerApi.addField(service.id, newField);
      setFields(await formDesignerApi.fields(service.id));
      setNewField({ fieldKey: "", label: "", type: "TEXT", required: true, displayOrder: fields.length + 2 });
    } catch (e) {
      setError(e.message);
    }
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
      await workflowApi.addStage(wf.id, newStage);
      setStages(await workflowApi.stages(wf.id));
      setNewStage({ sequenceOrder: stages.length + 2, stageName: "", stageType: "SCRUTINY", slaHours: 24, eligibleRoleIds: [] });
    } catch (e) {
      setError(e.message);
    }
  }

  function toggleRole(id) {
    setNewStage((s) => ({
      ...s,
      eligibleRoleIds: s.eligibleRoleIds.includes(id) ? s.eligibleRoleIds.filter((r) => r !== id) : [...s.eligibleRoleIds, id],
    }));
  }

  const currentKey = STEPS[stepIndex].key;

  return (
    <div>
      <PageHeader title="Add new service" subtitle="Set up a service's basic info, documents, form, and workflow in one place" />
      <ErrorBanner message={error} />

      <div className="grid grid-cols-4 gap-4">
        <Card className="col-span-1 h-fit">
          <VerticalStepper steps={STEPS} activeIndex={stepIndex} completedIndexes={completed} onSelect={goTo} />
        </Card>

        <div className="col-span-3">
          {currentKey === "basic" && (
            <Card>
              <div className="mb-3 text-[13px] font-medium text-slate-900">Basic information</div>
              <form onSubmit={createService} className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Service code" value={basic.code} onChange={(e) => setBasic({ ...basic, code: e.target.value })} required />
                  <Input label="Service name (English)" value={basic.nameEnglish} onChange={(e) => setBasic({ ...basic, nameEnglish: e.target.value })} required />
                  <Input label="Service name (Marathi)" value={basic.nameMarathi} onChange={(e) => setBasic({ ...basic, nameMarathi: e.target.value })} />
                </div>

                <label className="flex flex-col gap-1 text-[13px]">
                  <span className="text-slate-600">Description</span>
                  <textarea
                    className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-500"
                    rows={2}
                    value={basic.description}
                    onChange={(e) => setBasic({ ...basic, description: e.target.value })}
                  />
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <Select label="Board" value={basic.boardId} onChange={(e) => setBasic({ ...basic, boardId: e.target.value, departmentId: "" })} required>
                    <option value="">Select board</option>
                    {boards.map((b) => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
                  </Select>
                  <Select label="Department" value={basic.departmentId} onChange={(e) => setBasic({ ...basic, departmentId: e.target.value })} disabled={!basic.boardId} required>
                    <option value="">Select department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
                  </Select>
                  <Input label="Service category" value={basic.serviceCategory} onChange={(e) => setBasic({ ...basic, serviceCategory: e.target.value })} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input label="Service type" value={basic.serviceType} onChange={(e) => setBasic({ ...basic, serviceType: e.target.value })} />
                  <Select label="Applicability" value={basic.applicability} onChange={(e) => setBasic({ ...basic, applicability: e.target.value })}>
                    {APPLICABILITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                  <Select label="Mode" value={basic.mode} onChange={(e) => setBasic({ ...basic, mode: e.target.value })}>
                    {MODE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input label="Application fee (\u20B9)" type="number" min="0" value={basic.applicationFee} onChange={(e) => setBasic({ ...basic, applicationFee: Number(e.target.value) })} />
                  <Input label="Processing fee (\u20B9)" type="number" min="0" value={basic.processingFee} onChange={(e) => setBasic({ ...basic, processingFee: Number(e.target.value) })} />
                  <Input label="Security deposit (\u20B9)" type="number" min="0" value={basic.securityDeposit} onChange={(e) => setBasic({ ...basic, securityDeposit: Number(e.target.value) })} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input label="SLA (days)" type="number" min="0" value={basic.slaDays} onChange={(e) => setBasic({ ...basic, slaDays: Number(e.target.value) })} />
                  <Input label="Application number format" placeholder="MHADA-{YYYY}-{SEQ}" value={basic.applicationNumberFormat} onChange={(e) => setBasic({ ...basic, applicationNumberFormat: e.target.value })} />
                  <Input label="Certificate number format" placeholder="CERT-{YYYY}-{SEQ}" value={basic.certificateNumberFormat} onChange={(e) => setBasic({ ...basic, certificateNumberFormat: e.target.value })} />
                </div>

                <div className="grid grid-cols-3 gap-x-6 gap-y-3 rounded-md bg-slate-50 p-4">
                  <Toggle checked={basic.active} onChange={(v) => setBasic({ ...basic, active: v })} label="Active" />
                  <Toggle checked={basic.workingDaysOnly} onChange={(v) => setBasic({ ...basic, workingDaysOnly: v })} label="Working days only" />
                  <Toggle checked={basic.challanRequired} onChange={(v) => setBasic({ ...basic, challanRequired: v })} label="Challan required" />
                  <Toggle checked={basic.approvalRequired} onChange={(v) => setBasic({ ...basic, approvalRequired: v })} label="Approval required" />
                  <Toggle checked={basic.digitalSignatureRequired} onChange={(v) => setBasic({ ...basic, digitalSignatureRequired: v })} label="Digital signature required" />
                  <Toggle checked={basic.qrCodeRequired} onChange={(v) => setBasic({ ...basic, qrCodeRequired: v })} label="QR code required" />
                  <Toggle checked={basic.aaplesarkarIntegrationRequired} onChange={(v) => setBasic({ ...basic, aaplesarkarIntegrationRequired: v })} label="Aaplesarkar integration required" />
                  <Toggle checked={basic.digilockerIntegrationRequired} onChange={(v) => setBasic({ ...basic, digilockerIntegrationRequired: v })} label="DigiLocker integration required" />
                  <Toggle checked={basic.grievanceAllowed} onChange={(v) => setBasic({ ...basic, grievanceAllowed: v })} label="Grievance allowed" />
                  <Toggle checked={basic.appealAllowed} onChange={(v) => setBasic({ ...basic, appealAllowed: v })} label="Appeal allowed" />
                </div>

                <div>
                  <Button type="submit" disabled={!!service}>{service ? "Service created \u2713" : "Create service & continue"}</Button>
                </div>
              </form>
            </Card>
          )}

          {currentKey === "documents" && service && (
            <Card>
              <div className="mb-3 text-[13px] font-medium text-slate-900">Document checklist for {service.nameEnglish}</div>
              <div className="mb-4 flex flex-col gap-1">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-[13px]">
                    <span>{d.documentName}</span>
                    {d.mandatory ? <Badge tone="warning">mandatory</Badge> : <Badge>optional</Badge>}
                  </div>
                ))}
                {documents.length === 0 && <div className="py-4 text-center text-[13px] text-slate-400">No documents added yet</div>}
              </div>
              <form onSubmit={addDocument} className="mb-4 flex items-end gap-2">
                <Input label="Document name" value={newDoc.documentName} onChange={(e) => setNewDoc({ ...newDoc, documentName: e.target.value })} required />
                <label className="flex items-center gap-2 pb-2 text-[13px] text-slate-600">
                  <input type="checkbox" checked={newDoc.mandatory} onChange={(e) => setNewDoc({ ...newDoc, mandatory: e.target.checked })} />
                  Mandatory
                </label>
                <Button type="submit">Add</Button>
              </form>
              <Button onClick={markDoneAndNext}>Continue</Button>
            </Card>
          )}

          {currentKey === "form" && service && (
            <Card>
              <div className="mb-3 text-[13px] font-medium text-slate-900">Form fields for {service.nameEnglish}</div>
              <div className="mb-4 flex flex-col gap-1">
                {fields.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-[13px]">
                    <span>{f.label} <span className="text-slate-400">({f.fieldKey})</span></span>
                    <Badge>{f.type}</Badge>
                  </div>
                ))}
                {fields.length === 0 && <div className="py-4 text-center text-[13px] text-slate-400">No fields added yet</div>}
              </div>
              <form onSubmit={addField} className="mb-4 grid grid-cols-4 items-end gap-2">
                <Input label="Field key" value={newField.fieldKey} onChange={(e) => setNewField({ ...newField, fieldKey: e.target.value })} required />
                <Input label="Label" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} required />
                <Select label="Type" value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })}>
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Button type="submit">Add field</Button>
              </form>
              <Button onClick={markDoneAndNext}>Continue</Button>
            </Card>
          )}

          {currentKey === "workflow" && service && (
            <Card>
              <div className="mb-3 text-[13px] font-medium text-slate-900">Workflow stages for {service.nameEnglish}</div>
              <div className="mb-4 flex flex-col gap-1">
                {stages.map((s) => (
                  <div key={s.id} className="rounded-md border border-slate-200 p-2 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.sequenceOrder}. {s.stageName}</span>
                      <Badge>{s.stageType}</Badge>
                    </div>
                    {s.slaHours && <div className="mt-1 text-xs text-slate-500">SLA: {s.slaHours}h</div>}
                  </div>
                ))}
                {stages.length === 0 && <div className="py-4 text-center text-[13px] text-slate-400">No stages added yet</div>}
              </div>
              <form onSubmit={addStage} className="mb-4 flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Order" type="number" min="1" value={newStage.sequenceOrder} onChange={(e) => setNewStage({ ...newStage, sequenceOrder: Number(e.target.value) })} required />
                  <Input label="Stage name" value={newStage.stageName} onChange={(e) => setNewStage({ ...newStage, stageName: e.target.value })} required />
                  <Select label="Type" value={newStage.stageType} onChange={(e) => setNewStage({ ...newStage, stageType: e.target.value })}>
                    {STAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <Input label="SLA hours" type="number" min="0" value={newStage.slaHours} onChange={(e) => setNewStage({ ...newStage, slaHours: Number(e.target.value) })} />
                <div className="max-h-24 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {roles.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 py-0.5 text-[12px] text-slate-600">
                      <input type="checkbox" checked={newStage.eligibleRoleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
                      {r.name}
                    </label>
                  ))}
                </div>
                <Button type="submit">Add stage</Button>
              </form>
              <Button onClick={markDoneAndNext}>Continue</Button>
            </Card>
          )}

          {currentKey === "review" && service && (
            <Card>
              <div className="mb-4 text-[13px] font-medium text-slate-900">Review & publish</div>
              <div className="mb-4 grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <div className="text-slate-400">Service</div>
                  <div className="font-medium text-slate-800">{service.nameEnglish} ({service.code})</div>
                </div>
                <div>
                  <div className="text-slate-400">Documents configured</div>
                  <div className="font-medium text-slate-800">{documents.length}</div>
                </div>
                <div>
                  <div className="text-slate-400">Form fields configured</div>
                  <div className="font-medium text-slate-800">{fields.length}</div>
                </div>
                <div>
                  <div className="text-slate-400">Workflow stages</div>
                  <div className="font-medium text-slate-800">{stages.length}</div>
                </div>
              </div>
              <Button onClick={() => navigate("/hierarchy")}>Finish</Button>
            </Card>
          )}

          {currentKey !== "basic" && !service && (
            <Card>
              <div className="py-6 text-center text-[13px] text-slate-400">
                Complete the basic information step first to create the service.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
