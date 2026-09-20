"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import FilterBar from "@/components/ui/FilterBar";
import EmptyState from "@/components/ui/EmptyState";
import StatusPill from "@/components/ui/StatusPill";
import { useAudit } from "@/hooks/useAccess";
import { useParishes } from "@/hooks/useParishes";
import type { AuditEntry, ParishWithCounts } from "@/src/types";

const TONE: Record<string, "success" | "warning" | "danger" | "info"> = {
  create: "success",
  assign: "success",
  update: "info",
  revoke: "warning",
  deactivate: "warning",
  remove: "danger",
  delete: "danger",
};

function toneFor(action: string) {
  const verb = action.split(".").pop() ?? "";
  return TONE[verb] ?? "info";
}

function nameOf(ref: AuditEntry["actor_user_id"]) {
  return typeof ref === "string" ? ref.slice(-6) : ref.name;
}

function Entry({ e }: { e: AuditEntry }) {
  const [open, setOpen] = useState(false);
  const hasDetail =
    Object.keys(e.before ?? {}).length > 0 || Object.keys(e.after ?? {}).length > 0;

  return (
    <li className="px-4 py-3 border-t first:border-t-0" style={{ borderColor: "#e2e8f0" }}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label={e.action} tone={toneFor(e.action)} />
        <span className="text-sm font-semibold" style={{ color: "#0D5C63" }}>
          {nameOf(e.actor_user_id)}
        </span>
        <span className="text-xs text-slate-500">{e.entity}</span>
        {e.parish_id && typeof e.parish_id !== "string" && (
          <span className="text-xs text-slate-400">· {e.parish_id.name}</span>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {new Date(e.createdAt).toLocaleString()}
        </span>
      </div>
      {hasDetail && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-1 text-[11px] font-bold"
          style={{ color: "#0D5C63" }}
        >
          {open ? "Hide" : "Show"} what changed
        </button>
      )}
      {open && (
        <pre className="mt-2 p-3 rounded-lg text-[11px] overflow-x-auto" style={{ backgroundColor: "#f8fafc", color: "#475569" }}>
          {JSON.stringify({ before: e.before, after: e.after }, null, 2)}
        </pre>
      )}
    </li>
  );
}

function AuditList() {
  const params = useSearchParams();
  const { data, isLoading } = useAudit({
    action: params.get("q") ?? undefined,
    entity: params.get("entity") ?? undefined,
    parish_id: params.get("parish_id") ?? undefined,
  });
  const { data: parishRes } = useParishes();
  const parishes = (parishRes?.data ?? []) as ParishWithCounts[];

  const rows = data?.data?.rows ?? [];

  return (
    <>
      <FilterBar
        searchPlaceholder="Filter by action, e.g. role.assign…"
        filters={[
          {
            key: "entity",
            label: "Entity",
            options: [
              { value: "Role", label: "Role" },
              { value: "RoleAssignment", label: "Role assignment" },
              { value: "BaseUser", label: "User" },
              { value: "Parish", label: "Parish" },
            ],
          },
          {
            key: "parish_id",
            label: "Parish",
            options: parishes.map((p) => ({ value: p._id, label: p.name })),
          },
        ]}
      />
      <div className="bg-white rounded-xl border" style={{ borderColor: "#e2e8f0" }}>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="history"
            title="Nothing recorded yet"
            description="Role changes, staff creation and parish edits are written here as they happen."
          />
        ) : (
          <ul>
            {rows.map((e) => (
              <Entry key={e._id} e={e} />
            ))}
          </ul>
        )}
      </div>
      {data?.data && data.data.total > rows.length && (
        <p className="mt-3 text-xs text-slate-500">
          Showing {rows.length} of {data.data.total}.
        </p>
      )}
    </>
  );
}

export default function AuditPage() {
  return (
    <PageShell
      title="Audit log"
      subtitle="Who changed what, and when. Role changes above all — they are the ones someone will ask about later."
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <AuditList />
      </Suspense>
    </PageShell>
  );
}
