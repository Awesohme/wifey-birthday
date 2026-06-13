"use client";

import { useEffect, useRef, useState } from "react";

export function ImageCapture({
  label,
  onSelected,
}: {
  label: string;
  onSelected: (file: Blob | File | null) => void;
}) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(
    () => () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  async function openCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOpen(true);
    } catch {
      setError("Camera access was blocked. You can upload an image instead.");
    }
  }

  function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onSelected(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onSelected(null);
  }

  return (
    <div className="space-y-3">
      {!cameraOpen && !previewUrl && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={openCamera}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Snap with camera
          </button>
          <label className="cursor-pointer rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-center text-sm font-medium text-white transition hover:bg-white/15">
            Upload image
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={`Upload ${label}`}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) return;
                setPreviewUrl(URL.createObjectURL(file));
                onSelected(file);
              }}
            />
          </label>
        </div>
      )}

      {cameraOpen && (
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="flex justify-end gap-2 p-3">
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-full px-4 py-2 text-sm text-white/60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={snap}
              className="rounded-full bg-royal-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Take photo
            </button>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="relative overflow-hidden rounded-2xl border border-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="aspect-[4/3] w-full object-cover"
          />
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white backdrop-blur"
          >
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
