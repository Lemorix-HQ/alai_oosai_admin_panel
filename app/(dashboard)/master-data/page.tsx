"use client";

import { useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { TamilTextInput } from "@/components/ui/Field";
import ResourceTable, { type Column } from "@/components/ui/ResourceTable";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useMasterData, useUpdateLookup, useDeleteLookup } from "@/hooks/useMasterData";
import { createLookupAction, type LookupKind } from "@/actions/lookups.actions";
import { useQueryClient } from "@tanstack/react-query";
import type { College, Occupation, Place, School } from "@/src/types";

type LookupRow = School | College | Occupation | Place;

const TABS: { kind: LookupKind; label: string }[] = [
  { kind: "school", label: "Schools" },
  { kind: "college", label: "Colleges" },
  { kind: "place", label: "Places" },
  { kind: "occupation", label: "Occupations" },
];

/**
 * List, rename and retire the four lookup lists the member form picks a
 * school, college, occupation and place from.
 *
 * Creating an entry already happens in the course of filling a member's
 * details — `LookupCombobox`'s "+" row. This screen is for curating what
 * accumulates there: fixing a misspelling, or retiring a duplicate.
 */
export default function MasterDataPage() {
  const [tab, setTab] = useState<LookupKind>("school");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameTa, setEditNameTa] = useState("");
  const [newName, setNewName] = useState("");
  const [newNameTa, setNewNameTa] = useState("");
  const [creating, setCreating] = useState(false);

  const qc = useQueryClient();
  const { data, isLoading } = useMasterData(tab, { q, status: "all" });
  const update = useUpdateLookup(tab);
  const remove = useDeleteLookup(tab);

  const rows = (data?.data ?? []) as LookupRow[];

  const startEdit = (r: LookupRow) => {
    setEditingId(r._id);
    setEditName(r.name);
    setEditNameTa(r.name_ta ?? "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await update.mutateAsync({
      id: editingId,
      payload: { name: editName.trim(), name_ta: editNameTa.trim() || undefined },
    });
    if (!res.success) setError(res.message);
    else setEditingId(null);
  };

  const addNew = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const res = await createLookupAction(tab, {
      name,
      name_ta: newNameTa.trim() || undefined,
    });
    setCreating(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setNewName("");
    setNewNameTa("");
    qc.invalidateQueries({ queryKey: ["master-data", tab] });
  };

  const columns: Column<LookupRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) =>
        editingId === r._id ? (
          <div className="flex flex-col gap-1">
            <input
              className="rounded border px-2 py-1 text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Name"
            />
            <TamilTextInput
              className="rounded border px-2 py-1 text-sm"
              value={editNameTa}
              onChange={(e) => setEditNameTa(e.target.value)}
              placeholder="Tamil name"
            />
          </div>
        ) : (
          <span>
            {r.name}
            {r.name_ta && <span className="block text-xs text-slate-400">{r.name_ta}</span>}
          </span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusPill label={r.status} tone={r.status === "active" ? "success" : "neutral"} />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => {
        if (editingId === r._id) {
          return (
            <span className="flex justify-end gap-2 whitespace-nowrap">
              <button
                className="text-xs font-bold"
                style={{ color: "#0D5C63" }}
                onClick={saveEdit}
                disabled={update.isPending}
              >
                Save
              </button>
              <button
                className="text-xs font-bold text-slate-500"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </button>
            </span>
          );
        }
        return (
          <span className="flex justify-end gap-2 whitespace-nowrap">
            <button className="text-xs font-bold" style={{ color: "#0D5C63" }} onClick={() => startEdit(r)}>
              Rename
            </button>
            {r.status === "active" ? (
              <ConfirmDialog
                trigger={<button className="text-xs font-bold" style={{ color: "#dc2626" }}>Retire</button>}
                title={`Retire ${r.name}?`}
                message="It is kept, not deleted — anyone already recorded against it still resolves fine. It just stops being offered for a new entry."
                confirmLabel="Retire"
                onConfirm={async () => {
                  const res = await remove.mutateAsync(r._id);
                  if (!res.success) setError(res.message);
                }}
              />
            ) : (
              <button
                className="text-xs font-bold"
                style={{ color: "#0D5C63" }}
                onClick={async () => {
                  const res = await update.mutateAsync({ id: r._id, payload: { status: "active" } });
                  if (!res.success) setError(res.message);
                }}
              >
                Reactivate
              </button>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <PageShell
      title="Master Data"
      subtitle="The schools, colleges, places and occupations every member form picks from."
    >
      <div className="mb-4 flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t.kind}
            className="px-3 py-2 text-sm font-medium"
            style={{
              color: tab === t.kind ? "#0D5C63" : "#64748b",
              borderBottom: tab === t.kind ? "2px solid #0D5C63" : "2px solid transparent",
            }}
            onClick={() => {
              setTab(t.kind);
              setEditingId(null);
              setQ("");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input
          className="flex-1 rounded border px-3 py-2 text-sm"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end rounded-lg border p-3">
        <input
          className="flex-1 rounded border px-3 py-2 text-sm"
          placeholder="Add a new name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <TamilTextInput
          className="flex-1 rounded border px-3 py-2 text-sm"
          placeholder="Tamil name (optional)"
          value={newNameTa}
          onChange={(e) => setNewNameTa(e.target.value)}
        />
        <button
          className="rounded px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: "#0D5C63" }}
          disabled={creating || !newName.trim()}
          onClick={addNew}
        >
          Add
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <ResourceTable
          rows={rows}
          columns={columns}
          empty={{ icon: "inventory_2", title: "Nothing here yet", description: "Add one above, or it fills itself as members are recorded." }}
        />
      )}
    </PageShell>
  );
}
