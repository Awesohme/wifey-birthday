"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "framer-motion";
import {
  createSiteMediaUpload,
  reorderSiteMedia,
  deleteSiteMedia,
  saveSiteMedia,
  updateSiteMedia,
} from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import type { SiteMedia, SiteMediaSection } from "@/lib/config";

export function SiteMediaManager({ media }: { media: SiteMedia[] }) {
  const router = useRouter();
  const [section, setSection] = useState<SiteMediaSection>("film");
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Site images must be 15MB or smaller.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const ticket = await createSiteMediaUpload(file.name, file.type);
      if (!ticket.ok) {
        setError(ticket.error);
        return;
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("site-media")
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type,
        });
      if (uploadError) {
        setError("The image upload failed. Please try again.");
        return;
      }

      const saved = await saveSiteMedia({
        section,
        url: ticket.publicUrl,
        storagePath: ticket.path,
        altText,
        caption,
        year,
      });
      if (!saved.ok) {
        setError(saved.error);
        return;
      }

      setFile(null);
      setAltText("");
      setCaption("");
      setYear("");
      const input = document.getElementById(
        "site-media-file"
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      router.refresh();
    });
  }

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/50 bg-white/70 p-5 shadow-xl shadow-royal-900/5 backdrop-blur sm:p-7">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-royal-600">
          Main site media
        </p>
        <h2 className="mt-2 font-display text-3xl text-leaf-900">
          Build the visual story
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/50">
          Film images play in order; the final film image becomes the hero.
          Journey images appear between wishes in the fly-through. Drag any card
          to reorder.
        </p>
      </header>

      <form onSubmit={upload} className="grid gap-4 rounded-2xl bg-royal-50/70 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Destination
            <select
              value={section}
              onChange={(event) =>
                setSection(event.target.value as SiteMediaSection)
              }
              className="mt-1.5 w-full rounded-xl border border-royal-200 bg-white px-3 py-3"
            >
              <option value="film">Opening film and hero</option>
              <option value="gallery">Main journey fly-through</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Image
            <input
              id="site-media-file"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-1.5 w-full rounded-xl border border-royal-200 bg-white px-3 py-2.5 text-sm"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Alt text
            <input
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Describe the image"
              className="mt-1.5 w-full rounded-xl border border-royal-200 bg-white px-3 py-3"
            />
          </label>
          <label className="text-sm font-medium">
            Caption
            <input
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Optional film caption"
              className="mt-1.5 w-full rounded-xl border border-royal-200 bg-white px-3 py-3"
            />
          </label>
        </div>
        {section === "film" && (
          <label className="max-w-48 text-sm font-medium">
            Year
            <input
              value={year}
              onChange={(event) => setYear(event.target.value)}
              inputMode="numeric"
              placeholder="e.g. 2018"
              className="mt-1.5 w-full rounded-xl border border-royal-200 bg-white px-3 py-3"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-royal-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Uploading..." : "Add to the site"}
        </button>
      </form>

      {(["film", "gallery"] as const).map((mediaSection) => {
        const items = media.filter((item) => item.section === mediaSection);
        // Key on the server order so a refresh (new/deleted/reordered rows)
        // remounts the list and re-seeds local drag state — no syncing effect.
        const seed = items.map((item) => item.id).join(",");
        return (
          <MediaSectionList
            key={`${mediaSection}:${seed}`}
            section={mediaSection}
            items={items}
          />
        );
      })}
    </section>
  );
}

function MediaSectionList({
  section,
  items,
}: {
  section: SiteMediaSection;
  items: SiteMedia[];
}) {
  const router = useRouter();
  const [order, setOrder] = useState<SiteMedia[]>(items);
  const [, startTransition] = useTransition();

  function persist(next: SiteMedia[]) {
    setOrder(next);
    startTransition(async () => {
      await reorderSiteMedia(
        section,
        next.map((item) => item.id)
      );
      router.refresh();
    });
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/50">
        {section === "film"
          ? `Film reel (${order.length})`
          : `Main journey (${order.length})`}
      </h3>
      {order.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-leaf-900/15 p-5 text-sm text-foreground/40">
          No custom images yet. The site is using its fallback images.
        </p>
      ) : (
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={persist}
          // Single column so a plain up/down drag reaches every position.
          // framer-motion's Reorder only tracks one axis, so a 2-col grid left
          // half the moves (crossing columns) impossible to drag.
          className="flex flex-col gap-3"
        >
          {order.map((item) => (
            <MediaCard key={item.id} item={item} section={section} />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

function MediaCard({
  item,
  section,
}: {
  item: SiteMedia;
  section: SiteMediaSection;
}) {
  const router = useRouter();
  const dragControls = useDragControls();
  const [editing, setEditing] = useState(false);
  const [altText, setAltText] = useState(item.alt_text ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [year, setYear] = useState(item.year ? String(item.year) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Show the just-saved values immediately; `router.refresh()` then reconciles
  // with the server. Without this the card flashes the stale prop values while
  // the refresh is in flight.
  const [display, setDisplay] = useState({
    caption: item.caption,
    altText: item.alt_text,
    year: item.year,
  });

  function save() {
    // Validate the year up front so bad input shows instantly without a
    // round-trip (a failed server action would refresh and close the panel).
    if (year.trim()) {
      const parsed = Number(year);
      if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) {
        setError("Enter a valid four-digit year.");
        return;
      }
    }
    setError(null);
    startTransition(async () => {
      const result = await updateSiteMedia(item.id, { altText, caption, year });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Reflect the saved values right away (mirrors the server's trim/parse),
      // then refresh so the rest of the page picks up the change too.
      setDisplay({
        caption: caption.trim() || null,
        altText: altText.trim(),
        year: year.trim() ? Number(year) : null,
      });
      setEditing(false);
      router.refresh();
    });
  }

  function cancel() {
    setAltText(item.alt_text ?? "");
    setCaption(item.caption ?? "");
    setYear(item.year ? String(item.year) : "");
    setError(null);
    setEditing(false);
  }

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="flex overflow-hidden rounded-2xl border border-leaf-900/10 bg-white"
    >
      <div className="relative w-28 shrink-0 sm:w-40">
        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase-managed image */}
        <img
          src={item.url}
          alt={item.alt_text}
          decoding="async"
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(event) => dragControls.start(event)}
          className="absolute left-2 top-2 cursor-grab touch-none rounded-full bg-black/45 px-2.5 py-1.5 text-white backdrop-blur active:cursor-grabbing"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="7" cy="5" r="1.6" />
            <circle cx="13" cy="5" r="1.6" />
            <circle cx="7" cy="10" r="1.6" />
            <circle cx="13" cy="10" r="1.6" />
            <circle cx="7" cy="15" r="1.6" />
            <circle cx="13" cy="15" r="1.6" />
          </svg>
        </button>
      </div>

      <div className="min-w-0 flex-1 p-4">
        {!editing ? (
          <>
            <p className="truncate text-sm font-medium">
              {display.caption || display.altText || "Untitled image"}
            </p>
            {display.year && (
              <p className="mt-1 text-xs text-foreground/45">{display.year}</p>
            )}
            <div className="mt-3 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-royal-700"
              >
                Edit
              </button>
              <form
                action={deleteSiteMedia}
                className="ml-auto"
                onSubmit={() => {
                  // server action revalidates; refresh keeps local lists in sync
                  setTimeout(() => router.refresh(), 0);
                }}
              >
                <input type="hidden" name="id" value={item.id} />
                <button className="rounded-full px-3 py-1.5 text-xs text-red-600">
                  Delete
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-foreground/60">
              Alt text
              <input
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Describe the image"
                className="mt-1 w-full rounded-xl border border-royal-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-foreground/60">
              Caption
              <input
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Optional caption"
                className="mt-1 w-full rounded-xl border border-royal-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            {section === "film" && (
              <label className="block text-xs font-medium text-foreground/60">
                Year
                <input
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 2018"
                  className="mt-1 w-full rounded-xl border border-royal-200 bg-white px-3 py-2 text-sm"
                />
              </label>
            )}
            {error && (
              <p role="alert" className="text-xs text-red-600">
                {error}
              </p>
            )}
            <div className="flex items-center justify-end gap-2 border-t border-leaf-900/10 pt-3">
              <button
                type="button"
                onClick={cancel}
                disabled={pending}
                className="rounded-full border border-royal-200 px-4 py-1.5 text-xs font-medium text-foreground/60 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="rounded-full bg-royal-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}
