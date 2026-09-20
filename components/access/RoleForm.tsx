"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Field, FormActions, FormCard, Select, TextArea, TextInput } from "@/components/ui/Field";
import { usePermissionCatalogue } from "@/hooks/useAccess";
import type { ApiResponse, Role } from "@/src/types";
import type { RolePayload } from "@/actions/access.actions";

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
    key: initial?.key ?? "",
    name: initial?.name ?? "",
    name_ta: initial?.name_ta ?? "",
    description: initial?.description ?? "",
    scope_level: (initial?.scope_level ?? "parish") as "parish" | "mandalam" | "anbiyam",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set(initial?.permissions ?? []));

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
        key: values.key.trim().toLowerCase().replace(/\s+/g, "_"),
        name: values.name.trim(),
        name_ta: values.name_ta.trim() || undefined,
        description: values.description.trim() || undefined,
        scope_level: values.scope_level,
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
          <Field label="Name" required>
            <TextInput
              value={values.name}
              onChange={(e) => {
                const name = e.target.value;
                setValues((v) => ({
                  ...v,
                  name,
                  // Derive the key while creating; never rewrite an existing one.
                  key: initial?.key ? v.key : name.toLowerCase().trim().replace(/\s+/g, "_"),
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
          <Field label="Name in Tamil">
            <TextInput
              value={values.name_ta}
              onChange={(e) => setValues((v) => ({ ...v, name_ta: e.target.value }))}
            />
          </Field>
          <Field
            label="Narrowest scope"
            hint="How far an assignment of this role may be narrowed when it is granted."
          >
            <Select
              value={values.scope_level}
              onChange={(e) =>
                setValues((v) => ({ ...v, scope_level: e.target.value as typeof v.scope_level }))
              }
            >
              <option value="parish">Parish</option>
              <option value="mandalam">Mandalam</option>
              <option value="anbiyam">Anbiyam</option>
            </Select>
          </Field>
        </div>
        <Field label="Description">
          <TextArea
            rows={2}
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
        </Field>
      </FormCard>

      <FormCard
        title={`Permissions (${selected.size} selected)`}
        description="Greyed rows are permissions you do not hold yourself, so you cannot grant them."
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
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {group.permissions.map((p) => {
                      const allowed = grantable.has(p.key);
                      return (
                        <label
                          key={p.key}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-mono ${
                            allowed ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                          }`}
                          style={{
                            borderColor: selected.has(p.key) ? "#0D5C63" : "#e2e8f0",
                            backgroundColor: selected.has(p.key) ? "#f0fdfc" : "#ffffff",
                          }}
                        >
                          <input
                            type="checkbox"
                            disabled={!allowed}
                            checked={selected.has(p.key)}
                            onChange={() => toggle(p.key)}
                          />
                          {p.key}
                        </label>
                      );
                    })}
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
