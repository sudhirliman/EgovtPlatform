import React, { useEffect, useState } from "react";
import { masterFormFieldsApi } from "../api/client";
import { PageHeader, Card, Button, Input, Select, Table, Badge, ErrorBanner, LoadingRow, SlideOver, Toggle } from "../components/ui.jsx";
import { Plus, Pencil, Trash2 } from "lucide-react";

const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "DROPDOWN", "FILE", "TEXTAREA", "CHECKBOX"];
const emptyForm = () => ({ fieldKey: "", label: "", type: "TEXT", options: "", defaultRequired: false, active: true });

function parseOptions(validationRules) {
  try {
    return (JSON.parse(validationRules || "{}").options || []).join(", ");
  } catch {
    return "";
  }
}
function toValidationRules(optionsCsv) {
  const options = optionsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  return options.length ? JSON.stringify({ options }) : null;
}

export default function MasterFormFieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState(null);
  const [form, setForm] = useState(emptyForm());

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

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(emptyForm());
    setPanel({});
  }
  function openEdit(f) {
    setForm({ fieldKey: f.fieldKey, label: f.label, type: f.type, options: parseOptions(f.validationRules), defaultRequired: f.defaultRequired, active: f.active });
    setPanel(f);
  }

  async function save(e) {
    e.preventDefault();
    try {
      const payload = {
        fieldKey: form.fieldKey, label: form.label, type: form.type,
        validationRules: form.type === "DROPDOWN" ? toValidationRules(form.options) : null,
        defaultRequired: form.defaultRequired, active: form.active,
      };
      if (panel?.id) {
        await masterFormFieldsApi.update(panel.id, payload);
      } else {
        await masterFormFieldsApi.create(payload);
      }
      setPanel(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(f) {
    try {
      if (f.systemDefined) {
        await masterFormFieldsApi.deactivate(f.id);
      } else {
        await masterFormFieldsApi.delete(f.id);
      }
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <LoadingRow label="Loading form fields master..." />;

  return (
    <div>
      <PageHeader
        title="Form fields master"
        subtitle="Reusable field library - insert these into any service's form from the Form designer"
        action={<Button onClick={openNew}><Plus size={15} aria-hidden="true" /> Add field</Button>}
      />
      <ErrorBanner message={error} />

      <Card>
        <Table
          emptyText="No master fields yet"
          columns={[
            { key: "label", header: "Label" },
            { key: "fieldKey", header: "Field key" },
            { key: "type", header: "Type", render: (f) => <Badge>{f.type}</Badge> },
            { key: "defaultRequired", header: "Default", render: (f) => f.defaultRequired ? <Badge tone="warning">required</Badge> : <Badge>optional</Badge> },
            { key: "systemDefined", header: "Source", render: (f) => f.systemDefined ? <Badge tone="success">system</Badge> : <Badge>custom</Badge> },
            { key: "active", header: "Status", render: (f) => <Badge tone={f.active ? "success" : "default"}>{f.active ? "Active" : "Inactive"}</Badge> },
            {
              key: "actions",
              header: "",
              render: (f) => (
                <div className="flex items-center gap-2">
                  <button className="text-slate-400 hover:text-blue-700" onClick={() => openEdit(f)}><Pencil size={14} aria-hidden="true" /></button>
                  <button className="text-slate-400 hover:text-red-600" onClick={() => remove(f)} title={f.systemDefined ? "Deactivate (system fields can't be deleted)" : "Delete"}>
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              ),
            },
          ]}
          rows={fields}
        />
      </Card>

      <SlideOver open={!!panel} title={panel?.id ? "Edit master field" : "Add master field"} onClose={() => setPanel(null)}>
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="flex flex-1 flex-col gap-4">
            <Input label="Field key" value={form.fieldKey} onChange={(e) => setForm({ ...form, fieldKey: e.target.value })} required disabled={panel?.systemDefined} />
            <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            {form.type === "DROPDOWN" && (
              <Input label="Options (comma-separated)" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
            )}
            <Toggle checked={form.defaultRequired} onChange={(v) => setForm({ ...form, defaultRequired: v })} label="Required by default" />
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
          </div>
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setPanel(null)}>Cancel</Button>
            <Button type="submit" className="flex-1 justify-center">{panel?.id ? "Save changes" : "Add field"}</Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
