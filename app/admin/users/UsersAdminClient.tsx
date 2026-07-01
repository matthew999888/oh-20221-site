"use client";

import { useState, useTransition } from "react";
import { approveUser, denyUser, updateUserRoles } from "./_actions";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved";
  createdAt: string;
  roleIds: string[];
};

export type RoleOption = { id: string; name: string; slug: string; kind: string };

export type ActivityLogEntry = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  userName: string | null;
};

export default function UsersAdminClient({
  initialUsers,
  roles,
  activityLog,
  canEdit
}: {
  initialUsers: AdminUser[];
  roles: RoleOption[];
  activityLog: ActivityLogEntry[];
  canEdit: boolean;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "approved" } : u)));
    });
  }

  function handleDenyPending(id: string) {
    if (!confirm("Deny this pending request? The account will be deleted.")) return;
    startTransition(async () => {
      await denyUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    });
  }

  function handleRevokeApproved(id: string) {
    if (!confirm("Revoke this member's access? Their roles will be cleared and the account moved back to pending.")) return;
    startTransition(async () => {
      await denyUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "pending", roleIds: [] } : u)));
    });
  }

  function handleRolesChange(id: string, roleIds: string[]) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, roleIds } : u)));
    startTransition(async () => {
      await updateUserRoles(id, roleIds);
    });
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">User Management</h1>
      <p className="dash-page__subtitle">Approve new accounts, assign roles, and review the activity log.</p>

      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>Pending Approval ({pending.length})</h2>
        </header>
        {pending.length === 0 ? (
          <p className="content-block__empty">No accounts waiting on approval.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Requested</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    {canEdit && (
                      <td>
                        <div className="content-box__controls">
                          <button className="btn-small btn-small--primary" disabled={isPending} onClick={() => handleApprove(u.id)}>
                            Approve
                          </button>
                          <button className="btn-small" disabled={isPending} onClick={() => handleDenyPending(u.id)}>
                            Deny
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>All Members ({approved.length})</h2>
        </header>
        {approved.length === 0 ? (
          <p className="content-block__empty">No approved members yet.</p>
        ) : (
          <div className="user-role-grid">
            {approved.map((u) => (
              <article className="user-role-card" key={u.id}>
                <div className="user-role-card__header">
                  <div>
                    <strong>{u.name}</strong>
                    <p className="dash-list__meta">{u.email}</p>
                  </div>
                  {canEdit && (
                    <button className="btn-small" disabled={isPending} onClick={() => handleRevokeApproved(u.id)}>
                      Revoke
                    </button>
                  )}
                </div>
                <RoleCheckboxes
                  roles={roles}
                  selected={u.roleIds}
                  disabled={!canEdit || isPending}
                  onChange={(roleIds) => handleRolesChange(u.id, roleIds)}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>Activity Log</h2>
        </header>
        {activityLog.length === 0 ? (
          <p className="content-block__empty">No activity recorded yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    <td>{entry.userName ?? "—"}</td>
                    <td>{entry.action}</td>
                    <td>
                      {entry.targetType
                        ? `${entry.targetType}${entry.targetId ? ` · ${entry.targetId.slice(0, 8)}…` : ""}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function RoleCheckboxes({
  roles,
  selected,
  disabled,
  onChange
}: {
  roles: RoleOption[];
  selected: string[];
  disabled: boolean;
  onChange: (roleIds: string[]) => void;
}) {
  function toggle(roleId: string) {
    if (disabled) return;
    const next = selected.includes(roleId) ? selected.filter((id) => id !== roleId) : [...selected, roleId];
    onChange(next);
  }

  const groups: { label: string; kind: string }[] = [
    { label: "Base", kind: "basic" },
    { label: "Admin", kind: "admin" },
    { label: "Departments", kind: "department" },
    { label: "LDR Teams", kind: "ldr" }
  ];

  return (
    <div className="role-checkbox-groups">
      {groups.map((g) => {
        const groupRoles = roles.filter((r) => r.kind === g.kind);
        if (groupRoles.length === 0) return null;
        return (
          <div className="role-checkbox-group" key={g.kind}>
            <p className="dash-sidebar__section-label">{g.label}</p>
            <div className="role-checkbox-group__items">
              {groupRoles.map((r) => (
                <label key={r.id} className={`role-chip${selected.includes(r.id) ? " is-selected" : ""}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    disabled={disabled}
                    onChange={() => toggle(r.id)}
                  />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
