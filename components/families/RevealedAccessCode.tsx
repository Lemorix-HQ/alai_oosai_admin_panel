"use client";

import { useState } from "react";

/**
 * The one panel in the system that shows a plaintext access code — pulled out
 * of `AccessCodeCard` so Code Issue Management can show the same reveal-once
 * UI without a second copy of it. The server keeps only a bcrypt hash, so
 * this is the only chance anyone gets to read the code back.
 */
export default function RevealedAccessCode({
  code,
  familyCode,
  onDone,
}: {
  code: string;
  familyCode: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setError("Could not copy — write the code down from the screen.");
    }
  }

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ backgroundColor: "#f0fdfc", border: "1px solid #99d6d1" }}
    >
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0D5C63" }}>
        Write this down now
      </p>
      <p
        className="text-2xl font-bold tracking-[0.2em] font-mono select-all break-all"
        style={{ color: "#0D5C63" }}
      >
        {code}
      </p>
      <p className="text-xs text-slate-600">
        This is the only time the code is shown. It is not stored anywhere it can be read back —
        if it is lost, issue a new one. Give it to the family together with their family code,{" "}
        <strong>{familyCode}</strong>.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="px-3 py-2 rounded-lg text-xs font-bold"
          style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
        >
          {copied ? "Copied" : "Copy code"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-2 rounded-lg border text-xs font-bold"
          style={{ borderColor: "#e2e8f0", color: "#596065" }}
        >
          I have written it down
        </button>
      </div>
      {error && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </p>
      )}
    </div>
  );
}
