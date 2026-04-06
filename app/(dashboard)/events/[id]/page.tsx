"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEvent } from "@/src/hooks/useEvents";
import { formatDate } from "@/lib/utils";

const typeConfig: Record<string, { bg: string; color: string }> = {
  event: { bg: "#ccfbf1", color: "#0f766e" },
  poster: { bg: "#dbeafe", color: "#1d4ed8" },
  promotion: { bg: "#ede9fe", color: "#7e22ce" },
};

export default function EventViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading, isError } = useEvent(id);

  const event = result?.data;

  if (isLoading) {
    return (
      <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
          Loading event details...
        </div>
      </main>
    );
  }

  if (isError || !event) {
    return (
      <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
          <p className="text-slate-400 font-medium">Event not found.</p>
          <Link href="/events" className="font-bold text-sm" style={{ color: "#0D5C63" }}>
            Back to Events
          </Link>
        </div>
      </main>
    );
  }

  const tc = typeConfig[event.type] || { bg: "#f1f5f9", color: "#596065" };
  const isUpcoming = new Date(event.time) > new Date();

  return (
    <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm font-medium mb-6" style={{ color: "#596065" }}>
        <Link href="/events" className="hover:underline" style={{ color: "#596065" }}>
          Events
        </Link>
        <span className="mx-2" style={{ color: "#747c81" }}>/</span>
        <span className="font-bold" style={{ color: "#21686f" }}>Event Details</span>
      </nav>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
          {event.image && (
            <div className="h-56 w-full overflow-hidden">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-[11px] font-black px-3 py-1 rounded uppercase tracking-wider"
                  style={{ backgroundColor: tc.bg, color: tc.color }}
                >
                  {event.type}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    isUpcoming ? "text-amber-600" : "text-slate-400"
                  }`}
                  style={{ backgroundColor: isUpcoming ? "#fef3c7" : "#f1f5f9" }}
                >
                  <span className={`h-2 w-2 rounded-full ${isUpcoming ? "bg-amber-500" : "bg-slate-300"}`}></span>
                  {isUpcoming ? "Upcoming" : "Past"}
                </span>
              </div>
              <Link
                href={`/events/${event.id}/edit`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition-all hover:brightness-95"
                style={{ backgroundColor: "#0D5C63", color: "#ffffff" }}
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Edit
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#2c3338" }}>
              {event.title}
            </h1>
            {event.ctaText && (
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
                style={{ backgroundColor: "#ffddb8", color: "#744800" }}
              >
                {event.ctaText}
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5" style={{ borderColor: "#e2e8f0" }}>
            <h3 className="font-extrabold text-sm uppercase tracking-wider" style={{ color: "#596065" }}>
              Event Information
            </h3>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#abeef6" }}>
                <span className="material-symbols-outlined text-lg" style={{ color: "#0a5b62" }}>calendar_today</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="font-semibold mt-0.5" style={{ color: "#2c3338" }}>{formatDate(event.time)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#abeef6" }}>
                <span className="material-symbols-outlined text-lg" style={{ color: "#0a5b62" }}>schedule</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</p>
                <p className="font-semibold mt-0.5" style={{ color: "#2c3338" }}>
                  {new Date(event.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#abeef6" }}>
                <span className="material-symbols-outlined text-lg" style={{ color: "#0a5b62" }}>location_on</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                <p className="font-semibold mt-0.5" style={{ color: "#2c3338" }}>{event.place}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#abeef6" }}>
                <span className="material-symbols-outlined text-lg" style={{ color: "#0a5b62" }}>person_pin_circle</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conductor</p>
                <p className="font-semibold mt-0.5" style={{ color: "#2c3338" }}>{event.conductorName}</p>
              </div>
            </div>
          </div>

          {/* Description & Tags */}
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5" style={{ borderColor: "#e2e8f0" }}>
            <h3 className="font-extrabold text-sm uppercase tracking-wider" style={{ color: "#596065" }}>
              Description
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "#596065" }}>
              {event.description}
            </p>
            {event.tags && event.tags.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: "#f1f5f9", color: "#596065" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="flex items-center gap-4">
          <Link
            href="/events"
            className="flex items-center gap-1.5 font-bold text-sm hover:underline"
            style={{ color: "#596065" }}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Events
          </Link>
        </div>
      </div>
    </main>
  );
}
