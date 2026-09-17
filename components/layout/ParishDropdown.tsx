"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSwitchParish } from "@/hooks/useParishes";
import type { Parish } from "@/src/types";

interface ParishDropdownProps {
  parishes: Parish[];
  currentParishId: string | null;
}

export default function ParishDropdown({
  parishes,
  currentParishId,
}: ParishDropdownProps) {
  const router = useRouter();
  const { mutate, isPending } = useSwitchParish();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const parishId = e.target.value;
    if (!parishId || parishId === currentParishId) return;
    setError(null);
    mutate(parishId, {
      onSuccess: (res) => {
        if (res.success) {
          router.refresh();
        } else {
          setError(res.message || "Failed to switch parish");
        }
      },
      onError: () => setError("Failed to switch parish"),
    });
  }

  return (
    <div
      className="px-3 py-1 rounded-full font-bold flex items-center gap-2 text-sm"
      style={{ backgroundColor: "#abeef6", color: "#0a5b62" }}
      title={error ?? undefined}
    >
      <span className="material-symbols-outlined text-sm">location_on</span>
      <select
        value={currentParishId ?? ""}
        onChange={handleChange}
        disabled={isPending || parishes.length === 0}
        className="bg-transparent font-bold text-sm focus:outline-none cursor-pointer"
        style={{ color: "#0a5b62" }}
      >
        {!currentParishId && <option value="">Select a parish</option>}
        {parishes.map((v) => (
          <option key={v._id} value={v._id}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}
