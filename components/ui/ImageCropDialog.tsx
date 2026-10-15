"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
// The cropper positions its image entirely through these classes; without the
// stylesheet the frame renders empty.
import "react-easy-crop/react-easy-crop.css";

/** What every avatar in the panel renders at: a circle, so a square source. */
const ASPECT = 1;

/**
 * Longest edge of the stored image. Avatars render at 28-96px and the Flutter
 * app's tiles are smaller still, so 512 is already generous for a retina
 * screen — and it keeps a phone photo well under the API's 5 MB ceiling
 * without asking the parish to resize anything themselves.
 */
const MAX_EDGE = 512;

/**
 * PNG and WebP can carry transparency and a parish crest usually does, so those
 * come back as PNG. Everything else becomes JPEG, which is far smaller for a
 * photograph. A GIF loses its animation here — an avatar is a still image.
 */
function outputFormat(sourceType: string): { mime: "image/png" | "image/jpeg"; ext: "png" | "jpg" } {
  return sourceType === "image/png" || sourceType === "image/webp"
    ? { mime: "image/png", ext: "png" }
    : { mime: "image/jpeg", ext: "jpg" };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file could not be read as an image."));
    img.src = src;
  });
}

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** The bounding box an image occupies once rotated. */
function rotatedSize(width: number, height: number, rotation: number) {
  const r = radians(rotation);
  return {
    width: Math.abs(Math.cos(r) * width) + Math.abs(Math.sin(r) * height),
    height: Math.abs(Math.sin(r) * width) + Math.abs(Math.cos(r) * height),
  };
}

/**
 * Two canvases, in the order react-easy-crop reports its geometry: the first
 * holds the whole image rotated about its centre, because `area` is expressed
 * in the rotated image's pixels; the second takes the square out of it and
 * scales that down to MAX_EDGE.
 */
async function cropToFile(src: string, area: Area, rotation: number, source: File): Promise<File> {
  const image = await loadImage(src);
  const { mime, ext } = outputFormat(source.type);

  const box = rotatedSize(image.width, image.height, rotation);
  const whole = document.createElement("canvas");
  whole.width = Math.round(box.width);
  whole.height = Math.round(box.height);
  const wholeCtx = whole.getContext("2d");
  if (!wholeCtx) throw new Error("This browser could not prepare the image.");
  wholeCtx.translate(whole.width / 2, whole.height / 2);
  wholeCtx.rotate(radians(rotation));
  wholeCtx.translate(-image.width / 2, -image.height / 2);
  wholeCtx.drawImage(image, 0, 0);

  const edge = Math.max(1, Math.min(MAX_EDGE, Math.round(area.width)));
  const out = document.createElement("canvas");
  out.width = edge;
  out.height = edge;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("This browser could not prepare the image.");
  // JPEG has no alpha: without this, a transparent source renders black.
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, edge, edge);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(whole, area.x, area.y, area.width, area.height, 0, 0, edge, edge);

  const blob = await new Promise<Blob | null>((resolve) =>
    out.toBlob(resolve, mime, mime === "image/jpeg" ? 0.9 : undefined),
  );
  if (!blob) throw new Error("The cropped image could not be created.");

  const base = source.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.${ext}`, { type: mime });
}

/**
 * Crop before upload.
 *
 * Every avatar in the panel is a circle with `object-fit: cover`, so an
 * off-square photo was already being cropped — just silently, by the browser,
 * to the middle of the frame. This moves that decision to the person uploading
 * and makes what reaches R2 the square that will actually be shown.
 */
export default function ImageCropDialog({
  file,
  src,
  title = "Crop photo",
  onCancel,
  onCropped,
}: {
  /** The chosen file — read only for its name and type, never decoded here. */
  file: File;
  /**
   * An object URL for `file`, owned by the caller.
   *
   * Deliberately not created here: an object URL made during render and revoked
   * in an effect is revoked for good by React's double-invoked mount in
   * development, leaving the cropper with a dead blob and an empty frame. The
   * caller makes it in an event handler, which runs once.
   */
  src: string;
  title?: string;
  onCancel: () => void;
  onCropped: (cropped: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // onCropAreaChange, not onCropComplete: the latter only fires when a drag
  // ends, so a crop confirmed without a clean pointerup — or straight after a
  // zoom — would be cut from a stale rectangle. This one tracks every change,
  // so `area` is always the square currently drawn on screen.
  const onAreaChange = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  async function confirm() {
    if (!area) return;
    setBusy(true);
    setError(null);
    try {
      onCropped(await cropToFile(src, area, rotation, file));
    } catch (e) {
      setError((e as Error).message || "The image could not be cropped.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-lg font-bold" style={{ color: "#2c3338" }}>{title}</h3>
          <p className="text-xs mt-0.5" style={{ color: "#596065" }}>
            Drag to reposition, pinch or use the slider to zoom. The circle is exactly what will show.
          </p>
        </div>

        <div className="relative mt-4 h-72 sm:h-80 bg-slate-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={ASPECT}
            cropShape="round"
            showGrid={false}
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropAreaChange={onAreaChange}
          />
        </div>

        <div className="px-5 py-4 space-y-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#596065" }}>
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-1 w-full"
              style={{ accentColor: "#0D5C63" }}
              aria-label="Zoom"
            />
          </label>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="px-3 py-2 rounded-lg border text-sm font-bold inline-flex items-center gap-1"
              style={{ borderColor: "#abb3b9", color: "#0D5C63" }}
            >
              <span className="material-symbols-outlined text-base">rotate_right</span>
              Rotate
            </button>
            <button
              type="button"
              onClick={() => {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setRotation(0);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{ color: "#596065" }}
            >
              Reset
            </button>
          </div>

          {error && (
            <div
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
              style={{ borderColor: "#dce3e9", color: "#596065" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy || !area}
              className="px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
              style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
            >
              {busy ? "Preparing…" : "Crop and upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
