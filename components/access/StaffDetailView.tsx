"use client";

import { useState } from "react";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Field, FormActions, FormCard, Select, TamilTextInput, TextInput } from "@/components/ui/Field";
import { useAssignRole, useRevokeAssignment, useRoles, useSendStaffInvite, useStaffMember } from "@/hooks/useAccess";
import { useAnbiyams, useMandalams } from "@/hooks/useStructure";
import { useSession } from "@/src/session/SessionProvider";
import type { Anbiyam, Mandalam, Role, RoleAssignment } from "@/src/types";
import { userStatusTone } from "@/src/lib/domain-labels";
import { formatDate } from "@/lib/utils";

const roleOf = (a: RoleAssignment) =>
  typeof a.role_id === "string" ? { _id: a.role_id, name: a.role_id, key: "" } : a.role_id;

/** The Anbiyams a role carries, when it carries any. */
function roleScopeOf(a: RoleAssignment): string[] {
  const role = a.role_id;
  return typeof role === "string" ? [] : (role.scope_anbiyam_ids ?? []);
}

function codesOf(ids: string[], anbiyams: Anbiyam[]) {
  return ids.map((id) => anbiyams.find((x) => x._id === id)?.code ?? id.slice(-6)).join(", ");
}

function ScopeSummary({ a, mandalams, anbiyams }: {
  a: RoleAssignment;
  mandalams: Mandalam[];
  anbiyams: Anbiyam[];
}) {
  // The role's own Anbiyams first: assignRole leaves the assignment's lists
  // empty for a scoped role, so reading those would report "Whole parish" for
  // the most tightly scoped grant on the page.
  const fromRole = roleScopeOf(a);
  if (fromRole.length) {
    return (
      <span className="text-xs text-slate-500">
        Anbiyams: {codesOf(fromRole, anbiyams)}{" "}
        <span className="text-slate-400">(from the role)</span>
      </span>
    );
  }
  if (a.scope_mandalam_ids?.length) {
    const names = a.scope_mandalam_ids.map(
      (id) => mandalams.find((m) => m._id === id)?.name ?? id.slice(-6),
    );
    return <span className="text-xs text-slate-500">Mandalams: {names.join(", ")}</span>;
  }
  if (a.scope_anbiyam_ids?.length) {
    return <span className="text-xs text-slate-500">Anbiyams: {codesOf(a.scope_anbiyam_ids, anbiyams)}</span>;
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
/**
 * Whether this account can actually sign in, and the button that fixes it.
 *
 * password_set_at is the only honest signal: an account can be active and still
 * have no password if it was created before email sign-in existed.
 */
function AccountStatus({
  staff,
  onInvite,
  sending,
  result,
}: {
  staff: { email?: string | null; invited_at?: string | null; password_set_at?: string | null };
  onInvite: (email?: string) => void;
  sending: boolean;
  result?: { success: boolean; message: string; data?: { delivered?: boolean } };
}) {
  const [email, setEmail] = useState(staff.email ?? "");

  const state = staff.password_set_at
    ? { label: "Active", tone: "#166534", note: "They have set a password and can sign in." }
    : staff.invited_at
      ? {
          label: "Invited",
          tone: "#92400e",
          note: `Invitation sent ${formatDate(staff.invited_at)}. It expires seven days after that.`,
        }
      : { label: "Never invited", tone: "#991b1b", note: "They cannot sign in until an invitation is sent." };

  return (
    <div className="rounded-lg border border-slate-200 p-4 space-y-3">
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: state.tone }}>
        {state.label}
      </span>
      <p className="text-xs text-slate-500">{state.note}</p>

      {!staff.email && (
        <Field label="Email" hint="This account was created before email sign-in. Add an address to invite them.">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      )}

      <button
        type="button"
        disabled={sending || (!staff.email && !email.trim())}
        onClick={() => onInvite(staff.email ? undefined : email.trim())}
        className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60 cursor-pointer"
        style={{ backgroundColor: "#0d5c63" }}
      >
        {sending ? "Sending…" : staff.invited_at ? "Resend invite" : "Send invite"}
      </button>
      <p className="text-xs text-slate-400">
        Sending a new invitation stops the previous link working.
      </p>
      {result && (
        <p
          className="text-xs"
          // Delivery, not HTTP status: the request succeeds even when the mail
          // server is down, and a green "could not be sent" reads as success.
          style={{ color: result.success && result.data?.delivered ? "#166534" : "#991b1b" }}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}

export default function StaffDetailView({ userId }: { userId: string }) {
  const { user: signedIn } = useSession();
  // Your own page. You may read it — knowing what you hold is not a privilege —
  // but every control that would change it is gone, because the server now
  // refuses a grant or a revoke whose subject is the caller. Leaving the
  // buttons would just produce a refusal on click.
  const isSelf = signedIn?.id === userId;
  const { data, isLoading } = useStaffMember(userId);
  const { data: rolesRes } = useRoles();
  const { data: mandalamRes } = useMandalams();
  const { data: anbiyamRes } = useAnbiyams();
  const assign = useAssignRole();
  const revoke = useRevokeAssignment(userId);
  const invite = useSendStaffInvite(userId);

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
  const roleCarriesScope = (selectedRole?.scope_anbiyam_ids?.length ?? 0) > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!roleId) return setError("Pick a role.");

    const res = await assign.mutateAsync({
      user_id: userId,
      role_id: roleId,
      ...(roleCarriesScope || scopeType !== "mandalam" ? {} : { scope_mandalam_ids: scopeIds }),
      ...(roleCarriesScope || scopeType !== "anbiyam" ? {} : { scope_anbiyam_ids: scopeIds }),
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
              {/* The address they sign in with. It was in this payload all
                  along — AccountStatus below reads it to decide whether to ask
                  for one — but nothing ever put it on the screen, so the page
                  could not answer "which address does this person use". */}
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</dt>
              <dd className="break-all">{user.email ?? "—"}</dd>
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
                  tone={userStatusTone(user.status)}
                />
              </dd>
            </div>
          </dl>
          {user.account_type !== "parishioner" && (
            <AccountStatus
              staff={user}
              sending={invite.isPending}
              result={invite.data}
              onInvite={(email) => invite.mutate(email)}
            />
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
                  {!isSelf && (
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
                  )}
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
                    {a.revoked_on ? ` · ${formatDate(a.revoked_on)}` : ""}
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
        {isSelf ? (
          <FormCard title="Your own access">
            <p className="text-sm text-slate-600">
              This is your account, so the roles above are shown for reference only.
            </p>
            <p className="text-sm text-slate-600">
              Nobody changes their own access, however senior they are — granting
              yourself a role would leave no one but you in the trail. Ask a super
              admin to add or remove one.
            </p>
          </FormCard>
        ) : (
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
                {selectedRole.permissions.length} permissions
              </p>
            )}

            {/* A role that names its own Anbiyams IS the scope, so there is
                nothing to choose here — showing a picker that the server would
                refuse would only look like a broken form. */}
            {roleCarriesScope ? (
              <Field label="Scope" hint="Set on the role itself. Edit the role to change it.">
                <p
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#dce3e9", backgroundColor: "#f0fdfc", color: "#0D5C63" }}
                >
                  {codesOf(selectedRole!.scope_anbiyam_ids, anbiyams)}
                </p>
              </Field>
            ) : (
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
            )}

            {!roleCarriesScope && scopeType !== "parish" && (
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

            <Field label="Note" lang="tamil">
              <TamilTextInput
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this was granted"
              />
            </Field>

            <FormActions submitting={assign.isPending} submitLabel="Grant role" error={error} />
          </FormCard>
        </form>
        )}
      </div>
    </div>
  );
}
