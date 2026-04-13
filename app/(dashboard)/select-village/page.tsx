"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSwitchVillage, useVillages } from "@/hooks/useVillages";

export default function SelectVillagePage() {
  const router = useRouter();
  const { data, isLoading } = useVillages();
  const switchVillage = useSwitchVillage();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const villages = data?.data ?? [];

  async function handleSelect(villageId: string) {
    setError(null);
    setPendingId(villageId);
    try {
      const res = await switchVillage.mutateAsync(villageId);
      if (!res.success) {
        setError(res.message || "Failed to select village.");
        setPendingId(null);
        return;
      }
      router.push("/");
    } catch {
      setError("Network error. Please try again.");
      setPendingId(null);
    }
  }

  return (
    <main className="pt-0 min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold" style={{ color: "#0D5C63" }}>
              Select a Village
            </h3>
            <p className="text-slate-500 mt-1">
              Pick the village you want to manage. You can switch any time from the header.
            </p>
          </div>
          <Link
            href="/create-village"
            className="text-slate-900 font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
            style={{ backgroundColor: "#F59E0B" }}
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Village
          </Link>
        </div>

        {error && (
          <div
            className="p-3 rounded-lg text-sm font-medium mb-6"
            style={{ backgroundColor: "rgba(168,56,54,0.1)", color: "#a83836" }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-slate-400 text-sm">Loading villages…</div>
        ) : villages.length === 0 ? (
          <div
            className="bg-white rounded-xl shadow-sm border p-10 text-center"
            style={{ borderColor: "#e2e8f0" }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f0fdfc" }}>
              <span className="material-symbols-outlined text-3xl" style={{ color: "#0D5C63" }}>
                location_city
              </span>
            </div>
            <h4 className="text-lg font-bold" style={{ color: "#0D5C63" }}>
              No villages yet
            </h4>
            <p className="text-slate-500 mb-6 mt-1">Create the first village to get started.</p>
            <Link
              href="/create-village"
              className="text-slate-900 font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-xl active:scale-95 transition-all inline-flex items-center gap-2"
              style={{ backgroundColor: "#F59E0B" }}
            >
              <span className="material-symbols-outlined">add_circle</span>
              Create Village
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {villages.map((v) => (
              <button
                key={v._id}
                onClick={() => handleSelect(v._id)}
                disabled={pendingId !== null}
                className="bg-white p-6 rounded-xl shadow-sm border text-left flex flex-col gap-4 hover:shadow-md hover:border-[#abeef6] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ borderColor: "#f1f5f9" }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#f0fdfc" }}
                >
                  <span className="material-symbols-outlined" style={{ color: "#0D5C63" }}>
                    location_city
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold" style={{ color: "#2c3338" }}>
                    {v.name}
                  </h4>
                  {v.createdAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      Created {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-wider mt-auto"
                  style={{ color: pendingId === v._id ? "#a16207" : "#0D5C63" }}
                >
                  {pendingId === v._id ? "Selecting…" : "Select →"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
