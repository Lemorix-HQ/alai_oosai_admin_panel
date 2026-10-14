"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import type { ApiResponse } from "@/src/types";

/**
 * Upload first, attach second — the pattern the event form already uses. The
 * file goes to R2 the moment it is chosen and this reports the URL; the parent
 * form stores it like any other text field and saves it with everything else.
 */
export default function AvatarUpload({
  name,
  value,
  size = 96,
  upload,
  onChange,
  hint,
}: {
  name: string;
  value?: string;
  size?: number;
  upload: (fd: FormData) => Promise<ApiResponse<{ url: string }>>;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
      // Let the same file be chosen again after a failure.
      if (input.current) input.current.value = "";
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
    </div>
  );
}
