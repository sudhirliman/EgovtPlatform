import React, { useEffect, useState } from "react";
import { usersApi, rolesApi, permissionsApi, boardsApi } from "../api/client";
import { PageHeader, Card, Button, Input, Select, ErrorBanner, LoadingRow, Badge } from "../components/ui.jsx";

export default function UsersRolesPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newUser, setNewUser] = useState({ name: "", username: "", mobile: "", email: "", password: "" });
  const [newRole, setNewRole] = useState({ name: "", hasGlobalScope: false, permissionIds: [] });
  const [assign, setAssign] = useState({ userId: "", roleId: "", boardId: "" });

  async function loadAll() {
    const [u, r, p, b] = await Promise.all([usersApi.list(), rolesApi.list(), permissionsApi.list(), boardsApi.list()]);
    setUsers(u);
    setRoles(r);
    setPermissions(p);
    setBoards(b);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadAll();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    try {
      await usersApi.create(newUser);
      setNewUser({ name: "", username: "", mobile: "", email: "", password: "" });
      await loadAll();
    } catch (e) {
      setError(e.message);
    }
  }

  async function createRole(e) {
    e.preventDefault();
    try {
      await rolesApi.create(newRole);
      setNewRole({ name: "", hasGlobalScope: false, permissionIds: [] });
      await loadAll();
    } catch (e) {
      setError(e.message);
    }
  }

  async function assignRole(e) {
    e.preventDefault();
    if (!assign.userId || !assign.roleId) return setError("Pick both a user and a role");
    try {
      await usersApi.assignRole({
        userId: assign.userId,
        roleId: assign.roleId,
        boardId: assign.boardId || null,
        departmentId: null,
        serviceId: null,
      });
      setAssign({ userId: "", roleId: "", boardId: "" });
    } catch (e) {
      setError(e.message);
    }
  }

  function togglePermission(id) {
    setNewRole((r) => ({
      ...r,
      permissionIds: r.permissionIds.includes(id) ? r.permissionIds.filter((p) => p !== id) : [...r.permissionIds, id],
    }));
  }

  if (loading) return <LoadingRow label="Loading users & roles..." />;

  return (
    <div>
      <PageHeader title="Users & roles" subtitle="RBAC: users, roles, permissions, and scope assignment" />
      <ErrorBanner message={error} />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="mb-3 text-[13px] font-medium text-slate-900">Users</div>
          <form onSubmit={createUser} className="mb-3 flex flex-col gap-2">
            <Input placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
            <Input placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
            <Input placeholder="Mobile" value={newUser.mobile} onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })} required />
            <Input placeholder="Email (optional)" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <Input placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            <Button type="submit">Add user</Button>
          </form>
          <div className="flex flex-col gap-1">
            {users.map((u) => (
              <div key={u.id} className="rounded-md px-2 py-1.5 text-[13px] hover:bg-slate-50">
                {u.name} <span className="text-slate-400">({u.username ? `@${u.username}, ` : ""}{u.mobile})</span>
              </div>
            ))}
            {users.length === 0 && <div className="py-4 text-center text-[13px] text-slate-400">No users yet</div>}
          </div>
        </Card>

        <Card>
          <div className="mb-3 text-[13px] font-medium text-slate-900">Roles</div>
          <form onSubmit={createRole} className="mb-3 flex flex-col gap-2">
            <Input placeholder="Role name" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} required />
            <label className="flex items-center gap-2 text-[13px] text-slate-600">
              <input
                type="checkbox"
                checked={newRole.hasGlobalScope}
                onChange={(e) => setNewRole({ ...newRole, hasGlobalScope: e.target.checked })}
              />
              Global scope (helpdesk-style, bypasses board/department/service)
            </label>
            <div className="max-h-32 overflow-y-auto rounded-md border border-slate-200 p-2">
              {permissions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-0.5 text-[12px] text-slate-600">
                  <input type="checkbox" checked={newRole.permissionIds.includes(p.id)} onChange={() => togglePermission(p.id)} />
                  {p.code}
                </label>
              ))}
            </div>
            <Button type="submit">Add role</Button>
          </form>
          <div className="flex flex-col gap-1">
            {roles.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-[13px]">
                {r.name}
                {r.hasGlobalScope && <Badge tone="warning">global scope</Badge>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 text-[13px] font-medium text-slate-900">Assign role to user</div>
          <form onSubmit={assignRole} className="flex flex-col gap-2">
            <Select value={assign.userId} onChange={(e) => setAssign({ ...assign, userId: e.target.value })}>
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
            <Select value={assign.roleId} onChange={(e) => setAssign({ ...assign, roleId: e.target.value })}>
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
            <Select
              label="Scope to board (optional - leave blank for all boards)"
              value={assign.boardId}
              onChange={(e) => setAssign({ ...assign, boardId: e.target.value })}
            >
              <option value="">All boards</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>{b.nameEnglish}</option>
              ))}
            </Select>
            <Button type="submit">Assign</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
