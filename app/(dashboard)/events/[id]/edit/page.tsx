"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useEvent, useUpdateEvent, useDeleteEvent } from "@/src/hooks/useEvents";
import { useQueryClient } from "@tanstack/react-query";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [apiError, setApiError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: result, isLoading } = useEvent(id);
  const updateEvent = useUpdateEvent(id);
  const deleteEvent = useDeleteEvent();

  const event = result?.data;

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      place: "",
      date: "",
      time: "",
      conductorName: "",
      type: "event",
      ctaText: "",
      tags: "",
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.title) errors.title = "Title is required";
      if (!values.description) errors.description = "Description is required";
      if (!values.place) errors.place = "Location is required";
      if (!values.conductorName) errors.conductorName = "Conductor name is required";
      if (!values.date) errors.date = "Date is required";
      if (!values.time) errors.time = "Time is required";
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const isoTime = new Date(`${values.date}T${values.time}`).toISOString();
        const tagArr = values.tags
          ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];

        const res = await updateEvent.mutateAsync({
          title: values.title,
          description: values.description,
          place: values.place,
          time: isoTime,
          conductorName: values.conductorName,
          type: values.type,
          ...(values.ctaText ? { ctaText: values.ctaText } : {}),
          ...(tagArr.length > 0 ? { tags: tagArr } : {}),
        });

        if (res.success) {
          router.push("/events");
        } else {
          setApiError(res.message || "Failed to update event.");
        }
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (event) {
      const dt = new Date(event.time);
      const date = dt.toISOString().split("T")[0];
      const time = dt.toTimeString().slice(0, 5);
      formik.resetForm({
        values: {
          title: event.title ?? "",
          description: event.description ?? "",
          place: event.place ?? "",
          date,
          time,
          conductorName: event.conductorName ?? "",
          type: event.type ?? "event",
          ctaText: event.ctaText ?? "",
          tags: [...new Set(event.tags ?? [])].join(", "),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  async function handleDelete() {
    await deleteEvent.mutateAsync(id);
    queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    router.push("/events");
  }

  const fieldError = (name: string) => {
    const touched = formik.touched as Record<string, boolean>;
    const errors = formik.errors as Record<string, string>;
    return touched[name] && errors[name] ? errors[name] : null;
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#0D5C63", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8">
        <p className="text-red-600 font-semibold">Event not found.</p>
        <Link href="/events" className="text-teal-700 hover:underline mt-2 inline-block">← Back to Events</Link>
      </div>
    );
  }

  return (
    <main className="pt-0 p-8 min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm font-medium" style={{ color: "#596065" }}>
        <Link href="/events" className="hover:underline transition-colors">Events</Link>
        <span className="mx-2" style={{ color: "#abb3b9" }}>/</span>
        <span style={{ color: "#2c3338" }}>Edit Event</span>
      </nav>

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border" style={{ borderColor: "#dce3e9" }}>
          <div className="p-6 border-b flex items-center gap-3" style={{ borderColor: "#dce3e9" }}>
            <h2 className="text-xl font-bold" style={{ color: "#0d5c63" }}>Edit Event</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: "#abeef6", color: "#0a5b62" }}>
              Editing
            </span>
          </div>

          <div className="p-8">
            {apiError && (
              <div className="p-3 rounded-lg text-sm font-medium mb-6" style={{ backgroundColor: "rgba(168,56,54,0.1)", color: "#a83836" }}>
                {apiError}
              </div>
            )}

            {/* Current image (read-only — backend PATCH does not accept file uploads) */}
            {event.image && (
              <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#596065" }}>Current Image</p>
                <img src={event.image} alt="Event cover" className="w-40 h-28 object-cover rounded-lg" />
                <p className="text-[10px] text-slate-400 mt-2">Image replacement is not supported on edit.</p>
              </div>
            )}

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
              onSubmit={formik.handleSubmit}
            >
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                    Event Title <span style={{ color: "#a83836" }}>*</span>
                  </label>
                  <input
                    className="w-full rounded-lg px-4 py-2.5 border outline-none"
                    style={{ borderColor: fieldError("title") ? "#a83836" : "#abb3b9", backgroundColor: "#ffffff" }}
                    name="title" type="text"
                    value={formik.values.title}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                  />
                  {fieldError("title") && <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("title")}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>Date <span style={{ color: "#a83836" }}>*</span></label>
                    <div className="relative">
                      <input
                        className="w-full rounded-lg pl-10 pr-4 py-2.5 border outline-none"
                        style={{ borderColor: fieldError("date") ? "#a83836" : "#abb3b9", backgroundColor: "#ffffff" }}
                        name="date" type="date"
                        value={formik.values.date}
                        onChange={formik.handleChange} onBlur={formik.handleBlur}
                      />
                      <span className="material-symbols-outlined absolute left-3 top-2.5" style={{ fontSize: "20px", color: "#abb3b9" }}>calendar_today</span>
                    </div>
                    {fieldError("date") && <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("date")}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>Time <span style={{ color: "#a83836" }}>*</span></label>
                    <div className="relative">
                      <input
                        className="w-full rounded-lg pl-10 pr-4 py-2.5 border outline-none"
                        style={{ borderColor: fieldError("time") ? "#a83836" : "#abb3b9", backgroundColor: "#ffffff" }}
                        name="time" type="time"
                        value={formik.values.time}
                        onChange={formik.handleChange} onBlur={formik.handleBlur}
                      />
                      <span className="material-symbols-outlined absolute left-3 top-2.5" style={{ fontSize: "20px", color: "#abb3b9" }}>schedule</span>
                    </div>
                    {fieldError("time") && <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("time")}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>Location/Place <span style={{ color: "#a83836" }}>*</span></label>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg pl-10 pr-4 py-2.5 border outline-none"
                      style={{ borderColor: fieldError("place") ? "#a83836" : "#abb3b9", backgroundColor: "#ffffff" }}
                      name="place" type="text"
                      value={formik.values.place}
                      onChange={formik.handleChange} onBlur={formik.handleBlur}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-2.5" style={{ fontSize: "20px", color: "#abb3b9" }}>location_on</span>
                  </div>
                  {fieldError("place") && <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("place")}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>Conductor Name <span style={{ color: "#a83836" }}>*</span></label>
                    <input
                      className="w-full rounded-lg px-4 py-2.5 border outline-none"
                      style={{ borderColor: fieldError("conductorName") ? "#a83836" : "#abb3b9", backgroundColor: "#ffffff" }}
                      name="conductorName" type="text"
                      value={formik.values.conductorName}
                      onChange={formik.handleChange} onBlur={formik.handleBlur}
                    />
                    {fieldError("conductorName") && <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("conductorName")}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>Event Type</label>
                    <select
                      className="w-full rounded-lg px-4 py-2.5 border outline-none"
                      style={{ borderColor: "#abb3b9", backgroundColor: "#ffffff" }}
                      name="type" value={formik.values.type} onChange={formik.handleChange}
                    >
                      <option value="event">Event</option>
                      <option value="poster">Poster</option>
                      <option value="promotion">Promotion</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>Tags</label>
                  <input
                    className="w-full rounded-lg px-4 py-2.5 border outline-none"
                    style={{ borderColor: "#abb3b9", backgroundColor: "#ffffff" }}
                    name="tags" type="text" placeholder="Separate with commas"
                    value={formik.values.tags} onChange={formik.handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>CTA Text</label>
                  <input
                    className="w-full rounded-lg px-4 py-2.5 border outline-none"
                    style={{ borderColor: "#abb3b9", backgroundColor: "#ffffff" }}
                    name="ctaText" type="text" placeholder="e.g. Join Now"
                    value={formik.values.ctaText} onChange={formik.handleChange}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>Description <span style={{ color: "#a83836" }}>*</span></label>
                  <textarea
                    className="w-full rounded-lg px-4 py-2.5 border outline-none"
                    style={{ borderColor: fieldError("description") ? "#a83836" : "#abb3b9", backgroundColor: "#ffffff" }}
                    name="description" rows={10}
                    value={formik.values.description}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                  />
                  {fieldError("description") && <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("description")}</p>}
                </div>
              </div>

              {/* Full Width Actions */}
              <div className="md:col-span-2 pt-6 flex items-center justify-between border-t" style={{ borderColor: "#dce3e9" }}>
                <button
                  className="px-6 py-2.5 font-bold border-2 rounded-lg"
                  style={{ color: "#0d5c63", borderColor: "rgba(13,92,99,0.1)" }}
                  type="button" onClick={() => router.push("/events")}
                >
                  Cancel
                </button>
                <button
                  className="px-8 py-2.5 font-extrabold rounded-lg shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                  style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
                  type="submit" disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Updating...
                    </span>
                  ) : (
                    <>Update Event <span className="material-symbols-outlined">arrow_forward</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="flex justify-start px-2">
          <button
            className="flex items-center gap-2 font-semibold hover:underline"
            style={{ color: "#a83836" }}
            onClick={() => setShowDeleteModal(true)}
          >
            <span className="material-symbols-outlined">delete</span>
            Delete this event
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#fa746f" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#6e0a12" }}>warning</span>
              </div>
              <h3 className="text-xl font-extrabold mb-2" style={{ color: "#2c3338" }}>Delete Event?</h3>
              <p style={{ color: "#596065" }} className="leading-relaxed">
                Are you sure you want to delete <span className="font-bold" style={{ color: "#2c3338" }}>{event.title}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-col sm:flex-row-reverse gap-3" style={{ backgroundColor: "#f0f4f8" }}>
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-lg shadow-md text-white disabled:opacity-60"
                style={{ backgroundColor: "#a83836" }}
                disabled={deleteEvent.isPending} onClick={handleDelete}
              >
                {deleteEvent.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold border rounded-lg"
                style={{ color: "#596065", borderColor: "#abb3b9" }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
