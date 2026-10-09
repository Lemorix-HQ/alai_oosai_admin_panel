"use client";

import { permissionHelp } from "@/src/lib/permission-help";

/**
 * One permission checkbox, with a card explaining it.
 *
 * The card opens on hover, on keyboard focus and on tap — the same card, three
 * ways in — because hover alone does not exist on a tablet and these cells are
 * small. Focus covers both of the other two: tabbing to the checkbox focuses
 * it, and so does tapping it.
 *
 * `group-hover` / `group-focus-within` rather than React state, so forty-three
 * of these on one page do not each re-render the form.
 *
 * Positioned above the row, and only as wide as the row, so a card near the
 * right edge of the grid cannot push the page sideways. `pointer-events-none`
 * keeps it from swallowing the click it is sitting on top of.
 */
export default function PermissionRow({
  permissionKey,
  checked,
  disabled,
  onToggle,
}: {
  permissionKey: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const help = permissionHelp(permissionKey);

  return (
    <div className="relative group">
      <label
        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-mono ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        style={{
          borderColor: checked ? "#0D5C63" : "#e2e8f0",
          backgroundColor: checked ? "#f0fdfc" : "#ffffff",
        }}
      >
        <input
          type="checkbox"
          disabled={disabled}
          checked={checked}
          onChange={onToggle}
          aria-describedby={`help-${permissionKey}`}
        />
        {permissionKey}
      </label>

      <div
        id={`help-${permissionKey}`}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 w-full min-w-full
                   rounded-lg border p-3 shadow-lg opacity-0 invisible
                   transition-opacity duration-150
                   group-hover:opacity-100 group-hover:visible
                   group-focus-within:opacity-100 group-focus-within:visible"
        style={{ borderColor: "#cbd5e1", backgroundColor: "#ffffff" }}
      >
        <p className="text-xs font-bold leading-snug" style={{ color: "#0D5C63" }}>
          {help.title}
        </p>
        <p className="mt-1 text-xs leading-snug" style={{ color: "#475569" }}>
          {help.description}
        </p>
        {help.note && (
          <p
            className="mt-1.5 rounded px-1.5 py-1 text-[11px] leading-snug"
            style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
          >
            {help.note}
          </p>
        )}
        {disabled && (
          <p className="mt-1.5 text-[11px] leading-snug" style={{ color: "#92400e" }}>
            You do not hold this yourself, so you cannot grant it.
          </p>
        )}
      </div>
    </div>
  );
}
