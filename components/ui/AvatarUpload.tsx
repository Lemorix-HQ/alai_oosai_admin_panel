"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import ImageCropDialog from "@/components/ui/ImageCropDialog";
import type { ApiResponse } from "@/src/types";

/**
 * Crop first, upload second, attach third.
 *
 * The file is never sent as chosen: the picker opens ImageCropDialog, and what
 * goes to R2 is the square the person framed. Avatars render in a circle with
 * `object-fit: cover`, so an off-square photo was always being cropped — this
 * only moves the choice of which part survives from the browser to the user.
 *
 * What happens after the upload differs by route and that is deliberate:
 * /upload/staff/photo writes BaseUser itself, while the parish and member
 * routes hand back a URL for the entity's own PATCH to store. Hence `hint`,
 * which is where each caller says whether a save is still needed.
 */
export default function AvatarUpload({
  name,
  value,
  size = 96,
  upload,
  onChange,
  hint,
  cropTitle,
}: {
  name: string;
  value?: string;
  size?: number;
  upload: (fd: FormData) => Promise<ApiResponse<{ url: string }>>;
  onChange: (url: string) => void;
  hint?: string;
  cropTitle?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The object URL is made here, in an event handler, and released by whichever
  // of the two exits the dialog takes. Creating it inside the dialog instead
  // would put its lifetime at the mercy of React's double-invoked mount, which
  // revokes it before the cropper ever reads it.
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Cleared straight away so choosing the same file twice still fires a
    // change event — after a cancelled crop as much as after a failed upload.
    if (input.current) input.current.value = "";
    if (!file) return;
    setError(null);
    setPicked({ file, url: URL.createObjectURL(file) });
  }

  function discard() {
    if (picked) URL.revokeObjectURL(picked.url);
    setPicked(null);
  }

  async function send(file: File) {
    discard();
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await upload(fd);
      if (res.success && res.data?.url) onChange(res.data.url);
      else setError(res.message || "Upload failed.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} photo={value} size={size} />
      <div className="space-y-1">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={pick}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-60"
          style={{ borderColor: "#abb3b9", color: "#0D5C63" }}
        >
          {busy ? "Uploading…" : value ? "Replace photo" : "Add photo"}
        </button>
        <p className="text-xs" style={{ color: "#596065" }}>
          {error ?? hint ?? "JPEG, PNG, GIF or WebP. Up to 5 MB."}
        </p>
      </div>

      {picked && (
        <ImageCropDialog
          file={picked.file}
          src={picked.url}
          title={cropTitle}
          onCancel={discard}
          onCropped={send}
        />
      )}
    </div>
  );
}
