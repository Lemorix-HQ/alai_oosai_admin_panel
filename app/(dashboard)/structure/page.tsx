"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import StatCard from "@/components/ui/StatCard";
import StatusPill from "@/components/ui/StatusPill";
import EmptyState from "@/components/ui/EmptyState";
import SlideOver from "@/components/ui/SlideOver";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { AnbiyamForm, MandalamForm, SubstationForm } from "@/components/structure/StructureForms";
import { PermissionGate } from "@/src/session/PermissionGate";
import { useSession } from "@/src/session/SessionProvider";
import { P } from "@/src/session/permissions";
import {
  useAnbiyams,
  useDeactivateAnbiyam,
  useDeactivateMandalam,
  useMandalams,
  useStructureTree,
  useSubstations,
} from "@/hooks/useStructure";
import type { Anbiyam, Mandalam, Substation } from "@/src/types";

type Panel =
  | { kind: "mandalam"; initial?: Mandalam }
  | { kind: "anbiyam"; initial?: Anbiyam }
  | { kind: "substation"; initial?: Substation }
  | null;

function AnbiyamChip({
  a,
  onEdit,
  canEdit,
  highlighted,
}: {
  a: Anbiyam;
  onEdit: () => void;
  canEdit: boolean;
  /** Arrived here from the Families list looking for this one. */
  highlighted: boolean;
}) {
  return (
    <div
      id={`anbiyam-${a._id}`}
      className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 ${
        highlighted ? "anbiyam-highlight" : ""
      }`}
      style={{ borderColor: "#e2e8f0" }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#0D5C63" }}>
          <span className="font-mono">{a.code}</span>
          {a.name_ta ? ` · ${a.name_ta}` : a.name ? ` · ${a.name}` : ""}
        </p>
        <p className="text-[11px] text-slate-500">
          {(a.family_count ?? 0).toLocaleString()} {a.family_count === 1 ? "family" : "families"}
          {a.meeting_day ? ` · ${a.meeting_day}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/families?anbiyam_id=${a._id}`}
          className="text-[11px] font-bold"
          style={{ color: "#0D5C63" }}
        >
          Families
        </Link>
        {canEdit && (
          <button onClick={onEdit} className="text-[11px] font-bold" style={{ color: "#596065" }}>
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function StructureContent() {
  const { can } = useSession();
  const { data: treeRes, isLoading } = useStructureTree();
  const { data: mandalamRes } = useMandalams({ with_counts: "true" });
  const { data: anbiyamRes } = useAnbiyams({ with_counts: "true" });
  const { data: substationRes } = useSubstations();
  const deactivateMandalam = useDeactivateMandalam();
  const deactivateAnbiyam = useDeactivateAnbiyam();

  const [panel, setPanel] = useState<Panel>(null);
  const [error, setError] = useState<string | null>(null);

  const tree = treeRes?.data;
  const mandalams = (mandalamRes?.data ?? []) as Mandalam[];
  const anbiyams = (anbiyamRes?.data ?? []) as Anbiyam[];
  const substations = (substationRes?.data ?? []) as Substation[];

  const canEditAnbiyam = can(P.structure.anbiyam);
  const canEditMandalam = can(P.structure.mandalam);

  /**
   * `?anbiyam=<id>` means someone clicked the Anbiyam column in the Families
   * list. Bring that chip to the middle of the viewport and blink it until
   * they click, which is what tells us they have found it.
   *
   * The chip only exists once the tree has loaded, so this waits on `tree`
   * rather than running on mount. It scrolls directly rather than inside a
   * requestAnimationFrame: this effect already runs after paint, so the grid
   * is laid out, and rAF does not fire at all while the tab is in the
   * background — which loses the scroll entirely.
   */
  const requested = useSearchParams().get("anbiyam");
  /** Which request the user has already clicked away, not a second copy of it. */
  const [dismissed, setDismissed] = useState<string | null>(null);
  const highlighted = requested && dismissed !== requested ? requested : null;

  useEffect(() => {
    if (!highlighted || !tree) return;
    const chip = document.getElementById(`anbiyam-${highlighted}`);
    if (!chip) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chip.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });

    // Smooth scrolling is driven by the compositor and is skipped outright in
    // some contexts — a backgrounded tab, most automation. Arriving at the
    // chip matters more than the animation does, and without this the blink
    // happens off-screen where nobody sees it, so snap if it did not land.
    const settle = setTimeout(() => {
      const box = chip.getBoundingClientRect();
      if (box.top < 0 || box.bottom > window.innerHeight) {
        chip.scrollIntoView({ block: "center" });
      }
    }, 700);

    const stop = () => setDismissed(highlighted);
    document.addEventListener("click", stop, { once: true });

    return () => {
      clearTimeout(settle);
      document.removeEventListener("click", stop);
    };
  }, [highlighted, tree]);

  return (
    <PageShell
      title="Parish structure"
      subtitle="Mandalam (zone) → Anbiyam (basic Christian community) → family."
      action={
        <PermissionGate anyOf={[P.structure.mandalam, P.structure.anbiyam, P.structure.substation]}>
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={P.structure.substation}>
              <button
                onClick={() => setPanel({ kind: "substation" })}
                className="font-bold py-2.5 px-4 rounded-lg border text-sm"
                style={{ borderColor: "#dce3e9", color: "#0D5C63" }}
              >
                Add substation
              </button>
            </PermissionGate>
            <PermissionGate permission={P.structure.mandalam}>
              <button
                onClick={() => setPanel({ kind: "mandalam" })}
                className="font-bold py-2.5 px-4 rounded-lg border text-sm"
                style={{ borderColor: "#dce3e9", color: "#0D5C63" }}
              >
                Add Mandalam
              </button>
            </PermissionGate>
            <PermissionGate permission={P.structure.anbiyam}>
              <button
                onClick={() => setPanel({ kind: "anbiyam" })}
                className="font-bold py-2.5 px-5 rounded-lg text-sm shadow-sm"
                style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
              >
                Add Anbiyam
              </button>
            </PermissionGate>
          </div>
        </PermissionGate>
      }
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Mandalams" value={tree?.totals.mandalams ?? 0} icon="account_tree" />
        <StatCard label="Anbiyams" value={tree?.totals.anbiyams ?? 0} icon="hub" />
        <StatCard
          label="Families"
          value={(tree?.totals.families ?? 0).toLocaleString()}
          icon="home"
          href="/families"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading structure…</p>
      ) : !tree || (tree.mandalams.length === 0 && tree.unassigned_anbiyams.length === 0) ? (
        <div className="bg-white rounded-xl border" style={{ borderColor: "#e2e8f0" }}>
          <EmptyState
            icon="account_tree"
            title="No structure yet"
            description="Add the Mandalams first, then the Anbiyams under them. A parish that does not use zones can add Anbiyams on their own."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {tree.mandalams.map((m) => (
            <div key={m._id} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h2 className="font-bold" style={{ color: "#0D5C63" }}>
                    <span className="font-mono text-sm">{m.code}</span> {m.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {m.anbiyams.length} {m.anbiyams.length === 1 ? "Anbiyam" : "Anbiyams"} ·{" "}
                    {m.anbiyams.reduce((a, x) => a + (x.family_count ?? 0), 0).toLocaleString()} families
                    {m.patron_saint ? ` · ${m.patron_saint}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {m.status !== "active" && <StatusPill label={m.status} tone="neutral" />}
                  {canEditMandalam && (
                    <>
                      <button
                        onClick={() => setPanel({ kind: "mandalam", initial: m })}
                        className="text-xs font-bold"
                        style={{ color: "#0D5C63" }}
                      >
                        Edit
                      </button>
                      {m.anbiyams.length === 0 && m.status === "active" && (
                        <ConfirmDialog
                          trigger={<button className="text-xs font-bold" style={{ color: "#dc2626" }}>Deactivate</button>}
                          title={`Deactivate ${m.name}?`}
                          message="It is marked inactive, not deleted, so families whose records reference it still read correctly."
                          confirmLabel="Deactivate"
                          onConfirm={async () => {
                            const res = await deactivateMandalam.mutateAsync(m._id);
                            if (!res.success) setError(res.message);
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              {m.anbiyams.length === 0 ? (
                <p className="text-xs text-slate-400">No Anbiyams in this Mandalam yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {m.anbiyams.map((a) => (
                    <AnbiyamChip
                      key={a._id}
                      a={a}
                      canEdit={canEditAnbiyam}
                      highlighted={highlighted === a._id}
                      onEdit={() => setPanel({ kind: "anbiyam", initial: a })}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {tree.unassigned_anbiyams.length > 0 && (
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e2e8f0" }}>
              <h2 className="font-bold mb-1" style={{ color: "#0D5C63" }}>
                Anbiyams with no Mandalam
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Legitimate in a parish that does not use zones. In one that does, these are
                probably waiting to be assigned.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {tree.unassigned_anbiyams.map((a) => (
                  <AnbiyamChip
                    key={a._id}
                    a={a}
                    canEdit={canEditAnbiyam}
                    highlighted={highlighted === a._id}
                    onEdit={() => setPanel({ kind: "anbiyam", initial: a })}
                  />
                ))}
              </div>
            </div>
          )}

          {substations.length > 0 && (
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e2e8f0" }}>
              <h2 className="font-bold mb-3" style={{ color: "#0D5C63" }}>
                Substations
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {substations.map((s) => (
                  <div
                    key={s._id}
                    className="rounded-lg border px-3 py-2 flex items-center justify-between gap-2"
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#0D5C63" }}>
                        <span className="font-mono">{s.code}</span> {s.name}
                      </p>
                      {s.patron_saint && <p className="text-[11px] text-slate-500">{s.patron_saint}</p>}
                    </div>
                    <PermissionGate permission={P.structure.substation}>
                      <button
                        onClick={() => setPanel({ kind: "substation", initial: s })}
                        className="text-[11px] font-bold shrink-0"
                        style={{ color: "#596065" }}
                      >
                        Edit
                      </button>
                    </PermissionGate>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <SlideOver
        open={panel !== null}
        title={
          panel?.kind === "mandalam"
            ? panel.initial
              ? "Edit Mandalam"
              : "New Mandalam"
            : panel?.kind === "anbiyam"
              ? panel.initial
                ? "Edit Anbiyam"
                : "New Anbiyam"
              : panel?.initial
                ? "Edit substation"
                : "New substation"
        }
        description={
          panel?.kind === "anbiyam" && !panel.initial
            ? "The code you choose becomes the prefix of every family code in this Anbiyam."
            : undefined
        }
        onClose={() => setPanel(null)}
      >
        {panel?.kind === "mandalam" && (
          <MandalamForm initial={panel.initial} substations={substations} onDone={() => setPanel(null)} />
        )}
        {panel?.kind === "anbiyam" && (
          <AnbiyamForm initial={panel.initial} mandalams={mandalams} onDone={() => setPanel(null)} />
        )}
        {panel?.kind === "substation" && (
          <SubstationForm initial={panel.initial} onDone={() => setPanel(null)} />
        )}
      </SlideOver>

      {/* Deactivating an empty Anbiyam is offered from its own row only when it
          has no families; the API refuses otherwise and says how many. */}
      {canEditAnbiyam && anbiyams.some((a) => a.status === "active" && (a.family_count ?? 0) === 0) && (
        <div className="mt-6 bg-white rounded-xl border p-4" style={{ borderColor: "#e2e8f0" }}>
          <h2 className="font-bold mb-2 text-sm" style={{ color: "#0D5C63" }}>
            Empty Anbiyams
          </h2>
          <div className="flex flex-wrap gap-2">
            {anbiyams
              .filter((a) => a.status === "active" && (a.family_count ?? 0) === 0)
              .map((a) => (
                <ConfirmDialog
                  key={a._id}
                  trigger={
                    <button
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold"
                      style={{ borderColor: "#e2e8f0", color: "#dc2626" }}
                    >
                      Deactivate {a.code}
                    </button>
                  }
                  title={`Deactivate ${a.code}?`}
                  message="It has no active families, so nothing is detached. It is marked inactive rather than deleted."
                  confirmLabel="Deactivate"
                  onConfirm={async () => {
                    const res = await deactivateAnbiyam.mutateAsync(a._id);
                    if (!res.success) setError(res.message);
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function StructurePage() {
  return (
    <Suspense fallback={<p className="p-4 sm:p-6 text-sm text-slate-500">Loading structure…</p>}>
      <StructureContent />
    </Suspense>
  );
}
