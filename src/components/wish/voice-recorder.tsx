"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 180;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function VoiceRecorder({
  onRecorded,
}: {
  onRecorded: (blob: Blob | null) => void;
}) {
  const [state, setState] = useState<"idle" | "recording" | "recorded">("idle");
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setState("recorded");
        onRecorded(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access was blocked. Allow it in your browser, or upload a photo/video instead.");
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    setState("idle");
    onRecorded(null);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(1, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="space-y-3">
      {state === "idle" && (
        <button
          type="button"
          onClick={start}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-royal-200 bg-royal-50 px-4 py-5 text-sm font-medium text-royal-700"
        >
          <span aria-hidden className="text-lg">🎙️</span> Tap to start recording
        </button>
      )}

      {state === "recording" && (
        <div className="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-4">
          <span className="flex items-center gap-2 text-sm font-medium text-red-700">
            <span className="size-2.5 animate-pulse rounded-full bg-red-500" aria-hidden />
            Recording {mm}:{ss}
          </span>
          <button
            type="button"
            onClick={stop}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Stop
          </button>
        </div>
      )}

      {state === "recorded" && previewUrl && (
        <div className="space-y-2 rounded-2xl bg-royal-50 p-4">
          { }
          <audio controls src={previewUrl} className="w-full" />
          <button
            type="button"
            onClick={discard}
            className="text-sm font-medium text-royal-700 underline underline-offset-2"
          >
            Discard and re-record
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
