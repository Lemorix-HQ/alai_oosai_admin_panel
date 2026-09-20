"use client";

import { useState } from "react";

/**
 * Destructive confirmation. `requireTyping` asks the user to type an exact
 * value first — used where the action cannot be undone and the object is easy
 * to confuse with a similar one, such as closing the wrong family.
 */
export default function ConfirmDialog({
  trigger,
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  requireTyping,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  requireTyping?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const blocked = requireTyping ? typed.trim() !== requireTyping : false;

  async function run() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
      setTyped("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2" style={{ color: "#2c3338" }}>
              {title}
            </h3>
            <p className="text-sm text-slate-600 mb-4">{message}</p>

            {requireTyping && (
              <div className="mb-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Type <span className="font-mono">{requireTyping}</span> to confirm
                </label>
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "#dce3e9" }}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: "#dce3e9", color: "#596065" }}
              >
                Cancel
              </button>
              <button
                onClick={run}
                disabled={blocked || busy}
                className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                style={{
                  backgroundColor: tone === "danger" ? "#dc2626" : "#F59E0B",
                  color: tone === "danger" ? "#ffffff" : "#0D5C63",
                }}
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
