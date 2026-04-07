"use client";

interface LanguageToggleProps {
  tamilMode: boolean;
  onToggle: () => void;
}

export default function LanguageToggle({ tamilMode, onToggle }: LanguageToggleProps) {
  return (
    <div
      className="flex items-center gap-3 mb-6 px-4 py-2.5 rounded-lg"
      style={{ backgroundColor: "#f0f4f8" }}
    >
      <span className="material-symbols-outlined text-base" style={{ color: "#596065" }}>
        translate
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#596065" }}>
        Input Language
      </span>
      <div
        className="flex rounded-lg overflow-hidden border ml-auto"
        style={{ borderColor: "#0D5C63" }}
      >
        <button
          type="button"
          className="px-4 py-1.5 text-sm font-bold transition-all"
          style={{
            backgroundColor: tamilMode ? "#0D5C63" : "transparent",
            color: tamilMode ? "#ffffff" : "#0D5C63",
          }}
          onClick={() => { if (!tamilMode) onToggle(); }}
        >
          த Tamil
        </button>
        <button
          type="button"
          className="px-4 py-1.5 text-sm font-bold transition-all"
          style={{
            backgroundColor: !tamilMode ? "#0D5C63" : "transparent",
            color: !tamilMode ? "#ffffff" : "#0D5C63",
          }}
          onClick={() => { if (tamilMode) onToggle(); }}
        >
          A English
        </button>
      </div>
    </div>
  );
}
