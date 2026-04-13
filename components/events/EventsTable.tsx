"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminEvents, useDeleteEvent } from "@/src/hooks/useEvents";
import { Event } from "@/src/types";
import { formatDate } from "@/lib/utils";

interface EventsTableProps {
  initialEvents: Event[];
}

const typeConfig: Record<string, { bg: string; color: string }> = {
  event: { bg: "#ccfbf1", color: "#0f766e" },
  poster: { bg: "#dbeafe", color: "#1d4ed8" },
  promotion: { bg: "#ede9fe", color: "#7e22ce" },
};

export default function EventsTable({ initialEvents }: EventsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");

  const params =
    search || typeFilter
      ? {
          ...(search ? { search } : {}),
          ...(typeFilter ? { type: typeFilter } : {}),
        }
      : undefined;

  const { data: queryResult, isLoading } = useAdminEvents(params);
  const deleteEvent = useDeleteEvent();

  // Always prefer fresh query data so the list updates immediately after mutations
  // (delete/create). Fall back to SSR initialEvents only before the first fetch resolves.
  const rawEvents = queryResult?.data ?? initialEvents;

  const events = statusFilter
    ? rawEvents.filter((e) => {
        const isUpcoming = new Date(e.time) > new Date();
        return statusFilter === "upcoming" ? isUpcoming : !isUpcoming;
      })
    : rawEvents;

  async function handleDelete() {
    if (!deleteId) return;
    await deleteEvent.mutateAsync(deleteId);
    setDeleteId(null);
    setDeleteTitle("");
  }

  function handleClearAll() {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
  }

  function getStatus(time: string) {
    return new Date(time) > new Date() ? "Upcoming" : "Past";
  }

  return (
    <>
      {/* Filter Card */}
      <div
        className="bg-white rounded-xl p-4 shadow-sm border mb-6"
        style={{ borderColor: "#e2e8f0" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none"
              style={{ borderColor: "#e2e8f0" }}
              placeholder="Search events..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Type
            </label>
            <select
              className="flex-1 py-2 border rounded-lg text-sm outline-none"
              style={{ borderColor: "#e2e8f0" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="event">Event</option>
              <option value="poster">Poster</option>
              <option value="promotion">Promotion</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Status
            </label>
            <select
              className="flex-1 py-2 border rounded-lg text-sm outline-none"
              style={{ borderColor: "#e2e8f0" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
          <div className="flex items-center justify-end">
            <button
              className="font-bold text-sm hover:underline"
              style={{ color: "#0D5C63" }}
              onClick={handleClearAll}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">No events found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{ backgroundColor: "rgba(248,250,252,0.5)", borderColor: "#e2e8f0" }}
              >
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {events.map((event) => {
                const tc = typeConfig[event.type] || { bg: "#f1f5f9", color: "#596065" };
                const status = getStatus(event.time);
                return (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{event.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider"
                        style={{ backgroundColor: tc.bg, color: tc.color }}
                      >
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{formatDate(event.time)}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(event.time).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {event.place}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {status === "Upcoming" ? (
                        <span className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                          Upcoming
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                          <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                          Past
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/events/${event.id}`}
                          className="p-2 text-slate-400 hover:text-[#0D5C63] transition-colors"
                          title="View"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                        <Link
                          href={`/events/${event.id}/edit`}
                          className="p-2 text-slate-400 hover:text-[#0D5C63] transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </Link>
                        <button
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete"
                          onClick={() => {
                            setDeleteId(event.id);
                            setDeleteTitle(event.title);
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
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
          style={{ backgroundColor: "rgba(248,250,252,0.5)", borderColor: "#e2e8f0" }}
        >
          <span className="text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold" style={{ color: "#0D5C63" }}>
              {events.length}
            </span>{" "}
            results
          </span>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-slate-400 cursor-not-allowed font-bold">
              <span className="material-symbols-outlined">chevron_left</span>
              Prev
            </button>
            <div className="flex items-center gap-2">
              <button
                className="h-8 w-8 rounded text-white font-bold text-xs"
                style={{ backgroundColor: "#0D5C63" }}
              >
                1
              </button>
            </div>
            <button
              className="flex items-center gap-1 font-bold"
              style={{ color: "#0D5C63" }}
            >
              Next
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#fa746f" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "28px", color: "#6e0a12" }}
                >
                  warning
                </span>
              </div>
              <h3 className="text-xl font-extrabold mb-2" style={{ color: "#2c3338" }}>
                Delete Event?
              </h3>
              <p style={{ color: "#596065" }} className="leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-bold" style={{ color: "#2c3338" }}>
                  {deleteTitle}
                </span>
                ? This action is permanent and cannot be undone.
              </p>
            </div>
            <div
              className="px-6 py-4 flex flex-col sm:flex-row-reverse gap-3"
              style={{ backgroundColor: "#f0f4f8" }}
            >
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-lg shadow-md transition-colors text-white disabled:opacity-60"
                style={{ backgroundColor: "#a83836" }}
                disabled={deleteEvent.isPending}
                onClick={handleDelete}
              >
                {deleteEvent.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold border rounded-lg transition-colors"
                style={{ color: "#596065", borderColor: "#abb3b9" }}
                onClick={() => {
                  setDeleteId(null);
                  setDeleteTitle("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
