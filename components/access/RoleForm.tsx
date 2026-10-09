"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Field, FormActions, FormCard, TamilTextArea, TamilTextInput, TextInput } from "@/components/ui/Field";
import RoleScopePicker, { resolveScope, scopeFromRole, type RoleScopeValue } from "@/components/access/RoleScopePicker";
import PermissionRow from "@/components/access/PermissionRow";
import { usePermissionCatalogue } from "@/hooks/useAccess";
import { useAnbiyams } from "@/hooks/useStructure";
import type { Anbiyam, ApiResponse, Role } from "@/src/types";
import type { RolePayload } from "@/actions/access.actions";

/**
 * A role name turned into its key.
 *
 * Punctuation becomes an underscore rather than surviving: copying a template
 * suggests "Faculty (copy)", and keeping the brackets produced the key
 * `faculty_(copy)`. The key goes into code and logs, so it stays to letters,
 * digits and underscores.
 */
function keyFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const AREA_LABEL: Record<string, string> = {
  parish: "Parish",
  structure: "Structure",
  family: "Families",
  member: "Members",
  visit: "Visits",
  request: "Change requests",
  register: "Sacramental registers",
  certificate: "Certificates",
  finance: "Offerings and funds",
  liturgy: "Mass intentions",
  comms: "Communication",
  access: "Roles and users",
};

/**
 * Role editor.
 *
 * A permission the signed-in user does not hold is shown but disabled: a
 * derived role may not exceed its parent, and the API rejects the save. Hiding
 * those rows would make the refusal inexplicable; greying them explains it.
 */
export default function RoleForm({
  initial,
  submitLabel,
  onSubmit,
  cancelHref,
}: {
  initial?: Partial<Role>;
  submitLabel: string;
  onSubmit: (payload: RolePayload) => Promise<ApiResponse<Role>>;
  cancelHref: string;
}) {
  const router = useRouter();
  const { data: catalogueRes, isLoading } = usePermissionCatalogue();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [values, setValues] = useState({
    // Derived here as well as in the Name field's onChange, because a copied
    // template arrives with a name already in it and that handler never fires —
    // which left Key, a required field, empty on every copy.
    key: initial?.key ?? (initial?.name ? keyFromName(initial.name) : ""),
    name: initial?.name ?? "",
    name_ta: initial?.name_ta ?? "",
    description: initial?.description ?? "",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set(initial?.permissions ?? []));

  const { data: anbiyamRes } = useAnbiyams();
  const anbiyams = useMemo(() => (anbiyamRes?.data ?? []) as Anbiyam[], [anbiyamRes]);

  // Held as the two lists the picker works in, and flattened to Anbiyam ids
  // only on submit. The saved role stores nothing about Mandalams.
  const [scope, setScope] = useState<RoleScopeValue>({ mandalam_ids: [], anbiyam_ids: [] });
  const savedScope = initial?.scope_anbiyam_ids;
  const [hydrated, setHydrated] = useState(false);
  if (!hydrated && anbiyams.length > 0 && savedScope && savedScope.length > 0) {
    // The Anbiyam list arrives after the first render, and the saved role holds
    // Anbiyams alone — the Mandalams they sit in have to be read back off them
    // before the picker can show anything.
    setScope(scopeFromRole(savedScope, anbiyams));
    setHydrated(true);
  }

  const groups = useMemo(() => catalogueRes?.data?.groups ?? [], [catalogueRes]);
  const grantable = useMemo(
    () => new Set(groups.flatMap((g) => g.permissions.filter((p) => p.grantable).map((p) => p.key))),
    [groups],
  );

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleArea(area: string, on: boolean) {
    const keys = groups.find((g) => g.area === area)?.permissions.filter((p) => p.grantable) ?? [];
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of keys) {
        if (on) next.add(p.key);
        else next.delete(p.key);
      }
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.name.trim()) return setError("Role name is required.");
    if (!values.key.trim()) return setError("Role key is required.");
    if (selected.size === 0) return setError("Pick at least one permission — a role with none does nothing.");

    setBusy(true);
    try {
      const res = await onSubmit({
        key: keyFromName(values.key),
        name: values.name.trim(),
        name_ta: values.name_ta.trim() || undefined,
        description: values.description.trim() || undefined,
        scope_anbiyam_ids: resolveScope(scope, anbiyams),
        permissions: [...selected],
      });
      if (!res.success) {
        setError(res.message || "Save failed.");
        return;
      }
      router.push(cancelHref);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-4xl">
      <FormCard title="Role">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" lang="english" required>
            <TextInput
              value={values.name}
              onChange={(e) => {
                const name = e.target.value;
                setValues((v) => ({
                  ...v,
                  name,
                  // Derive the key while creating; never rewrite an existing one.
                  key: initial?.key ? v.key : keyFromName(name),
                }));
              }}
              placeholder="Anbiyam head — Mandalam 3"
            />
          </Field>
          <Field label="Key" required hint="Used in code and logs. Lower case, no spaces.">
            <TextInput
              value={values.key}
              onChange={(e) => setValues((v) => ({ ...v, key: e.target.value }))}
              disabled={Boolean(initial?.key)}
            />
          </Field>
          <Field label="Name in Tamil" lang="tamil">
            <TamilTextInput
              value={values.name_ta}
              onChange={(e) => setValues((v) => ({ ...v, name_ta: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Description">
          <TamilTextArea
            rows={2}
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
        </Field>
      </FormCard>

      <FormCard
        title="Where this role may act"
        description="Permissions say what someone may do. This says which Anbiyams they may do it in — the lists, the family cards and the members outside them are refused."
      >
        <RoleScopePicker value={scope} onChange={setScope} />
      </FormCard>

      <FormCard
        title={`Permissions (${selected.size} selected)`}
        description="Hover or tap any permission to see what it does. Greyed rows are permissions you do not hold yourself, so you cannot grant them."
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading the permission catalogue…</p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const all = group.permissions.filter((p) => p.grantable);
              const allOn = all.length > 0 && all.every((p) => selected.has(p.key));
              return (
                <div key={group.area}>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#596065" }}>
                      {AREA_LABEL[group.area] ?? group.area}
                    </h3>
                    {all.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleArea(group.area, !allOn)}
                        className="text-[11px] font-bold"
                        style={{ color: "#0D5C63" }}
                      >
                        {allOn ? "Clear" : "Select all"}
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 gap-y-2">
                    {group.permissions.map((p) => (
                      <PermissionRow
                        key={p.key}
                        permissionKey={p.key}
                        checked={selected.has(p.key)}
                        disabled={!grantable.has(p.key)}
                        onToggle={() => toggle(p.key)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FormCard>

      <FormActions
        submitting={busy}
        submitLabel={submitLabel}
        error={error}
        onCancel={() => router.push(cancelHref)}
      />
    </form>
  );
}
