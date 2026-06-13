"use client";

import type { Wish } from "@/lib/config";
import { GalleryCard } from "./gallery-card";
import { PhotoCard } from "./photo-card";
import { GALLERY_PHOTOS } from "./photos";

interface GalleryGridProps {
  wishes: Wish[];
}

const SCATTER_OFFSETS = [0, 24, -16, 32, 8, -24, 16, -8, 40, -32];

export function GalleryGrid({ wishes }: GalleryGridProps) {
  // Interleave: a photo after every two wish cards
  const items: React.ReactNode[] = [];
  let photoIdx = 0;

  wishes.forEach((wish, i) => {
    items.push(
      <GalleryCard
        key={wish.id}
        wish={wish}
        offsetY={SCATTER_OFFSETS[i % SCATTER_OFFSETS.length]}
      />
    );
    if ((i + 1) % 2 === 0 && photoIdx < GALLERY_PHOTOS.length) {
      const photo = GALLERY_PHOTOS[photoIdx];
      items.push(
        <PhotoCard
          key={`photo-${photoIdx}`}
          src={photo.src}
          alt={photo.alt}
          offsetY={SCATTER_OFFSETS[(i + photoIdx) % SCATTER_OFFSETS.length]}
        />
      );
      photoIdx++;
    }
  });

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
      {items}
    </div>
  );
}
