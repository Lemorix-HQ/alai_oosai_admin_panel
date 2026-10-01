"use client";

import { useEffect } from "react";

/**
 * A right-hand panel for short forms.
 *
 * Creating a Mandalam is four fields; sending the user to a separate route and
 * back loses their place in a list they are working down. On a phone it fills
 * the screen, which is the same thing a page would have done.
 */
export default function SlideOver({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md h-full overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 bg-white border-b px-5 py-4 flex items-start justify-between gap-3"
          style={{ borderColor: "#e2e8f0" }}
        >
          <div className="min-w-0">
            <h2 className="font-bold" style={{ color: "#0D5C63" }}>
              {title}
            </h2>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
