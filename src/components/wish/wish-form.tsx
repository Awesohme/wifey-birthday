"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitWish } from "@/app/wish/actions";
import { HER_NAME, MAX_MEDIA_BYTES, type MediaType } from "@/lib/config";
import { VoiceRecorder } from "./voice-recorder";

type Attachment = "none" | "voice" | "file";
type Phase = "form" | "sending" | "done";

const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

function inputClass() {
  return "w-full rounded-2xl border border-leaf-900/10 bg-white px-4 py-3 text-base shadow-sm outline-none focus:ring-2 focus:ring-royal-400";
}

export function WishForm() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<Attachment>("none");
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  async function uploadMedia(): Promise<{ url: string; type: MediaType } | null> {
    let blob: Blob | null = null;
    let ext = "";
    let type: MediaType = "image";

    if (attachment === "voice" && voiceBlob) {
      blob = voiceBlob;
      const baseMime = (voiceBlob.type || "audio/webm").split(";")[0];
      ext = EXT_BY_MIME[baseMime] ?? "webm";
      type = "audio";
    } else if (attachment === "file" && file) {
      blob = file;
      ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
      type = file.type.startsWith("video/") ? "video" : "image";
    }
    if (!blob) return null;

    if (blob.size > MAX_MEDIA_BYTES)
      throw new Error("That file is over 25MB. Please pick a smaller one (or trim the video).");

    const supabase = createClient();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("wish-media")
      .upload(path, blob, { contentType: blob.type || undefined });
    if (uploadError) throw new Error("Upload failed. Check your connection and try again.");

    const { data } = supabase.storage.from("wish-media").getPublicUrl(path);
    return { url: data.publicUrl, type };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please tell us your name.");
    const hasMedia = (attachment === "voice" && voiceBlob) || (attachment === "file" && file);
    if (!message.trim() && !hasMedia)
      return setError("Write a message, record a voice note, or add a photo/video.");

    setPhase("sending");
    try {
      const media = await uploadMedia();
      const formData = new FormData();
      formData.set("name", name);
      formData.set("relationship", relationship);
      formData.set("messageText", message);
      if (media) {
        formData.set("mediaUrl", media.url);
        formData.set("mediaType", media.type);
      }
      const result = await submitWish(formData);
      if (!result.ok) throw new Error(result.error);
      setPhase("done");
    } catch (err) {
      setPhase("form");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (phase === "done") {
    return (
      <div className="space-y-4 rounded-3xl bg-white/80 p-8 text-center shadow-xl shadow-leaf-900/5 backdrop-blur">
        <div className="text-5xl" aria-hidden>🌳✨</div>
        <h2 className="font-display text-2xl text-leaf-900">
          Your wish has been hung on {HER_NAME}&apos;s tree
        </h2>
        <p className="text-sm text-foreground/60">
          She&apos;ll discover it on her birthday. Thank you for being part of this. 🦋
        </p>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setVoiceBlob(null);
            setFile(null);
            setAttachment("none");
            setPhase("form");
          }}
          className="text-sm font-medium text-royal-700 underline underline-offset-2"
        >
          Leave another wish
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl bg-white/80 p-6 shadow-xl shadow-leaf-900/5 backdrop-blur sm:p-8"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="wish-name" className="mb-1.5 block text-sm font-medium">
            Your name
          </label>
          <input
            id="wish-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tola"
            maxLength={80}
            className={inputClass()}
            required
          />
        </div>
        <div>
          <label htmlFor="wish-rel" className="mb-1.5 block text-sm font-medium">
            How do you know her? <span className="font-normal text-foreground/40">(optional)</span>
          </label>
          <input
            id="wish-rel"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g. her sister, uni friend, colleague"
            maxLength={80}
            className={inputClass()}
          />
        </div>
        <div>
          <label htmlFor="wish-msg" className="mb-1.5 block text-sm font-medium">
            Your birthday wish
          </label>
          <textarea
            id="wish-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Dear ${HER_NAME}…`}
            rows={4}
            maxLength={4000}
            className={inputClass()}
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Add something extra <span className="font-normal text-foreground/40">(optional)</span>
        </legend>
        <div className="mb-3 grid grid-cols-3 gap-2" role="group">
          {(
            [
              ["none", "Just text"],
              ["voice", "Voice note"],
              ["file", "Photo / video"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAttachment(value)}
              aria-pressed={attachment === value}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                attachment === value
                  ? "bg-royal-600 text-white shadow-md shadow-royal-600/25"
                  : "bg-leaf-900/5 text-foreground/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {attachment === "voice" && <VoiceRecorder onRecorded={setVoiceBlob} />}

        {attachment === "file" && (
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*,video/*"
              aria-label="Choose a photo or video"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border-2 border-dashed border-royal-200 bg-royal-50 px-4 py-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-royal-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            <p className="text-xs text-foreground/40">Up to 25MB. Short and sweet works best.</p>
          </div>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={phase === "sending"}
        className="w-full rounded-full bg-royal-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-royal-600/30 transition active:scale-[0.98] disabled:opacity-60"
      >
        {phase === "sending" ? "Hanging your wish on the tree…" : "Send your wish 🦋"}
      </button>
    </form>
  );
}
