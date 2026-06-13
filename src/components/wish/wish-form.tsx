"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { submitWish } from "@/app/wish/actions";
import { MAX_MEDIA_BYTES, type MediaType } from "@/lib/config";
import { ImageCapture } from "./image-capture";
import { VideoRecorder } from "./video-recorder";
import { VoiceRecorder } from "./voice-recorder";

type Phase = "form" | "sending" | "done";
type SelectedMedia = Blob | File | null;
type KeepsakeIcon = "voice" | "film" | "portrait" | "together";

const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
};

const lineInputClass =
  "w-full border-0 border-b border-[#173b73]/28 bg-transparent px-0 py-2 font-serif text-xl text-[#102f5d] outline-none transition placeholder:text-[#173b73]/46 focus:border-[#244cc5] focus:ring-0";

const WISH_RECIPIENT = "Cynthia";

function extensionFor(blob: Blob | File) {
  if (blob instanceof File && blob.name.includes(".")) {
    return blob.name.split(".").pop()?.toLowerCase() ?? "bin";
  }
  return EXT_BY_MIME[blob.type.split(";")[0]] ?? "bin";
}

export function WishForm() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [voice, setVoice] = useState<SelectedMedia>(null);
  const [video, setVideo] = useState<SelectedMedia>(null);
  const [image, setImage] = useState<SelectedMedia>(null);
  const [togetherImage, setTogetherImage] = useState<SelectedMedia>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  async function uploadMedia(
    blob: Blob | File,
    prefix: string
  ): Promise<string> {
    if (blob.size > MAX_MEDIA_BYTES) {
      throw new Error(
        `${prefix} is over 25MB. Please choose a shorter or smaller file.`
      );
    }

    const supabase = createClient();
    const path = `${prefix}/${crypto.randomUUID()}.${extensionFor(blob)}`;
    const { error: uploadError } = await supabase.storage
      .from("wish-media")
      .upload(path, blob, {
        contentType: blob.type || undefined,
      });
    if (uploadError) {
      throw new Error(`${prefix} could not upload. Please try again.`);
    }

    return supabase.storage.from("wish-media").getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please sign your letter before sending it.");
      return;
    }
    if (!message.trim() && !voice && !video && !image && !togetherImage) {
      setError("The envelope is still empty. Add a note or one keepsake.");
      return;
    }

    setPhase("sending");
    try {
      const [voiceUrl, videoUrl, imageUrl, togetherImageUrl] =
        await Promise.all([
          voice ? uploadMedia(voice, "voice") : null,
          video ? uploadMedia(video, "video") : null,
          image ? uploadMedia(image, "image") : null,
          togetherImage ? uploadMedia(togetherImage, "together") : null,
        ]);

      const legacyMedia: { url: string; type: MediaType } | null = voiceUrl
        ? { url: voiceUrl, type: "audio" }
        : videoUrl
          ? { url: videoUrl, type: "video" }
          : imageUrl
            ? { url: imageUrl, type: "image" }
            : togetherImageUrl
              ? { url: togetherImageUrl, type: "image" }
              : null;

      const formData = new FormData();
      formData.set("name", name);
      formData.set("relationship", relationship);
      formData.set("messageText", message);
      if (voiceUrl) formData.set("voiceUrl", voiceUrl);
      if (videoUrl) formData.set("videoUrl", videoUrl);
      if (imageUrl) formData.set("imageUrl", imageUrl);
      if (togetherImageUrl) {
        formData.set("togetherImageUrl", togetherImageUrl);
      }
      if (legacyMedia) {
        formData.set("mediaUrl", legacyMedia.url);
        formData.set("mediaType", legacyMedia.type);
      }

      const result = await submitWish(formData);
      if (!result.ok) throw new Error(result.error);
      setPhase("done");
    } catch (submissionError) {
      setPhase("form");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The post did not leave the desk. Please try again."
      );
    }
  }

  function resetForm() {
    setName("");
    setRelationship("");
    setMessage("");
    setVoice(null);
    setVideo(null);
    setImage(null);
    setTogetherImage(null);
    setPhase("form");
  }

  if (phase === "done") {
    return (
      <section className="wish-paper relative overflow-hidden rounded-sm px-6 py-14 text-center text-[#102f5d] shadow-[0_45px_120px_rgba(0,0,0,0.45)] sm:px-12 sm:py-20">
        <div className="wish-airmail-edge absolute inset-x-0 top-0 h-2" />
        <div className="mx-auto flex size-24 rotate-[-7deg] items-center justify-center rounded-full border-2 border-[#244cc5]/35">
          <span className="font-serif text-5xl italic text-[#244cc5]">A</span>
        </div>
        <p className="mt-8 text-[0.65rem] uppercase tracking-[0.32em] text-[#173b73]/48">
          Accepted at the midnight desk
        </p>
        <h2 className="mt-4 font-serif text-5xl leading-none">
          Your letter is on its way.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#173b73]/62">
          It is safely waiting for {WISH_RECIPIENT}, and will join the birthday
          journey after approval.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full bg-[#173b73] px-6 py-3 text-sm font-semibold text-[#f7f0df] transition hover:bg-[#244cc5]"
          >
            Write another letter
          </button>
          <Link
            href="/"
            className="rounded-full border border-[#173b73]/25 px-6 py-3 text-sm font-semibold text-[#173b73] transition hover:border-[#173b73]/50"
          >
            Return to the celebration
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="wish-paper relative overflow-hidden rounded-sm text-[#102f5d] shadow-[0_45px_120px_rgba(0,0,0,0.45)]"
    >
      <div className="wish-airmail-edge h-2" aria-hidden />

      <div className="relative px-5 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8">
        <div className="grid grid-cols-[1fr_auto] gap-5 border-b border-[#173b73]/15 pb-7">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.28em] text-[#173b73]/45">
              Private correspondence · Birthday mail
            </p>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[#173b73]/48">
              Deliver to
            </p>
            <p className="mt-1 font-serif text-4xl leading-none text-[#173b73] sm:text-5xl">
              {WISH_RECIPIENT}
            </p>
            <p className="mt-2 font-serif text-lg italic text-[#244cc5]/75">
              Wherever she is loved
            </p>
          </div>

          <div className="wish-stamp flex h-[6.2rem] w-[4.8rem] rotate-3 flex-col items-center justify-center border-2 border-[#244cc5]/45 text-center text-[#244cc5] sm:h-28 sm:w-20">
            <span className="font-serif text-3xl italic">A</span>
            <span className="mt-1 text-[0.45rem] uppercase leading-3 tracking-[0.18em]">
              Night
              <br />
              post
            </span>
          </div>
        </div>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="wish-name"
              className="block text-[0.62rem] uppercase tracking-[0.24em] text-[#173b73]/50"
            >
              Signed by
            </label>
            <input
              id="wish-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              maxLength={80}
              className={lineInputClass}
              required
            />
          </div>
          <div>
            <label
              htmlFor="wish-rel"
              className="block text-[0.62rem] uppercase tracking-[0.24em] text-[#173b73]/50"
            >
              Known to her as
              <span className="ml-2 normal-case tracking-normal text-[#173b73]/32">
                optional
              </span>
            </label>
            <input
              id="wish-rel"
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
              placeholder="Uni friend, sister, work bestie..."
              maxLength={80}
              className={lineInputClass}
            />
          </div>
        </div>

        <div className="mt-9">
          <div className="flex items-end justify-between gap-4">
            <label
              htmlFor="wish-msg"
              className="font-serif text-2xl italic text-[#173b73]"
            >
              Dear {WISH_RECIPIENT},
            </label>
            <span className="text-[0.58rem] tracking-[0.16em] text-[#173b73]/32">
              {message.length} / 4000
            </span>
          </div>
          <textarea
            id="wish-msg"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={`Write a birthday wish, blessing, or kind note for ${WISH_RECIPIENT}...`}
            rows={9}
            maxLength={4000}
            className="wish-ruled-textarea mt-3 w-full resize-y border-0 bg-transparent px-1 py-0 font-serif text-xl leading-8 text-[#102f5d] outline-none placeholder:text-[#173b73]/42 focus:ring-0"
          />
          <p className="mt-2 text-right font-serif text-lg italic text-[#173b73]/55">
            With love,
          </p>
        </div>
      </div>

      <section className="mx-3 mb-3 overflow-hidden rounded-[1.4rem] bg-[#102f5d] text-[#f7f0df] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:mx-5 sm:mb-5">
        <div className="flex flex-col gap-3 border-b border-white/12 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[#ecd28a]/70">
              The keepsake pocket
            </p>
            <h2 className="mt-2 font-serif text-3xl leading-none">
              Tuck in something she can keep.
            </h2>
          </div>
          <p className="max-w-[15rem] text-xs leading-5 text-white/42">
            Entirely optional. Open only the drawer you need.
          </p>
        </div>

        <div className="grid gap-3 p-3 sm:p-5">
          <MediaSection
            icon="voice"
            title="Your voice, exactly as it sounds"
            description="Up to three minutes. Laughing and retakes are welcome."
          >
            <VoiceRecorder onRecorded={setVoice} />
          </MediaSection>

          <MediaSection
            icon="film"
            title="A tiny film for her"
            description="Record here or bring one you already made."
          >
            <VideoRecorder onSelected={setVideo} />
          </MediaSection>

          <MediaSection
            icon="portrait"
            title="One frame from your world"
            description="A new picture, an old favourite, or today as it is."
          >
            <ImageCapture label="birthday image" onSelected={setImage} />
          </MediaSection>

          <MediaSection
            icon="together"
            title={`Proof you and ${WISH_RECIPIENT} happened`}
            description="The blurry one, the beautiful one, or both of you mid-laugh."
          >
            <ImageCapture
              label={`photo with ${WISH_RECIPIENT}`}
              onSelected={setTogetherImage}
            />
          </MediaSection>
        </div>
      </section>

      <div className="px-5 pb-7 pt-4 sm:px-10 sm:pb-10">
        {error && (
          <p
            role="alert"
            className="mb-5 border-l-2 border-[#a53b35] bg-[#a53b35]/8 px-4 py-3 text-sm text-[#7c2925]"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={phase === "sending"}
            className="group inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full bg-[#173b73] px-7 py-4 text-sm font-semibold text-[#f7f0df] shadow-[0_12px_30px_rgba(23,59,115,0.22)] transition hover:-translate-y-0.5 hover:bg-[#244cc5] disabled:cursor-wait disabled:opacity-60"
          >
            <span>
              {phase === "sending"
                ? "Passing it across the counter..."
                : `Seal and send to ${WISH_RECIPIENT}`}
            </span>
            <span
              aria-hidden
              className="text-lg transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </button>
          <div className="flex items-center justify-center gap-2 text-center text-[0.62rem] uppercase leading-4 tracking-[0.16em] text-[#173b73]/38 sm:max-w-32">
            <span className="block size-2 shrink-0 rounded-full bg-[#4d9e4f]" />
            Private until approved
          </div>
        </div>
      </div>
    </form>
  );
}

function MediaSection({
  icon,
  title,
  description,
  children,
}: {
  icon: KeepsakeIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.045] open:bg-white/[0.075]">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-4 sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#ecd28a]/22 bg-[#ecd28a]/8 text-[#ecd28a]">
          <KeepsakeMark icon={icon} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-lg leading-tight text-white">
            {title}
          </span>
          <span className="mt-1 block text-xs leading-5 text-white/38">
            {description}
          </span>
        </span>
        <span className="text-2xl font-light text-[#ecd28a]/50 transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-white/10 p-4 sm:p-5">{children}</div>
    </details>
  );
}

function KeepsakeMark({ icon }: { icon: KeepsakeIcon }) {
  const pathByIcon: Record<KeepsakeIcon, React.ReactNode> = {
    voice: (
      <>
        <rect x="8" y="3" width="8" height="13" rx="4" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
      </>
    ),
    film: (
      <>
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="m17 10 4-2v8l-4-2M7 9h6M7 13h4" />
      </>
    ),
    portrait: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m5 18 5-5 3 3 2-2 4 4" />
      </>
    ),
    together: (
      <>
        <path d="M16 4a4 4 0 0 1 0 8M8 4a4 4 0 0 0 0 8M3 21a7 7 0 0 1 10-6.32M21 21a7 7 0 0 0-10-6.32" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {pathByIcon[icon]}
    </svg>
  );
}
