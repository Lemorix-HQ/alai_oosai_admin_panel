/**
 * Utility functions for the Alai Oosai Admin Panel
 */

/**
 * Combines class names conditionally
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Every date a reader sees is dd/mm/yyyy — the order the parish writes on
 * paper and in the passbook. One place decides it, so no page spells a format
 * out for itself and they can never drift apart.
 *
 * Display only. What crosses the wire stays ISO-8601 (`yyyy-mm-dd`), which is
 * what the API validates with `@IsDateString()`.
 *
 * `en-GB` is the locale that yields dd/mm/yyyy with 2-digit parts; `en-IN`
 * gives d/m/yyyy, unpadded, which lines up badly in a table column.
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * `09/10/2026, 18:30` — for a timestamp, where the clock carries meaning:
 * an audit entry, an invitation that expires, a submission received.
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

/**
 * The same as {@link formatDate}, but gives `placeholder` back for a missing
 * date instead of making every caller write the same ternary — and never the
 * "Invalid Date" that `new Date(undefined)` would otherwise render.
 */
export function formatDateOr(
  date: string | Date | null | undefined,
  placeholder = "—",
): string {
  if (!date) return placeholder;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? placeholder : formatDate(d);
}

/**
 * Any value on its way to the screen, with an ISO date rewritten as dd/mm/yyyy
 * and everything else handed back untouched.
 *
 * For a raw payload: a `ChangeRequest.payload` is Mixed, so a date inside it
 * arrives as whatever string the API stored and `String(value)` would print
 * `1998-04-12` at a priest who is reading it off a screen. Date-only as well
 * as a full timestamp — a date of birth has no clock half.
 */
export function formatIfDate(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  const v = String(value);
  return /^\d{4}-\d{2}-\d{2}(T|$)/.test(v) ? formatDateOr(v) : v;
}

/**
 * ISO `yyyy-mm-dd` for a value on its way to the API, out of a `Date` or out
 * of anything `new Date()` understands. Built from the local calendar date,
 * not `toISOString()`, which shifts a date backwards for anyone east of UTC —
 * a birthday entered as the 1st would be stored as the previous month's last
 * day in Asia/Kolkata.
 */
export function toIsoDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}
