"use client";

import { useState } from "react";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Field, FormActions, FormCard, Select, TextInput } from "@/components/ui/Field";
import { useAssignRole, useRevokeAssignment, useRoles, useStaffMember } from "@/hooks/useAccess";
import { useAnbiyams, useMandalams } from "@/hooks/useStructure";
import type { Anbiyam, Mandalam, Role, RoleAssignment } from "@/src/types";

const roleOf = (a: RoleAssignment) =>
  typeof a.role_id === "string" ? { _id: a.role_id, name: a.role_id, key: "" } : a.role_id;

function ScopeSummary({ a, mandalams, anbiyams }: {
  a: RoleAssignment;
  mandalams: Mandalam[];
  anbiyams: Anbiyam[];
}) {
  if (a.scope_mandalam_ids?.length) {
    const names = a.scope_mandalam_ids.map(
      (id) => mandalams.find((m) => m._id === id)?.name ?? id.slice(-6),
    );
    return <span className="text-xs text-slate-500">Mandalams: {names.join(", ")}</span>;
  }
  if (a.scope_anbiyam_ids?.length) {
    const names = a.scope_anbiyam_ids.map(
      (id) => anbiyams.find((x) => x._id === id)?.code ?? id.slice(-6),
    );
    return <span className="text-xs text-slate-500">Anbiyams: {names.join(", ")}</span>;
  }
  return <span className="text-xs text-slate-500">Whole parish</span>;
}

/**
 * One user's access.
 *
 * `effective_permissions` is resolved server-side as the union of every active
 * assignment — showing the roles alone would not answer "what can this person
 * actually do", which is the question being asked on this screen.
 */
export default function StaffDetailView({ userId }: { userId: string }) {
  const { data, isLoading } = useStaffMember(userId);
  const { data: rolesRes } = useRoles();
  const { data: mandalamRes } = useMandalams();
  const { data: anbiyamRes } = useAnbiyams();
  const assign = useAssignRole();
  const revoke = useRevokeAssignment(userId);

  const [roleId, setRoleId] = useState("");
  const [scopeType, setScopeType] = useState<"parish" | "mandalam" | "anbiyam">("parish");
  const [scopeIds, setScopeIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const user = data?.data;
  const roles = ((rolesRes?.data ?? []) as Role[]).filter((r) => r.status === "active");
  const mandalams = (mandalamRes?.data ?? []) as Mandalam[];
  const anbiyams = (anbiyamRes?.data ?? []) as Anbiyam[];

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!user) return <p className="text-sm text-slate-500">User not found.</p>;

  const active = (user.assignments ?? []).filter((a) => a.status === "active");
  const past = (user.assignments ?? []).filter((a) => a.status !== "active");
  const selectedRole = roles.find((r) => r._id === roleId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!roleId) return setError("Pick a role.");

    const res = await assign.mutateAsync({
      user_id: userId,
      role_id: roleId,
      ...(scopeType === "mandalam" ? { scope_mandalam_ids: scopeIds } : {}),
      ...(scopeType === "anbiyam" ? { scope_anbiyam_ids: scopeIds } : {}),
      note: note.trim() || undefined,
    });
    if (!res.success) setError(res.message);
    else {
      setRoleId("");
      setScopeIds([]);
      setNote("");
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <FormCard title="Account">
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Name</dt>
              <dd className="font-semibold">{user.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Phone</dt>
              <dd>{user.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account type</dt>
              <dd>{user.account_type.replace("_", " ")}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</dt>
              <dd>
                <StatusPill
                  label={user.status.replace("_", " ")}
                  tone={user.status === "active" ? "success" : user.status === "not_registered" ? "warning" : "neutral"}
                />
              </dd>
            </div>
          </dl>
          {user.status === "not_registered" && (
            <p className="text-xs text-slate-500">
              The account exists but nobody has logged into it. It becomes active on first OTP verification.
            </p>
          )}
        </FormCard>

        <FormCard title={`Active roles (${active.length})`}>
          {active.length === 0 ? (
            <p className="text-sm text-slate-500">
              No roles. This account can sign in and see nothing.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "#e2e8f0" }}>
              {active.map((a) => (
                <li key={a._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "#0D5C63" }}>
                      {roleOf(a).name}
                    </p>
                    <ScopeSummary a={a} mandalams={mandalams} anbiyams={anbiyams} />
                    {a.note && <p className="text-xs text-slate-500 mt-0.5">{a.note}</p>}
                  </div>
                  <ConfirmDialog
                    trigger={
                      <button className="text-xs font-bold shrink-0" style={{ color: "#dc2626" }}>
                        Revoke
                      </button>
                    }
                    title={`Revoke ${roleOf(a).name}?`}
                    message="The assignment is marked revoked rather than deleted, so the trail of who held what and when survives."
                    confirmLabel="Revoke"
                    onConfirm={async () => {
                      const res = await revoke.mutateAsync(a._id);
                      if (!res.success) setError(res.message);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </FormCard>

        {past.length > 0 && (
          <FormCard title={`Past assignments (${past.length})`}>
            <ul className="space-y-2 text-sm">
              {past.map((a) => (
                <li key={a._id} className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">{roleOf(a).name}</span>
                  <span className="text-xs text-slate-400">
                    {a.status}
                    {a.revoked_on ? ` · ${new Date(a.revoked_on).toLocaleDateString()}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </FormCard>
        )}

        <FormCard
          title={`Effective permissions (${user.effective_permissions?.length ?? 0})`}
          description="The union of every active role. This is what the API will actually allow."
        >
          {(user.effective_permissions ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">None.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {user.effective_permissions.map((p) => (
                <span
                  key={p}
                  className="px-2 py-1 rounded text-[11px] font-mono"
                  style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </FormCard>
      </div>

      <div className="lg:col-span-1">
        <form onSubmit={submit}>
          <FormCard
            title="Grant a role"
            description="You can only grant permissions you hold yourself — the API rejects anything beyond your own access."
          >
            <Field label="Role" required>
              <Select value={roleId} onChange={(e) => { setRoleId(e.target.value); setScopeIds([]); }}>
                <option value="">Select a role…</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} {r.kind === "system" ? "(system)" : ""}
                  </option>
                ))}
              </Select>
            </Field>

            {selectedRole && (
              <p className="text-xs text-slate-500">
                {selectedRole.permissions.length} permissions · narrowest scope: {selectedRole.scope_level}
              </p>
            )}

            <Field label="Scope" hint="Narrow the role to particular zones, or leave it parish-wide.">
              <Select
                value={scopeType}
                onChange={(e) => {
                  setScopeType(e.target.value as typeof scopeType);
                  setScopeIds([]);
                }}
              >
                <option value="parish">Whole parish</option>
                <option value="mandalam">Selected Mandalams</option>
                <option value="anbiyam">Selected Anbiyams</option>
              </Select>
            </Field>

            {scopeType !== "parish" && (
              <Field label={scopeType === "mandalam" ? "Mandalams" : "Anbiyams"}>
                <select
                  multiple
                  size={6}
                  value={scopeIds}
                  onChange={(e) =>
                    setScopeIds(Array.from(e.target.selectedOptions, (o) => o.value))
                  }
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "#dce3e9" }}
                >
                  {(scopeType === "mandalam" ? mandalams : anbiyams).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.code} — {s.name || s.name_ta || "Unnamed"}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Note">
              <TextInput
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this was granted"
              />
            </Field>

            <FormActions submitting={assign.isPending} submitLabel="Grant role" error={error} />
          </FormCard>
        </form>
      </div>
    </div>
  );
}
