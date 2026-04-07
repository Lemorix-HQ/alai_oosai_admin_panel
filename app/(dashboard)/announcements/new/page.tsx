"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useRef, useState } from "react";
import { createAnnouncementAction } from "@/src/actions/announcements.actions";
import { useQueryClient } from "@tanstack/react-query";
import TamilInput from "@/components/ui/TamilInput";
import TamilTextarea from "@/components/ui/TamilTextarea";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function NewAnnouncementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [tamilMode, setTamilMode] = useState(true);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      time: "",
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.title) errors.title = "Title is required";
      if (!values.description) errors.description = "Description is required";
      if (!values.time) errors.time = "Date & time is required";
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("description", values.description);
        formData.append("time", new Date(values.time).toISOString());
        if (imageFile) formData.append("image", imageFile);
        if (videoFile) formData.append("video", videoFile);
        if (audioFile) formData.append("voiceNote", audioFile);

        const res = await createAnnouncementAction(formData);
        if (res.success) {
          queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
          router.push("/announcements");
        } else {
          setApiError(res.message || "Failed to create announcement.");
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
    <main className="p-8 min-h-screen" style={{ backgroundColor: "#f7f9fc" }}>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/announcements" className="hover:underline" style={{ color: "#596065" }}>
          Announcements
        </Link>
        <span className="material-symbols-outlined text-xs" style={{ color: "#abb3b9" }}>
          chevron_right
        </span>
        <span className="font-semibold" style={{ color: "#0D5C63" }}>
          Add New
        </span>
      </nav>

      {/* Form Container */}
      <div className="max-w-5xl">
        <div className="bg-white rounded-xl shadow-sm border p-8" style={{ borderColor: "#f1f5f9" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold" style={{ color: "#0D5C63" }}>
              Create Announcement
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
            {/* Title Field */}
            <div className="space-y-2">
              <label
                className="block text-sm font-bold"
                style={{ color: "#0D5C63" }}
                htmlFor="title"
              >
                Announcement Title <span style={{ color: "#a83836" }}>*</span>
              </label>
              <TamilInput
                tamilMode={tamilMode}
                className="w-full px-4 py-3 rounded-lg border outline-none transition-all text-sm"
                style={{
                  borderColor: fieldError("title") ? "#a83836" : "#abb3b9",
                  backgroundColor: "#f0f4f8",
                  color: "#2c3338",
                }}
                id="title"
                name="title"
                placeholder="Enter a descriptive title"
                type="text"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {fieldError("title") && (
                <p className="text-xs" style={{ color: "#a83836" }}>{fieldError("title")}</p>
              )}
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <label
                className="block text-sm font-bold"
                style={{ color: "#0D5C63" }}
                htmlFor="time"
              >
                Date & Time <span style={{ color: "#a83836" }}>*</span>
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border outline-none transition-all text-sm"
                style={{
                  borderColor: fieldError("time") ? "#a83836" : "#abb3b9",
                  backgroundColor: "#f0f4f8",
                  color: "#2c3338",
                }}
                id="time"
                name="time"
                type="datetime-local"
                value={formik.values.time}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {fieldError("time") && (
                <p className="text-xs" style={{ color: "#a83836" }}>{fieldError("time")}</p>
              )}
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <label
                className="block text-sm font-bold"
                style={{ color: "#0D5C63" }}
                htmlFor="description"
              >
                Content / Description <span style={{ color: "#a83836" }}>*</span>
              </label>
              <TamilTextarea
                tamilMode={tamilMode}
                className="w-full px-4 py-3 rounded-lg border outline-none transition-all resize-none text-sm"
                style={{
                  borderColor: fieldError("description") ? "#a83836" : "#abb3b9",
                  backgroundColor: "#f0f4f8",
                  color: "#2c3338",
                }}
                id="description"
                name="description"
                placeholder="Type your announcement here..."
                rows={6}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {fieldError("description") && (
                <p className="text-xs" style={{ color: "#a83836" }}>{fieldError("description")}</p>
              )}
            </div>

            {/* Media Section */}
            <div className="space-y-4 pt-4">
              <h4
                className="text-sm font-extrabold uppercase tracking-wider"
                style={{ color: "#0D5C63" }}
              >
                Media Attachments
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Image Zone */}
                <div
                  className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer"
                  style={{ borderColor: "#abb3b9", backgroundColor: "#ffffff" }}
                  onClick={() => imageRef.current?.click()}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#abeef6", color: "#0D5C63" }}
                  >
                    <span className="material-symbols-outlined">image</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#2c3338" }}>
                      {imageFile ? imageFile.name : "Image"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#596065" }}>
                      Upload image, Max 5MB
                    </p>
                  </div>
                  <button
                    className="font-bold text-xs px-4 py-2 rounded shadow-sm hover:brightness-95 active:scale-95 transition-all"
                    style={{ backgroundColor: "#F59E0B", color: "#000" }}
                    type="button"
                  >
                    Browse
                  </button>
                  <input
                    ref={imageRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }}
                  />
                </div>

                {/* Video Zone */}
                <div
                  className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer"
                  style={{ borderColor: "#abb3b9", backgroundColor: "#ffffff" }}
                  onClick={() => videoRef.current?.click()}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#abeef6", color: "#0D5C63" }}
                  >
                    <span className="material-symbols-outlined">video_camera_back</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#2c3338" }}>
                      {videoFile ? videoFile.name : "Video"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#596065" }}>
                      Upload video, Max 50MB
                    </p>
                  </div>
                  <button
                    className="font-bold text-xs px-4 py-2 rounded shadow-sm hover:brightness-95 active:scale-95 transition-all"
                    style={{ backgroundColor: "#F59E0B", color: "#000" }}
                    type="button"
                  >
                    Browse
                  </button>
                  <input
                    ref={videoRef}
                    className="hidden"
                    type="file"
                    accept="video/*"
                    onChange={(e) => { if (e.target.files?.[0]) setVideoFile(e.target.files[0]); }}
                  />
                </div>

                {/* Voice Zone */}
                <div
                  className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer"
                  style={{ borderColor: "#abb3b9", backgroundColor: "#ffffff" }}
                  onClick={() => audioRef.current?.click()}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#abeef6", color: "#0D5C63" }}
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#2c3338" }}>
                      {audioFile ? audioFile.name : "Voice Note"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#596065" }}>
                      Upload audio, Max 10MB
                    </p>
                  </div>
                  <button
                    className="font-bold text-xs px-4 py-2 rounded shadow-sm hover:brightness-95 active:scale-95 transition-all"
                    style={{ backgroundColor: "#F59E0B", color: "#000" }}
                    type="button"
                  >
                    Browse
                  </button>
                  <input
                    ref={audioRef}
                    className="hidden"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => { if (e.target.files?.[0]) setAudioFile(e.target.files[0]); }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              className="flex items-center justify-end gap-4 pt-8 border-t"
              style={{ borderColor: "#f1f5f9" }}
            >
              <Link
                href="/announcements"
                className="px-8 py-3 rounded-lg font-bold border-2 transition-all"
                style={{ color: "#0D5C63", borderColor: "#0D5C63" }}
              >
                Cancel
              </Link>
              <button
                className="px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:brightness-95 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#865400", color: "#ffffff" }}
                type="submit"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Publishing...
                  </span>
                ) : (
                  <>
                    Publish Announcement
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
