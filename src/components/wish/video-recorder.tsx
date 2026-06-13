"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 90;

function pickVideoMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function VideoRecorder({
  onSelected,
}: {
  onSelected: (file: Blob | File | null) => void;
}) {
  const [state, setState] = useState<
    "idle" | "previewing" | "recording" | "recorded"
  >("idle");
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  async function openCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
      setState("previewing");
    } catch {
      setError(
        "Camera access was blocked. Allow camera and microphone access, or upload a video instead."
      );
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = pickVideoMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    );
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "video/webm",
      });
      stopStream();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setState("recorded");
      onSelected(blob);
    };
    recorderRef.current = recorder;
    recorder.start();
    setSeconds(0);
    setState("recording");
    timerRef.current = setInterval(() => {
      setSeconds((current) => {
        if (current + 1 >= MAX_SECONDS) recorder.stop();
        return current + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    stopStream();
    setPreviewUrl(null);
    setSeconds(0);
    setState("idle");
    onSelected(null);
  }

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(
    2,
    "0"
  )}`;

  return (
    <div className="space-y-3">
      {state === "idle" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={openCamera}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Record on screen
          </button>
          <label className="cursor-pointer rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-center text-sm font-medium text-white transition hover:bg-white/15">
            Upload a video
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) return;
                setPreviewUrl(URL.createObjectURL(file));
                setState("recorded");
                onSelected(file);
              }}
            />
          </label>
        </div>
      )}

      {(state === "previewing" || state === "recording") && (
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-black">
          <video
            ref={liveVideoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full object-cover"
          />
          <div className="flex items-center justify-between gap-3 p-3">
            <span className="text-xs uppercase tracking-[0.18em] text-white/50">
              {state === "recording" ? `Recording ${time}` : "Camera ready"}
            </span>
            <button
              type="button"
              onClick={
                state === "recording" ? stopRecording : startRecording
              }
              className={`rounded-full px-5 py-2 text-sm font-semibold text-white ${
                state === "recording" ? "bg-red-600" : "bg-royal-600"
              }`}
            >
              {state === "recording" ? "Stop" : "Start recording"}
            </button>
          </div>
        </div>
      )}

      {state === "recorded" && previewUrl && (
        <div className="space-y-3 rounded-2xl border border-white/15 bg-black/30 p-3">
          <video
            controls
            playsInline
            src={previewUrl}
            className="aspect-video w-full rounded-xl bg-black object-cover"
          />
          <button
            type="button"
            onClick={reset}
            className="text-sm text-white/60 underline underline-offset-4"
          >
            Remove or record again
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
