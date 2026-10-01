"use client";

import Link from "next/link";
import { FormCard } from "@/components/ui/Field";
import { useFamilyTimeline } from "@/hooks/useFamilies";
import type { FamilyEvent } from "@/src/types";

/**
 * What has happened to one household, newest first.
 *
 * One line per operation rather than per person: a merge that carried three
 * people to another card is a single thing that happened, and reads as one
 * entry naming all three.
 *
 * Entries come from two places and the card says which. An event the system
 * recorded as it happened knows who did it. An event reconstructed afterwards
 * — from the card's own creation date, its transfers, the departure left in
 * its status — does not, and is marked rather than given a plausible-looking
 * name it cannot support.
 */

const LOOK: Record<
  FamilyEvent["action"],
  { icon: string; label: string; tone: string }
> = {
  "family.open": { icon: "add_home", label: "Card opened", tone: "#0D5C63" },
  "family.transfer": { icon: "move_down", label: "Transferred", tone: "#0369a1" },
  "family.close": { icon: "do_not_disturb_on", label: "Card closed", tone: "#92400e" },
  "family.merge": { icon: "merge", label: "Merged into another card", tone: "#92400e" },
  "member.add": { icon: "person_add", label: "Added", tone: "#166534" },
  "member.remove": { icon: "person_remove", label: "Removed", tone: "#9f1239" },
};

function when(at: string) {
  return new Date(at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function People({ members }: { members: FamilyEvent["members"] }) {
  if (!members.length) return null;
  return (
    <span>
      {members.map((m, i) => (
        <span key={m._id}>
          {i > 0 && <span className="text-slate-400">, </span>}
          {/* The members list and the family card both treat the edit page as
              a member's page, so this goes where they already go. */}
          <Link
            href={`/members/${m._id}/edit`}
            className="font-medium hover:underline"
            style={{ color: "#0D5C63" }}
          >
            {m.name_ta || m.name || "Unnamed"}
          </Link>
        </span>
      ))}
    </span>
  );
}

function Event({ e, last }: { e: FamilyEvent; last: boolean }) {
  const look = LOOK[e.action] ?? {
    icon: "history",
    label: e.action,
    tone: "#596065",
  };

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {/* The rail, stopped short on the final entry so it does not trail off
          below the oldest thing that ever happened. */}
      {!last && (
        <span
          className="absolute left-[15px] top-8 bottom-0 w-px"
          style={{ backgroundColor: "#e2e8f0" }}
          aria-hidden
        />
      )}
      <span
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white"
        style={{ borderColor: "#e2e8f0", color: look.tone }}
      >
        <span className="material-symbols-outlined text-[16px]">{look.icon}</span>
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm">
          <span className="font-bold" style={{ color: look.tone }}>
            {look.label}
          </span>
          {e.members.length > 0 && (
            <>
              {" "}
              <People members={e.members} />
            </>
          )}
          {e.family_code && e.action !== "family.transfer" && (
            <span className="font-mono text-xs text-slate-500"> · {e.family_code}</span>
          )}
          {e.action === "family.transfer" && (
            <span className="font-mono text-xs text-slate-500">
              {" "}
              · {e.old_family_code ?? "—"} → {e.new_family_code ?? "—"}
            </span>
          )}
          {e.to_family && (
            <>
              {" "}
              <span className="text-slate-500">to</span>{" "}
              <Link
                href={`/families/${e.to_family._id}`}
                className="font-mono text-xs font-bold hover:underline"
                style={{ color: "#0D5C63" }}
              >
                {e.to_family.family_code}
              </Link>
            </>
          )}
        </p>

        {e.reason && <p className="text-xs text-slate-500 mt-0.5">{e.reason}</p>}

        <p className="text-xs text-slate-400 mt-0.5">
          {when(e.at)}
          {e.actor?.name ? ` · ${e.actor.name}` : ""}
          {!e.recorded && (
            <span
              className="ml-2 italic"
              title="Reconstructed from the record itself. Nothing was recording who did this at the time."
            >
              from the record
            </span>
          )}
        </p>
      </div>
    </li>
  );
}

export default function FamilyTimeline({ familyId }: { familyId: string }) {
  const { data, isLoading } = useFamilyTimeline(familyId);
  const events = (data?.data ?? []) as FamilyEvent[];

  return (
    <FormCard
      title="History"
      description="Everything that has happened to this household, newest first."
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading history…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing recorded yet.</p>
      ) : (
        <>
          <ol className="relative">
            {events.map((e, i) => (
              <Event key={`${e.at}-${e.action}-${i}`} e={e} last={i === events.length - 1} />
            ))}
          </ol>
          <div
            className="text-xs text-slate-400 border-t pt-3 space-y-1"
            style={{ borderColor: "#f1f5f9" }}
          >
            {/* Carried over from the card this timeline replaced. The warning
                is the whole reason old codes are kept at all. */}
            <p>
              A paper record marked with one of the codes above belongs to this family, not to
              whoever holds that code today.
            </p>
            {events.some((e) => !e.recorded) && (
              <p>
                Entries marked <span className="italic">from the record</span> were worked out
                from the card itself rather than written down at the time, so they name no one. A
                member removed before this history began cannot appear at all — a removal left no
                date behind.
              </p>
            )}
          </div>
        </>
      )}
    </FormCard>
  );
}
