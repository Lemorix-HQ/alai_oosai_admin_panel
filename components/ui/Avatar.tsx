"use client";

import { useState } from "react";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  // Tamil has no case, and toUpperCase leaves it alone — so a Tamil name
  // simply shows its first glyph, which is what the app's tiles do too.
  return (name.trim() || "?").slice(0, 2).toUpperCase();
}

/**
 * A picture if there is one, initials if there is not.
 *
 * Having no photo is the ordinary case — 3,225 seeded members have none — so
 * the fallback is the default state, not an error state. A URL that 404s falls
 * back to the same initials rather than leaving a broken box.
 */
export default function Avatar({
  name,
  photo,
  size = 36,
  className = "",
}: {
  name: string;
  photo?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const show = photo && !failed;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 font-bold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "#0D5C63",
        color: "#ffffff",
        fontSize: Math.max(10, Math.round(size / 2.6)),
      }}
      title={name}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element -- the R2 host is not in next.config's image domains, and these are already small files.
        <img
          src={photo}
          alt={name}
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: "cover" }}
          onError={() => setFailed(true)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
