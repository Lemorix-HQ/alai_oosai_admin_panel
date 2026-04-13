"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSwitchVillage } from "@/hooks/useVillages";
import type { Village } from "@/src/types";

interface VillageDropdownProps {
  villages: Village[];
  currentVillageId: string | null;
}

export default function VillageDropdown({
  villages,
  currentVillageId,
}: VillageDropdownProps) {
  const router = useRouter();
  const { mutate, isPending } = useSwitchVillage();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const villageId = e.target.value;
    if (!villageId || villageId === currentVillageId) return;
    setError(null);
    mutate(villageId, {
      onSuccess: (res) => {
        if (res.success) {
          router.refresh();
        } else {
          setError(res.message || "Failed to switch village");
        }
      },
      onError: () => setError("Failed to switch village"),
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
        value={currentVillageId ?? ""}
        onChange={handleChange}
        disabled={isPending || villages.length === 0}
        className="bg-transparent font-bold text-sm focus:outline-none cursor-pointer"
        style={{ color: "#0a5b62" }}
      >
        {!currentVillageId && <option value="">Select a village</option>}
        {villages.map((v) => (
          <option key={v._id} value={v._id}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}
