"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useRef, useState, useEffect } from "react";
import fixWebmDuration from "fix-webm-duration";
import { createAnnouncementAction, type CreateAnnouncementPayload } from "@/src/actions/announcements.actions";
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

  // Voice recorder state
  const [voiceMode, setVoiceMode] = useState<"upload" | "record">("upload");
  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartRef = useRef<number>(0);
  // Ref to track the current blob URL so cleanup on unmount can revoke it
  // without depending on a stale closure
  const recordedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current);
    };
  }, []);

  async function startRecording() {
    if (isRecording || isInitializing) return;
    setRecordingError(null);
    setIsInitializing(true);

    // Pre-flight: check if any audio input device is visible to the browser.
    // On macOS, if the OS hasn't granted permission to the browser the device
    // list comes back empty — this surfaces as NotFoundError on getUserMedia.
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudioInput = devices.some((d) => d.kind === "audioinput");
      if (!hasAudioInput) {
        setRecordingError(
          "No microphone detected. On macOS open System Settings → Privacy & Security → Microphone and enable access for this browser, then fully quit and relaunch it."
        );
        setIsInitializing(false);
        return;
      }
    } catch {
      // enumerateDevices not supported — proceed and let getUserMedia fail naturally
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      let msg = "Could not access microphone. Please try again.";
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            msg = "Microphone access denied. Click the lock icon in your browser address bar and allow microphone access.";
            break;
          case "NotFoundError":
          case "DevicesNotFoundError":
            // On macOS this error fires when the OS blocks the browser — not just
            // when no hardware is present.
            msg = "Microphone not accessible. On macOS go to System Settings → Privacy & Security → Microphone, enable access for this browser, then fully quit and relaunch it.";
            break;
          case "NotReadableError":
          case "TrackStartError":
            msg = "Microphone is in use by another app. Close other audio apps or refresh this page and try again.";
            break;
          case "SecurityError":
            msg = "Microphone requires a secure connection (HTTPS).";
            break;
        }
      }
      setRecordingError(msg);
      setIsInitializing(false);
      return;
    }

    try {
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setIsProcessingAudio(true);

        const duration = Date.now() - recordingStartRef.current;
        const rawBlob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes("ogg") ? "ogg" : "webm";

        // Upload always uses the raw blob — fix-webm-duration output can corrupt
        // the multipart stream when sent via Next.js server actions.
        setAudioFile(new File([rawBlob], `voice_note_recording.${ext}`, { type: mimeType }));

        // Fix duration metadata only for the local preview player.
        let previewBlob: Blob;
        try {
          previewBlob = await fixWebmDuration(rawBlob, duration);
        } catch {
          previewBlob = rawBlob;
        }

        if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current);
        const url = URL.createObjectURL(previewBlob);
        recordedUrlRef.current = url;
        setRecordedUrl(url);
        setIsProcessingAudio(false);
      };
      mr.start();
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      setRecordingError(`Recording failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsInitializing(false);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function discardRecording() {
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }
    setRecordedUrl(null);
    setAudioFile(null);
    setRecordingSeconds(0);
    setRecordingError(null);
  }

  function switchVoiceMode(mode: "upload" | "record") {
    if (isRecording) stopRecording();
    discardRecording();
    if (audioRef.current) audioRef.current.value = "";
    setVoiceMode(mode);
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

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
        // Convert File objects to Uint8Array before calling the server action.
        // Passing File/Blob objects directly through a programmatic server-action
        // call causes Next.js to forward them as multipart at the RSC boundary,
        // which triggers "Unexpected end of form" before our action code runs.
        // Uint8Array is serialized via the RSC binary protocol, bypassing that.
        async function toFilePayload(file: File) {
          const buf = await file.arrayBuffer();
          return { data: new Uint8Array(buf), name: file.name, type: file.type };
        }

        const payload: CreateAnnouncementPayload = {
          title: values.title,
          description: values.description,
          time: new Date(values.time).toISOString(),
          ...(imageFile ? { image: await toFilePayload(imageFile) } : {}),
          ...(videoFile ? { video: await toFilePayload(videoFile) } : {}),
          ...(audioFile ? { voiceNote: await toFilePayload(audioFile) } : {}),
        };

        const res = await createAnnouncementAction(payload);
        if (res.success) {
          queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
          router.push("/announcements");
        } else {
          setApiError(res.message || "Failed to create announcement.");
        }
      } catch (error) {
        console.log("error", error);
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
                  className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center text-center space-y-3"
                  style={{ borderColor: isRecording ? "#a83836" : audioFile ? "#0D5C63" : "#abb3b9", backgroundColor: "#ffffff" }}
                >
                  {/* Mode Toggle */}
                  <div className="flex w-full rounded-lg overflow-hidden border text-xs font-bold" style={{ borderColor: "#e2e8f0" }}>
                    <button
                      type="button"
                      className="flex-1 py-1.5 transition-all"
                      style={{
                        backgroundColor: voiceMode === "upload" ? "#0D5C63" : "#f0f4f8",
                        color: voiceMode === "upload" ? "#ffffff" : "#596065",
                      }}
                      onClick={() => switchVoiceMode("upload")}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-1.5 transition-all"
                      style={{
                        backgroundColor: voiceMode === "record" ? "#0D5C63" : "#f0f4f8",
                        color: voiceMode === "record" ? "#ffffff" : "#596065",
                      }}
                      onClick={() => switchVoiceMode("record")}
                    >
                      Record
                    </button>
                  </div>

                  {voiceMode === "upload" ? (
                    <>
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
                        onClick={() => audioRef.current?.click()}
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
                    </>
                  ) : (
                    <>
                      {/* Record idle / recording / processing */}
                      {!recordedUrl ? (
                        <>
                          {isProcessingAudio ? (
                            <>
                              <span className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "#0D5C63" }} />
                              <p className="text-xs" style={{ color: "#596065" }}>Preparing preview…</p>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: isRecording ? "#a83836" : "#abeef6",
                                  color: isRecording ? "#ffffff" : "#0D5C63",
                                }}
                                disabled={isInitializing}
                                onClick={isRecording ? stopRecording : startRecording}
                              >
                                {isInitializing ? (
                                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <span className="material-symbols-outlined text-2xl">
                                    {isRecording ? "stop" : "mic"}
                                  </span>
                                )}
                              </button>
                              {isRecording ? (
                                <div className="space-y-1">
                                  <p className="text-sm font-extrabold tabular-nums" style={{ color: "#a83836" }}>
                                    {formatTime(recordingSeconds)}
                                  </p>
                                  <p className="text-xs" style={{ color: "#596065" }}>Recording… tap to stop</p>
                                </div>
                              ) : isInitializing ? (
                                <p className="text-xs" style={{ color: "#596065" }}>Waiting for microphone…</p>
                              ) : (
                                <div>
                                  <p className="text-sm font-bold" style={{ color: "#2c3338" }}>Tap to Record</p>
                                  <p className="text-xs mt-1" style={{ color: "#596065" }}>Records directly in browser</p>
                                </div>
                              )}
                              {recordingError && (
                                <p className="text-xs text-center px-1" style={{ color: "#a83836" }}>{recordingError}</p>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        /* Playback after recording */
                        <>
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "#abeef6", color: "#0D5C63" }}
                          >
                            <span className="material-symbols-outlined">check_circle</span>
                          </div>
                          <p className="text-xs font-bold" style={{ color: "#0D5C63" }}>
                            Recording ready · {formatTime(recordingSeconds)}
                          </p>
                          <audio
                            src={recordedUrl}
                            controls
                            className="w-full rounded-lg"
                            style={{ maxHeight: "36px" }}
                          />
                          <button
                            type="button"
                            className="font-bold text-xs px-4 py-1.5 rounded border transition-all hover:brightness-95 active:scale-95"
                            style={{ borderColor: "#a83836", color: "#a83836" }}
                            onClick={discardRecording}
                          >
                            Re-record
                          </button>
                        </>
                      )}
                    </>
                  )}
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
