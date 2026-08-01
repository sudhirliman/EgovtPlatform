import React, { useEffect, useState, useCallback } from "react";
import { rolesApi, permissionsApi } from "../api/client";

// ── Permission chips ──────────────────────────────────────────────────────

function PermChips({ codes = [], max = 6 }) {
  const visible = codes.slice(0, max);
  const rest = codes.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(c => (
        <span key={c} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          {c}
        </span>
      ))}
      {rest > 0 && (
        <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          +{rest} more
        </span>
      )}
    </div>
  );
}

// ── Floating label field helper ───────────────────────────────────────────

function RField({ label, required, children }) {
  return (
    <div className="relative">
      <label className={`absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-slate-500 z-10 ${required ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

const rinput = "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 focus:border-violet-500 focus:outline-none";

// ── Toggle switch ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-violet-600" : "bg-slate-300"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

// ── Add / Edit Role Modal ─────────────────────────────────────────────────

function RoleModal({ role, permissions, onClose, onSaved }) {
  const isEdit = !!role;
  const [form, setForm] = useState({
    name: role?.name || "",
    displayName: role?.displayName || "",
    description: role?.description || "",
    level: role?.level ?? 99,
    hasGlobalScope: role?.hasGlobalScope || false,
    active: true,
    permissionIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (role?.permissionCodes) {
      const ids = permissions.filter(p => role.permissionCodes.includes(p.code)).map(p => p.id);
      setForm(f => ({ ...f, permissionIds: ids }));
    }
  }, [role, permissions]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function togglePerm(id) {
    setForm(f => ({
      ...f,
      permissionIds: f.permissionIds.includes(id)
        ? f.permissionIds.filter(x => x !== id)
        : [...f.permissionIds, id],
    }));
  }

  function selectAll() { setForm(f => ({ ...f, permissionIds: permissions.map(p => p.id) })); }
  function clearAll() { setForm(f => ({ ...f, permissionIds: [] })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await rolesApi.update(role.id, form);
      } else {
        await rolesApi.create(form);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-8 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5">
          <h2 className="text-xl font-bold text-slate-900">{isEdit ? "Update Role" : "Add New Role"}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">

          {/* Row 1: Role Name | Display Name */}
          <div className="grid grid-cols-2 gap-5">
            <RField label="Role Name" required>
              <input required value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. ESTATE_MANAGER" className={rinput} />
            </RField>
            <RField label="Display Name" required>
              <input required value={form.displayName} onChange={e => set("displayName", e.target.value)}
                placeholder="e.g. Estate Manager" className={rinput} />
            </RField>
          </div>

          {/* Row 2: Hierarchy Level | Active toggle */}
          <div className="grid grid-cols-2 gap-5 items-center">
            <RField label="Hierarchy Level">
              <input type="number" value={form.level} onChange={e => set("level", parseInt(e.target.value) || 99)}
                className={rinput} />
            </RField>
            <div className="flex items-center gap-3 pl-1">
              <Toggle checked={form.active} onChange={v => set("active", v)} />
              <span className="text-sm font-medium text-slate-700">Active</span>
            </div>
          </div>

          {/* Description */}
          <RField label="Description">
            <textarea rows={4} value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Brief description of this role's responsibilities"
              className={`${rinput} resize-none`} />
          </RField>

          {/* Global scope */}
          <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
            <Toggle checked={form.hasGlobalScope} onChange={v => set("hasGlobalScope", v)} />
            <span>Global scope <span className="text-slate-400">(bypasses board / department scoping)</span></span>
          </label>

          {/* Permissions */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Permissions</h3>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll}
                  className="text-[11px] font-semibold text-violet-600 hover:text-violet-800">Select All</button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={clearAll}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700">Clear</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {permissions.map(p => {
                const selected = form.permissionIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePerm(p.id)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      selected
                        ? "bg-violet-600 text-white hover:bg-violet-700"
                        : "border border-slate-300 bg-white text-slate-500 hover:border-violet-400 hover:text-violet-600"
                    }`}
                  >
                    {p.code}
                  </button>
                );
              })}
            </div>
            {permissions.length === 0 && (
              <p className="text-sm text-slate-400">No permissions configured</p>
            )}
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-violet-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
              {saving ? "Saving…" : isEdit ? "Update" : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | 'add' | {role object for edit}

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([rolesApi.list(), permissionsApi.list()]);
      setRoles(r.sort((a, b) => a.level - b.level));
      setPermissions(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteRole(id, name) {
    if (!window.confirm(`Delete role "${name}"? This cannot be undone.`)) return;
    try {
      await rolesApi.delete(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {loading ? "…" : roles.length} roles configured
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Super Admin can manage roles and permission mappings.
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <span className="text-lg leading-none">+</span> Add Role
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading roles…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Level", "Role Name", "Status", "Description", "Permissions", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-slate-500">{role.level}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{role.displayName || role.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{role.name}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 max-w-[200px]">
                    {role.description || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-4 max-w-[300px]">
                    <PermChips codes={role.permissionCodes} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal(role)}
                        className="rounded-lg p-1.5 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700"
                        title="Edit role"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteRole(role.id, role.name)}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete role"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <RoleModal
          role={modal === "add" ? null : modal}
          permissions={permissions}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
