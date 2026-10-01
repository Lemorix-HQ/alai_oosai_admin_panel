const TONES: Record<string, { bg: string; fg: string }> = {
  neutral: { bg: "#e2e8f0", fg: "#475569" },
  success: { bg: "#d1fae5", fg: "#065f46" },
  warning: { bg: "#ffddb8", fg: "#744800" },
  danger: { bg: "#fee2e2", fg: "#991b1b" },
  info: { bg: "#abeef6", fg: "#0a5b62" },
};

export type Tone = keyof typeof TONES;

export default function StatusPill({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: string;
}) {
  const t = TONES[tone] ?? TONES.neutral;
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap"
      style={{ backgroundColor: t.bg, color: t.fg }}
    >
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      {label}
    </span>
  );
}
