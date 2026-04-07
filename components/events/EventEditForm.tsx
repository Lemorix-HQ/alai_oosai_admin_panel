"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useState } from "react";
import { Event } from "@/src/types";
import { updateEventAction, deleteEventAction, UpdateEventPayload } from "@/src/actions/events.actions";
import TamilInput from "@/components/ui/TamilInput";
import TamilTextarea from "@/components/ui/TamilTextarea";
import LanguageToggle from "@/components/ui/LanguageToggle";

interface EventEditFormProps {
  event: Event;
}

export default function EventEditForm({ event }: EventEditFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [tamilMode, setTamilMode] = useState(true);

  // Parse ISO date string to date and time parts
  const eventDate = event.time ? new Date(event.time).toISOString().split("T")[0] : "";
  const eventTime = event.time
    ? new Date(event.time).toTimeString().slice(0, 5)
    : "";

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: event.title || "",
      description: event.description || "",
      place: event.place || "",
      date: eventDate,
      time: eventTime,
      conductorName: event.conductorName || "",
      type: event.type || "event",
      ctaText: event.ctaText || "",
      tags: (event.tags || []).join(", "),
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.title) errors.title = "This field is required";
      if (!values.description) errors.description = "Description is required";
      if (!values.place) errors.place = "This field is required";
      if (!values.conductorName) errors.conductorName = "This field is required";
      if (!values.type) errors.type = "Type is required";
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
        const payload: UpdateEventPayload = {
          title: values.title,
          description: values.description,
          place: values.place,
          time: isoTime,
          conductorName: values.conductorName,
          type: values.type,
          ...(values.ctaText ? { ctaText: values.ctaText } : {}),
          ...(tagArr.length > 0 ? { tags: tagArr } : {}),
        };

        const res = await updateEventAction(event.id, payload);
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

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await deleteEventAction(event.id);
      if (res.success) {
        setShowDeleteModal(false);
        router.push("/events");
      } else {
        setApiError(res.message || "Failed to delete event.");
        setShowDeleteModal(false);
      }
    } catch {
      setApiError("Network error. Please try again.");
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  const fieldError = (name: string) => {
    const touched = formik.touched as Record<string, boolean>;
    const errors = formik.errors as Record<string, string>;
    return touched[name] && errors[name] ? errors[name] : null;
  };

  return (
    <main className="pt-0 p-8 min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm font-medium" style={{ color: "#596065" }}>
        <Link href="/events" className="hover:underline transition-colors">
          Events
        </Link>
        <span className="mx-2" style={{ color: "#abb3b9" }}>/</span>
        <span style={{ color: "#2c3338" }}>Edit Event</span>
      </nav>

      {/* Form Section */}
      <div className="max-w-5xl mx-auto space-y-6">
        {apiError && (
          <div
            className="p-3 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "rgba(168,56,54,0.1)", color: "#a83836" }}
          >
            {apiError}
          </div>
        )}

        <div
          className="bg-white rounded-xl shadow-sm overflow-hidden border"
          style={{ borderColor: "#dce3e9" }}
        >
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "#dce3e9" }}>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold" style={{ color: "#0d5c63" }}>
                Edit Event
              </h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: "#abeef6", color: "#0a5b62" }}
              >
                Editing
              </span>
            </div>
          </div>

          <div className="p-8">
            <LanguageToggle tamilMode={tamilMode} onToggle={() => setTamilMode(!tamilMode)} />
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
              onSubmit={formik.handleSubmit}
            >
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                    Event Title <span style={{ color: "#a83836" }}>*</span>
                  </label>
                  <TamilInput
                    tamilMode={tamilMode}
                    className="w-full rounded-lg px-4 py-2.5 border outline-none"
                    style={{
                      borderColor: fieldError("title") ? "#a83836" : "#abb3b9",
                      backgroundColor: "#ffffff",
                    }}
                    name="title"
                    type="text"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {fieldError("title") && (
                    <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("title")}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                      Date <span style={{ color: "#a83836" }}>*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded-lg pl-10 pr-4 py-2.5 border outline-none"
                        style={{
                          borderColor: fieldError("date") ? "#a83836" : "#abb3b9",
                          backgroundColor: "#ffffff",
                        }}
                        name="date"
                        type="date"
                        value={formik.values.date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      <span
                        className="material-symbols-outlined absolute left-3 top-2.5"
                        style={{ fontSize: "20px", color: "#abb3b9" }}
                      >
                        calendar_today
                      </span>
                    </div>
                    {fieldError("date") && (
                      <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("date")}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                      Time <span style={{ color: "#a83836" }}>*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded-lg pl-10 pr-4 py-2.5 border outline-none"
                        style={{
                          borderColor: fieldError("time") ? "#a83836" : "#abb3b9",
                          backgroundColor: "#ffffff",
                        }}
                        name="time"
                        type="time"
                        value={formik.values.time}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      <span
                        className="material-symbols-outlined absolute left-3 top-2.5"
                        style={{ fontSize: "20px", color: "#abb3b9" }}
                      >
                        schedule
                      </span>
                    </div>
                    {fieldError("time") && (
                      <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("time")}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                    Location/Place <span style={{ color: "#a83836" }}>*</span>
                  </label>
                  <div className="relative">
                    <TamilInput
                      tamilMode={tamilMode}
                      className="w-full rounded-lg pl-10 pr-4 py-2.5 border outline-none"
                      style={{
                        borderColor: fieldError("place") ? "#a83836" : "#abb3b9",
                        backgroundColor: "#ffffff",
                      }}
                      name="place"
                      type="text"
                      value={formik.values.place}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <span
                      className="material-symbols-outlined absolute left-3 top-2.5"
                      style={{ fontSize: "20px", color: "#abb3b9" }}
                    >
                      location_on
                    </span>
                  </div>
                  {fieldError("place") && (
                    <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("place")}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                      Conductor Name <span style={{ color: "#a83836" }}>*</span>
                    </label>
                    <TamilInput
                      tamilMode={tamilMode}
                      className="w-full rounded-lg px-4 py-2.5 border outline-none"
                      style={{
                        borderColor: fieldError("conductorName") ? "#a83836" : "#abb3b9",
                        backgroundColor: "#ffffff",
                      }}
                      name="conductorName"
                      type="text"
                      value={formik.values.conductorName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {fieldError("conductorName") && (
                      <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("conductorName")}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                      Event Type <span style={{ color: "#a83836" }}>*</span>
                    </label>
                    <select
                      className="w-full rounded-lg px-4 py-2.5 border outline-none"
                      style={{
                        borderColor: fieldError("type") ? "#a83836" : "#abb3b9",
                        backgroundColor: "#ffffff",
                      }}
                      name="type"
                      value={formik.values.type}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="event">Event</option>
                      <option value="poster">Poster</option>
                      <option value="promotion">Promotion</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                    Tags
                  </label>
                  <TamilInput
                    tamilMode={tamilMode}
                    className="w-full rounded-lg px-4 py-2.5 border outline-none"
                    style={{ borderColor: "#abb3b9", backgroundColor: "#ffffff" }}
                    name="tags"
                    type="text"
                    value={formik.values.tags}
                    onChange={formik.handleChange}
                  />
                  <p className="mt-1.5 text-xs italic" style={{ color: "#747c81" }}>
                    Separate tags with commas
                  </p>
                </div>
              </div>

              {/* Right Column: Description & Image */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                    Description <span style={{ color: "#a83836" }}>*</span>
                  </label>
                  <TamilTextarea
                    tamilMode={tamilMode}
                    className="w-full rounded-lg px-4 py-2.5 border outline-none"
                    style={{
                      borderColor: fieldError("description") ? "#a83836" : "#abb3b9",
                      backgroundColor: "#ffffff",
                    }}
                    name="description"
                    rows={4}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {fieldError("description") && (
                    <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("description")}</p>
                  )}
                </div>

                {event.image && (
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#596065" }}>
                      Cover Image
                    </label>
                    <div
                      className="rounded-xl p-4 border"
                      style={{ backgroundColor: "#e9eef3", borderColor: "#abb3b9" }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-white bg-teal-100">
                          <div className="w-full h-full flex items-center justify-center text-teal-700 text-xs font-bold">
                            Current image
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">Image cannot be replaced after upload.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Width Actions */}
              <div
                className="md:col-span-2 pt-6 flex items-center justify-between border-t"
                style={{ borderColor: "#dce3e9" }}
              >
                <button
                  className="px-6 py-2.5 font-bold border-2 rounded-lg transition-colors"
                  style={{
                    color: "#0d5c63",
                    borderColor: "rgba(13,92,99,0.1)",
                  }}
                  type="button"
                  onClick={() => router.push("/events")}
                >
                  Cancel
                </button>
                <button
                  className="px-8 py-2.5 font-extrabold rounded-lg shadow-lg flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
                  type="submit"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Updating...
                    </span>
                  ) : (
                    <>
                      Update Event
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="flex justify-start px-2">
          <button
            className="flex items-center gap-2 font-semibold hover:underline group"
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
                  {event.title}
                </span>
                ? This action is permanent and cannot be undone. All associated data
                will be removed.
              </p>
            </div>
            <div
              className="px-6 py-4 flex flex-col sm:flex-row-reverse gap-3"
              style={{ backgroundColor: "#f0f4f8" }}
            >
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-lg shadow-md transition-colors text-white disabled:opacity-60"
                style={{ backgroundColor: "#a83836" }}
                disabled={deleteLoading}
                onClick={handleDelete}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                className="w-full sm:w-auto px-6 py-2.5 font-bold border rounded-lg transition-colors"
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
