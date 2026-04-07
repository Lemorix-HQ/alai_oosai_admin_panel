"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminAnnouncements } from "@/src/hooks/useAnnouncements";
import { Announcement } from "@/src/types";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

interface AnnouncementsTableProps {
  initialAnnouncements: Announcement[];
}

export default function AnnouncementsTable({ initialAnnouncements }: AnnouncementsTableProps) {
  const [page, setPage] = useState(1);
  const { data: queryResult, isLoading } = useAdminAnnouncements();

  const announcements = queryResult?.data ?? initialAnnouncements;
  const totalPages = Math.max(1, Math.ceil(announcements.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = announcements.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function getMediaIcons(ann: Announcement) {
    const icons: { icon: string; label: string }[] = [];
    if (ann.image) icons.push({ icon: "image", label: "Image" });
    if (ann.video) icons.push({ icon: "video_library", label: "Video" });
    if (ann.voiceNote) icons.push({ icon: "audio_file", label: "Audio" });
    return icons;
  }

  return (
    <>
      {/* Data Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-6" style={{ borderColor: "#f1f5f9" }}>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">No announcements found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{ backgroundColor: "rgba(240,244,248,0.5)", borderColor: "#f1f5f9" }}
              >
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Published Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Media</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#f8fafc" }}>
              {paged.map((ann) => {
                const mediaIcons = getMediaIcons(ann);
                return (
                  <tr key={ann.id} className="hover:bg-white transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold" style={{ color: "#2c3338" }}>
                        {ann.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[300px]">
                        {ann.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(ann.time)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {mediaIcons.length === 0 ? (
                          <span className="text-xs text-gray-300 italic">No media</span>
                        ) : (
                          mediaIcons.map((m, i) => (
                            <span key={i} className="material-symbols-outlined text-gray-400 text-lg" title={m.label}>
                              {m.icon}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/announcements/${ann.id}`}
                        className="p-2 text-slate-400 hover:text-[#0D5C63] transition-colors inline-flex"
                        title="View"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between text-sm"
          style={{ backgroundColor: "rgba(248,250,252,0.5)", borderColor: "#f1f5f9" }}
        >
          <span className="text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold" style={{ color: "#0D5C63" }}>
              {announcements.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, announcements.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold" style={{ color: "#0D5C63" }}>
              {announcements.length}
            </span>{" "}
            results
          </span>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-1 font-bold disabled:text-slate-300 disabled:cursor-not-allowed"
              style={{ color: safePage <= 1 ? undefined : "#0D5C63" }}
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <span className="material-symbols-outlined">chevron_left</span>
              Prev
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className="h-8 w-8 rounded font-bold text-xs transition-colors"
                  style={
                    p === safePage
                      ? { backgroundColor: "#0D5C63", color: "#fff" }
                      : { backgroundColor: "#f1f5f9", color: "#596065" }
                  }
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className="flex items-center gap-1 font-bold disabled:text-slate-300 disabled:cursor-not-allowed"
              style={{ color: safePage >= totalPages ? undefined : "#0D5C63" }}
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

    </>
  );
}
