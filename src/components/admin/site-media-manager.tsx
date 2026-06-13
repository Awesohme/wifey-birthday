"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSiteMediaUpload,
  deleteSiteMedia,
  moveSiteMedia,
  saveSiteMedia,
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
          Journey images appear between wishes in the fly-through.
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
        return (
          <div key={mediaSection}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/50">
              {mediaSection === "film"
                ? `Film reel (${items.length})`
                : `Main journey (${items.length})`}
            </h3>
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-leaf-900/15 p-5 text-sm text-foreground/40">
                No custom images yet. The site is using its fallback images.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-leaf-900/10 bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Supabase-managed image */}
                    <img
                      src={item.url}
                      alt={item.alt_text}
                      className="aspect-video w-full object-cover"
                    />
                    <div className="p-4">
                      <p className="truncate text-sm font-medium">
                        {item.caption || item.alt_text || "Untitled image"}
                      </p>
                      {item.year && (
                        <p className="mt-1 text-xs text-foreground/45">
                          {item.year}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1">
                        <form action={moveSiteMedia}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="section"
                            value={item.section}
                          />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            disabled={index === 0}
                            className="rounded-full px-3 py-1.5 text-xs text-foreground/55 disabled:opacity-25"
                          >
                            Earlier
                          </button>
                        </form>
                        <form action={moveSiteMedia}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="section"
                            value={item.section}
                          />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            disabled={index === items.length - 1}
                            className="rounded-full px-3 py-1.5 text-xs text-foreground/55 disabled:opacity-25"
                          >
                            Later
                          </button>
                        </form>
                        <form action={deleteSiteMedia} className="ml-auto">
                          <input type="hidden" name="id" value={item.id} />
                          <button className="rounded-full px-3 py-1.5 text-xs text-red-600">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
