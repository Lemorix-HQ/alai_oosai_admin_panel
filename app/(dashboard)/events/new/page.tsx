"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useRef, useState } from "react";
import { createEventAction } from "@/src/actions/events.actions";
import TamilInput from "@/components/ui/TamilInput";
import TamilTextarea from "@/components/ui/TamilTextarea";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function NewEventPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tamilMode, setTamilMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("description", values.description);
        formData.append("place", values.place);
        formData.append("time", isoTime);
        formData.append("conductorName", values.conductorName);
        formData.append("type", values.type);
        if (values.ctaText) formData.append("ctaText", values.ctaText);
        if (values.tags) {
          const tagArr = values.tags.split(",").map((t) => t.trim()).filter(Boolean);
          tagArr.forEach((tag) => formData.append("tags", tag));
        }
        if (imageFile) formData.append("image", imageFile);

        const res = await createEventAction(formData);
        if (res.success) {
          router.push("/events");
        } else {
          setApiError(res.message || "Failed to create event.");
        }
      } catch {
        setApiError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fieldError = (name: string) => {
    const touched = formik.touched as Record<string, boolean>;
    const errors = formik.errors as Record<string, string>;
    return touched[name] && errors[name] ? errors[name] : null;
  };

  return (
    <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm font-medium mb-6" style={{ color: "#596065" }}>
        <Link href="/events" className="hover:underline transition-colors" style={{ color: "#596065" }}>
          Events
        </Link>
        <span className="mx-2" style={{ color: "#747c81" }}>/</span>
        <span className="font-bold" style={{ color: "#21686f" }}>
          Add New Event
        </span>
      </nav>

      {/* Form Card Container */}
      <section className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8" style={{ borderColor: "#e2e8f0" }}>
          <div className="flex items-center gap-3 mb-8 border-b pb-6" style={{ borderColor: "#f1f5f9" }}>
            <span
              className="material-symbols-outlined p-2 rounded-lg"
              style={{ color: "#0d5c63", backgroundColor: "#abeef6" }}
            >
              add_circle
            </span>
            <h3 className="text-2xl font-extrabold tracking-tight" style={{ color: "#2c3338" }}>
              Create Event
            </h3>
          </div>

          <LanguageToggle tamilMode={tamilMode} onToggle={() => setTamilMode(!tamilMode)} />

          {apiError && (
            <div
              className="p-3 rounded-lg text-sm font-medium mb-6"
              style={{ backgroundColor: "rgba(168,56,54,0.1)", color: "#a83836" }}
            >
              {apiError}
            </div>
          )}

          <form className="space-y-6" onSubmit={formik.handleSubmit}>
            {/* Row 1: Event Title */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }} htmlFor="title">
                Event Title <span style={{ color: "#a83836" }}>*</span>
              </label>
              <TamilInput
                tamilMode={tamilMode}
                className="w-full rounded-lg px-4 py-3 transition-all outline-none border"
                style={{
                  borderColor: fieldError("title") ? "#a83836" : "#abb3b9",
                  backgroundColor: "#f7f9fc",
                  color: "#2c3338",
                }}
                id="title"
                name="title"
                placeholder="Enter a descriptive title for the event"
                type="text"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {fieldError("title") && (
                <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("title")}</p>
              )}
            </div>

            {/* Row 2: Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }} htmlFor="date">
                  Date <span style={{ color: "#a83836" }}>*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#abb3b9" }}>
                    calendar_today
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-all"
                    style={{
                      borderColor: fieldError("date") ? "#a83836" : "#abb3b9",
                      backgroundColor: "#f7f9fc",
                    }}
                    id="date"
                    name="date"
                    type="date"
                    value={formik.values.date}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {fieldError("date") && (
                  <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("date")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }} htmlFor="time">
                  Time <span style={{ color: "#a83836" }}>*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#abb3b9" }}>
                    schedule
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-all"
                    style={{
                      borderColor: fieldError("time") ? "#a83836" : "#abb3b9",
                      backgroundColor: "#f7f9fc",
                    }}
                    id="time"
                    name="time"
                    type="time"
                    value={formik.values.time}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {fieldError("time") && (
                  <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("time")}</p>
                )}
              </div>
            </div>

            {/* Row 3: Location & Conductor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }} htmlFor="place">
                  Location / Place <span style={{ color: "#a83836" }}>*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#abb3b9" }}>
                    location_on
                  </span>
                  <TamilInput
                    tamilMode={tamilMode}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-all"
                    style={{
                      borderColor: fieldError("place") ? "#a83836" : "#abb3b9",
                      backgroundColor: "#f7f9fc",
                    }}
                    id="place"
                    name="place"
                    placeholder="Ex: Community Center"
                    type="text"
                    value={formik.values.place}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {fieldError("place") && (
                  <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("place")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }} htmlFor="conductorName">
                  Conductor Name <span style={{ color: "#a83836" }}>*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#abb3b9" }}>
                    person_pin_circle
                  </span>
                  <TamilInput
                    tamilMode={tamilMode}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-all"
                    style={{
                      borderColor: fieldError("conductorName") ? "#a83836" : "#abb3b9",
                      backgroundColor: "#f7f9fc",
                    }}
                    id="conductorName"
                    name="conductorName"
                    placeholder="Person leading the event"
                    type="text"
                    value={formik.values.conductorName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {fieldError("conductorName") && (
                  <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("conductorName")}</p>
                )}
              </div>
            </div>

            {/* Row 4: Event Type & CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }} htmlFor="type">
                  Event Type <span style={{ color: "#a83836" }}>*</span>
                </label>
                <select
                  className="w-full rounded-lg px-4 py-3 outline-none border transition-all"
                  style={{
                    borderColor: fieldError("type") ? "#a83836" : "#abb3b9",
                    backgroundColor: "#f7f9fc",
                  }}
                  id="type"
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="event">Event</option>
                  <option value="poster">Poster</option>
                  <option value="promotion">Promotion</option>
                </select>
                {fieldError("type") && (
                  <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("type")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }} htmlFor="ctaText">
                  CTA Text
                </label>
                <TamilInput
                  tamilMode={tamilMode}
                  className="w-full rounded-lg px-4 py-3 outline-none border transition-all"
                  style={{ borderColor: "#abb3b9", backgroundColor: "#f7f9fc" }}
                  id="ctaText"
                  name="ctaText"
                  placeholder="Ex: Join Now, Register"
                  type="text"
                  value={formik.values.ctaText}
                  onChange={formik.handleChange}
                />
              </div>
            </div>

            {/* Row 5: Tags */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }} htmlFor="tags">
                Tags
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#abb3b9" }}>
                  sell
                </span>
                <TamilInput
                  tamilMode={tamilMode}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-all"
                  style={{ borderColor: "#abb3b9", backgroundColor: "#f7f9fc" }}
                  id="tags"
                  name="tags"
                  placeholder="Enter tags separated by commas"
                  type="text"
                  value={formik.values.tags}
                  onChange={formik.handleChange}
                />
              </div>
            </div>

            {/* Row 6: Description */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }} htmlFor="description">
                Description <span style={{ color: "#a83836" }}>*</span>
              </label>
              <TamilTextarea
                tamilMode={tamilMode}
                className="w-full rounded-lg px-4 py-3 border outline-none transition-all"
                style={{
                  borderColor: fieldError("description") ? "#a83836" : "#abb3b9",
                  backgroundColor: "#f7f9fc",
                }}
                id="description"
                name="description"
                placeholder="Provide more details about the event..."
                rows={4}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {fieldError("description") && (
                <p className="text-xs mt-1" style={{ color: "#a83836" }}>{fieldError("description")}</p>
              )}
            </div>

            {/* Row 7: Cover Image */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#2c3338" }}>
                Cover Image
              </label>
              <div
                className="relative group border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors"
                style={{ borderColor: "rgba(13,92,99,0.3)", backgroundColor: "rgba(171,238,246,0.05)" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#abeef6" }}
                >
                  <span className="material-symbols-outlined text-3xl" style={{ color: "#21686f" }}>
                    cloud_upload
                  </span>
                </div>
                {imageFile ? (
                  <p className="text-sm font-bold" style={{ color: "#21686f" }}>
                    {imageFile.name}
                  </p>
                ) : (
                  <>
                    <h4 className="text-lg font-bold tracking-tight" style={{ color: "#2c3338" }}>
                      Drag & drop image here or click to browse
                    </h4>
                    <p className="text-sm mt-1 mb-6" style={{ color: "#abb3b9" }}>
                      High resolution landscape images work best (Max 5MB)
                    </p>
                  </>
                )}
                <button
                  className="px-6 py-2.5 rounded-lg font-bold hover:brightness-95 active:scale-95 transition-all shadow-sm mt-4"
                  style={{ backgroundColor: "#865400", color: "#744800" }}
                  type="button"
                >
                  Browse File
                </button>
                <input
                  ref={fileInputRef}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setImageFile(e.target.files[0]);
                  }}
                />
              </div>
            </div>
          </form>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-4 mt-10 pt-8 border-t" style={{ borderColor: "#f1f5f9" }}>
            <Link
              href="/events"
              className="px-8 py-3 rounded-lg font-bold border-2 transition-all active:scale-95"
              style={{ color: "#0D5C63", borderColor: "#0D5C63" }}
            >
              Cancel
            </Link>
            <button
              className="px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:brightness-95 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#865400", color: "#5b3700" }}
              type="submit"
              disabled={formik.isSubmitting}
              onClick={() => formik.handleSubmit()}
            >
              {formik.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </span>
              ) : (
                <>
                  Save Event
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Decorative Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm flex items-start gap-4" style={{ borderColor: "#f1f5f9" }}>
          <div className="p-3 rounded-full" style={{ backgroundColor: "#ffddb8" }}>
            <span className="material-symbols-outlined" style={{ color: "#744800" }}>lightbulb</span>
          </div>
          <div>
            <h5 className="font-bold mb-1" style={{ color: "#2c3338" }}>Visual Tip</h5>
            <p className="text-sm leading-relaxed" style={{ color: "#596065" }}>
              Use bright, high-contrast posters to catch more attention on the app feed.
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm flex items-start gap-4" style={{ borderColor: "#f1f5f9" }}>
          <div className="p-3 rounded-full" style={{ backgroundColor: "#b8dbfe" }}>
            <span className="material-symbols-outlined" style={{ color: "#2a4e6a" }}>notifications_active</span>
          </div>
          <div>
            <h5 className="font-bold mb-1" style={{ color: "#2c3338" }}>Push Alert</h5>
            <p className="text-sm leading-relaxed" style={{ color: "#596065" }}>
              Saving this event will automatically notify 450+ parishioners in this zone.
            </p>
          </div>
        </div>
        <div className="p-6 rounded-lg shadow-sm flex items-start gap-4 text-white" style={{ backgroundColor: "#0D5C63" }}>
          <div className="p-3 rounded-full bg-white/10">
            <span className="material-symbols-outlined" style={{ color: "#fbbf24" }}>auto_awesome</span>
          </div>
          <div>
            <h5 className="font-bold mb-1">AI Assist</h5>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              Let our system generate a draft description based on your title.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
