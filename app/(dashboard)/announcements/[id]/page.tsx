"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAdminAnnouncements } from "@/src/hooks/useAnnouncements";
import { formatDate } from "@/lib/utils";

export default function AnnouncementViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading } = useAdminAnnouncements();

  const announcement = result?.data?.find((a) => a.id === id);

  if (isLoading) {
    return (
      <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
          Loading announcement details...
        </div>
      </main>
    );
  }

  if (!announcement) {
    return (
      <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
          <p className="text-slate-400 font-medium">Announcement not found.</p>
          <Link href="/announcements" className="font-bold text-sm" style={{ color: "#0D5C63" }}>
            Back to Announcements
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm font-medium mb-6" style={{ color: "#596065" }}>
        <Link href="/announcements" className="hover:underline" style={{ color: "#596065" }}>
          Announcements
        </Link>
        <span className="mx-2" style={{ color: "#747c81" }}>/</span>
        <span className="font-bold" style={{ color: "#21686f" }}>Announcement Details</span>
      </nav>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8" style={{ borderColor: "#e2e8f0" }}>
          <div className="flex items-center gap-3 mb-6 border-b pb-6" style={{ borderColor: "#f1f5f9" }}>
            <div className="p-3 rounded-full" style={{ backgroundColor: "#fef3c7" }}>
              <span className="material-symbols-outlined" style={{ color: "#d97706" }}>campaign</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold" style={{ color: "#2c3338" }}>
                {announcement.title}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Published {formatDate(announcement.time)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content</p>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#596065" }}>
                {announcement.description}
              </p>
            </div>
          </div>
        </div>

        {/* Media Card */}
        {(announcement.image || announcement.video || announcement.voiceNote) && (
          <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: "#e2e8f0" }}>
            <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4" style={{ color: "#596065" }}>
              Media Attachments
            </h3>
            <div className="space-y-4">
              {announcement.image && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Image</p>
                  <img
                    src={announcement.image}
                    alt="Announcement image"
                    className="rounded-lg max-h-64 object-contain border"
                    style={{ borderColor: "#e2e8f0" }}
                  />
                </div>
              )}
              {announcement.video && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Video</p>
                  <video
                    src={announcement.video}
                    controls
                    className="rounded-lg w-full max-h-64 border"
                    style={{ borderColor: "#e2e8f0" }}
                  />
                </div>
              )}
              {announcement.voiceNote && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Voice Note</p>
                  <audio src={announcement.voiceNote} controls className="w-full" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back Link */}
        <div>
          <Link
            href="/announcements"
            className="flex items-center gap-1.5 font-bold text-sm hover:underline w-fit"
            style={{ color: "#596065" }}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Announcements
          </Link>
        </div>
      </div>
    </main>
  );
}
