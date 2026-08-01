import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { usersApi, rolesApi, boardsApi, departmentsApi } from "../api/client";
import {
  Pencil, UserPlus, MessageSquare, Lock, LockOpen, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Small helpers ────────────────────────────────────────────────────────

function Avatar({ name }) {
  const initials = (name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  const palette = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  return (
    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${palette[(initials.charCodeAt(0) || 0) % palette.length]}`}>
      {initials}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${active ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-600"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RolePill({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
      {label}
    </span>
  );
}

function BoardPill({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
      {label}
    </span>
  );
}

function DeptPill({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-600">
      {label}
    </span>
  );
}

function IconBtn({ onClick, title, icon: Icon, danger = false }) {
  return (
    <button onClick={onClick} title={title}
      className={`rounded p-1.5 transition-colors ${danger ? "text-red-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}>
      <Icon size={15} />
    </button>
  );
}

// ── Floating label input ──────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div className="relative">
      <label className={`absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 z-10 ${required ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 bg-white focus:border-blue-500 focus:outline-none placeholder:text-slate-300";
const selectCls = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 bg-white focus:border-blue-500 focus:outline-none";

// ── Add / Edit User Modal ─────────────────────────────────────────────────

function UserModal({ user, roles, boards, userRoles, onClose, onSaved }) {
  const isEdit = !!user;

  const primaryRole = userRoles?.[0];

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    username: user?.username || "",
    employeeCode: user?.employeeCode || "",
    userType: user?.userType || "INTERNAL",
    active: user?.active !== false,
    password: "",
    roleId: primaryRole?.roleId || "",
    boardId: primaryRole?.boardId || "",
    departmentId: primaryRole?.departmentId || "",
  });
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (form.boardId) departmentsApi.list(form.boardId).then(setDepartments).catch(() => {});
    else setDepartments([]);
  }, [form.boardId]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, name: [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ") };
      if (isEdit) {
        await usersApi.update(user.id, payload);
        // If role changed and a role is selected, assign it
        if (form.roleId && form.roleId !== primaryRole?.roleId) {
          await usersApi.assignRole({ userId: user.id, roleId: form.roleId, boardId: form.boardId || null, departmentId: form.departmentId || null, serviceId: null });
        }
      } else {
        const created = await usersApi.create(payload);
        if (form.roleId) {
          await usersApi.assignRole({ userId: created.id, roleId: form.roleId, boardId: form.boardId || null, departmentId: form.departmentId || null, serviceId: null });
        }
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-8 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit User" : "Add New User"}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {/* Row 1: Employee Code | First Name | Middle Name */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Employee Code" required>
              <input value={form.employeeCode} onChange={e => set("employeeCode", e.target.value)}
                placeholder="EMP-0001" className={inputCls} />
            </Field>
            <Field label="First Name" required>
              <input required value={form.firstName} onChange={e => set("firstName", e.target.value)}
                placeholder="First Name" className={inputCls} />
            </Field>
            <Field label="Middle Name">
              <input value={form.middleName} onChange={e => set("middleName", e.target.value)}
                placeholder="Middle Name" className={inputCls} />
            </Field>
          </div>

          {/* Row 2: Last Name | Email | Mobile Number */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Last Name" required>
              <input required value={form.lastName} onChange={e => set("lastName", e.target.value)}
                placeholder="Last Name" className={inputCls} />
            </Field>
            <Field label="Email" required>
              <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="user@mhada.gov.in" className={inputCls} />
            </Field>
            <Field label="Mobile Number" required>
              <input required value={form.mobile} onChange={e => set("mobile", e.target.value)}
                placeholder="9876543210" className={inputCls} />
            </Field>
          </div>

          {/* Row 3: Username | New Password | User Type */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Username" required>
              <input required={!isEdit} value={form.username} onChange={e => set("username", e.target.value)}
                placeholder="john.doe" className={inputCls} />
            </Field>
            <div className="relative">
              <Field label="New Password" required={!isEdit}>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
                  placeholder="New Password" className={inputCls} />
              </Field>
              {isEdit && (
                <p className="mt-1 text-[10px] text-slate-400 leading-tight">
                  Current password is encrypted. Enter new password only if you want to change it.
                </p>
              )}
            </div>
            <Field label="User Type">
              <select value={form.userType} onChange={e => set("userType", e.target.value)} className={selectCls}>
                <option value="SYSTEM">System</option>
                <option value="INTERNAL">Internal</option>
                <option value="CITIZEN">Citizen</option>
              </select>
            </Field>
          </div>

          {/* Row 4: Status | Roles */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select value={form.active ? "ACTIVE" : "INACTIVE"} onChange={e => set("active", e.target.value === "ACTIVE")} className={selectCls}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
            <Field label="Roles">
              <select value={form.roleId} onChange={e => set("roleId", e.target.value)} className={selectCls}>
                <option value="">— Select role —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.displayName || r.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Row 5: Boards | Departments */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Boards">
              <select value={form.boardId} onChange={e => set("boardId", e.target.value)} className={selectCls}>
                <option value="">— Select board —</option>
                {boards.map(b => <option key={b.id} value={b.id}>{b.nameEnglish} ({b.shortName || b.nameEnglish})</option>)}
              </select>
            </Field>
            <Field label="Departments">
              <select value={form.departmentId} onChange={e => set("departmentId", e.target.value)} className={selectCls} disabled={!form.boardId}>
                <option value="">— Select department —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEnglish} ({d.shortName || d.nameEnglish})</option>)}
              </select>
            </Field>
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Assign Role Slide Panel ───────────────────────────────────────────────

function AssignRolePanel({ user, roles, boards, onClose }) {
  const [form, setForm] = useState({ roleId: "", boardId: "", departmentId: "" });
  const [departments, setDepartments] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    usersApi.rolesFor(user.id).then(setUserRoles).catch(() => {});
  }, [user.id]);

  useEffect(() => {
    if (form.boardId) departmentsApi.list(form.boardId).then(setDepartments).catch(() => {});
    else setDepartments([]);
  }, [form.boardId]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function assign(e) {
    e.preventDefault();
    if (!form.roleId) { setError("Select a role"); return; }
    setSaving(true);
    setError(null);
    try {
      await usersApi.assignRole({ userId: user.id, roleId: form.roleId, boardId: form.boardId || null, departmentId: form.departmentId || null, serviceId: null });
      const updated = await usersApi.rolesFor(user.id);
      setUserRoles(updated);
      setForm({ roleId: "", boardId: "", departmentId: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Manage Roles</h2>
            <p className="text-xs text-slate-500">{user.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned Roles</div>
            {userRoles.length === 0
              ? <p className="text-sm text-slate-400">No roles assigned yet</p>
              : <div className="space-y-1.5">
                  {userRoles.map(ur => (
                    <div key={ur.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <span className="text-sm font-semibold text-slate-700">{ur.roleDisplayName || ur.roleName}</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Active</span>
                    </div>
                  ))}
                </div>
            }
          </div>
          <div className="border-t border-slate-100 pt-5">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assign New Role</div>
            <form onSubmit={assign} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-600">Role *</label>
                <select value={form.roleId} onChange={e => set("roleId", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                  <option value="">— Select role —</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.displayName || r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">Board (optional)</label>
                <select value={form.boardId} onChange={e => set("boardId", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                  <option value="">All boards</option>
                  {boards.map(b => <option key={b.id} value={b.id}>{b.nameEnglish}</option>)}
                </select>
              </div>
              {departments.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Department (optional)</label>
                  <select value={form.departmentId} onChange={e => set("departmentId", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                    <option value="">All departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameEnglish}</option>)}
                  </select>
                </div>
              )}
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={saving}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Assigning…" : "Assign Role"}
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-slate-100 p-4">
          <button onClick={onClose} className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [boards, setBoards] = useState([]);
  const [boardMap, setBoardMap] = useState({});
  const [deptMap, setDeptMap] = useState({});
  const [userRolesMap, setUserRolesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [addModal, setAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [rolePanel, setRolePanel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, r, b, allDepts] = await Promise.all([
        usersApi.list(),
        rolesApi.list(),
        boardsApi.list(),
        departmentsApi.list(),
      ]);
      setUsers(u);
      setRoles(r);
      setBoards(b);

      const bm = {};
      b.forEach(x => { bm[x.id] = x.nameEnglish; });
      setBoardMap(bm);

      const dm = {};
      allDepts.forEach(x => { dm[x.id] = x.nameEnglish; });
      setDeptMap(dm);

      const entries = await Promise.all(
        u.map(user => usersApi.rolesFor(user.id).then(rs => [user.id, rs]).catch(() => [user.id, []]))
      );
      const rm = {};
      entries.forEach(([uid, rs]) => { rm[uid] = rs; });
      setUserRolesMap(rm);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(user) {
    try {
      const updated = await usersApi.toggleActive(user.id);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (e) {
      alert(e.message);
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`Delete user "${user.name}"? This will also remove all their role assignments.`)) return;
    try {
      await usersApi.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setUserRolesMap(prev => { const m = { ...prev }; delete m[user.id]; return m; });
    } catch (e) {
      alert(e.message);
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.employeeCode?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function goPage(p) { setPage(Math.max(0, Math.min(totalPages - 1, p))); }

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb + Header ── */}
      <div>
        <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-600">Dashboard</Link>
          <span>›</span>
          <span className="text-slate-500">User Management</span>
          <span>›</span>
          <span className="font-medium text-slate-700">Users</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <span className="text-base leading-none">+</span> Add New User
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* ── User Table card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Card header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-bold text-slate-800">User Table</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search…"
                className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-blue-400 focus:outline-none w-48" />
            </div>
            {!loading && (
              <span className="text-xs text-slate-400">
                Showing {filtered.length} of {users.length} users
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <div className="text-3xl mb-2">👤</div>
            <div className="font-medium text-slate-600">{search ? "No users match your search" : "No users yet"}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Full Name", "Username", "Employee Code", "Status", "Roles", "Boards", "Departments", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageSlice.map(user => {
                  const urs = userRolesMap[user.id] || [];
                  const uniqueRoleLabels = [...new Map(urs.map(r => [r.roleId, r.roleDisplayName || r.roleName])).values()];
                  const uniqueBoardIds   = [...new Set(urs.map(r => r.boardId).filter(Boolean))];
                  const uniqueDeptIds    = [...new Set(urs.map(r => r.departmentId).filter(Boolean))];

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">

                      {/* Full Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 text-sm truncate max-w-[160px]">{user.name}</div>
                            {user.email && <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{user.email}</div>}
                            <div className="text-[11px] text-slate-400">{user.mobile}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{user.username || "—"}</td>

                      {/* Employee Code */}
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap font-mono">{user.employeeCode || "—"}</td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge active={user.active} /></td>

                      {/* Roles */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {uniqueRoleLabels.length === 0
                            ? <span className="text-xs text-slate-300">—</span>
                            : uniqueRoleLabels.map(label => <RolePill key={label} label={label} />)
                          }
                        </div>
                      </td>

                      {/* Boards */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {uniqueBoardIds.length === 0
                            ? <span className="text-xs text-slate-300">—</span>
                            : uniqueBoardIds.map(bid => <BoardPill key={bid} label={boardMap[bid] || bid} />)
                          }
                        </div>
                      </td>

                      {/* Departments */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {uniqueDeptIds.length === 0
                            ? <span className="text-xs text-slate-300">—</span>
                            : uniqueDeptIds.map(did => <DeptPill key={did} label={deptMap[did] || did} />)
                          }
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 whitespace-nowrap">
                          <IconBtn icon={Pencil} title="Edit user" onClick={() => setEditUser(user)} />
                          <IconBtn icon={UserPlus} title="Assign role" onClick={() => setRolePanel(user)} />
                          <IconBtn icon={MessageSquare} title="Message (coming soon)" onClick={() => alert("Messaging feature coming soon")} />
                          {user.active
                            ? <IconBtn icon={Lock} title="Deactivate" onClick={() => toggleActive(user)} />
                            : <IconBtn icon={LockOpen} title="Activate" onClick={() => toggleActive(user)} />
                          }
                          <IconBtn icon={Trash2} title="Delete user" danger onClick={() => deleteUser(user)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-400">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} users
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => goPage(page - 1)} disabled={page === 0}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => goPage(i)}
                  className={`h-7 w-7 rounded text-xs font-semibold ${i === page ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => goPage(page + 1)} disabled={page >= totalPages - 1}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                <ChevronRight size={15} />
              </button>
              <span className="ml-3 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">{PAGE_SIZE} / page</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {addModal && (
        <UserModal roles={roles} boards={boards} userRoles={[]}
          onClose={() => setAddModal(false)} onSaved={() => { setAddModal(false); load(); }} />
      )}
      {editUser && (
        <UserModal user={editUser} roles={roles} boards={boards} userRoles={userRolesMap[editUser.id] || []}
          onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); load(); }} />
      )}
      {rolePanel && (
        <AssignRolePanel user={rolePanel} roles={roles} boards={boards} onClose={() => { setRolePanel(null); load(); }} />
      )}
    </div>
  );
}
