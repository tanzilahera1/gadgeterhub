"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: { url: string; alt: string }[];
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square bg-slate-50 rounded-3xl flex items-center justify-center">
        <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">
          No Image
        </span>
      </div>
    );
  }

  return (
    // Mobile  → flex-col : thumbnails BELOW main image (horizontal row)
    // Desktop → flex-row : thumbnails LEFT (vertical strip), main image RIGHT
    // md:h-[440px] fixes height so both strips stay equal — no empty space
    <div className="flex flex-col md:flex-row md:h-[440px] gap-2 md:gap-3">

      {/* ── Thumbnail Strip ─────────────────────────────────────────────────
          order-2 / mobile  → horizontal row below main image
          order-1 / desktop → vertical strip on the LEFT side               */}
      <div className="order-2 md:order-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto pb-1 md:pb-0 shrink-0 custom-scrollbar">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImage(idx)}
            aria-label={`View image ${idx + 1}`}
            className={cn(
              "relative size-[60px] md:size-[68px] shrink-0 rounded-xl md:rounded-2xl overflow-hidden border-2 transition-all duration-200",
              activeImage === idx
                ? "border-primary ring-2 ring-primary/20 shadow-md scale-[1.04]"
                : "border-slate-100 hover:border-slate-300 opacity-60 hover:opacity-100"
            )}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="68px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* ── Main Image ─────────────────────────────────────────────────────
          order-1 / mobile  → on TOP
          order-2 / desktop → on the RIGHT, fills full md:h-[440px] height
          aspect-square on mobile, aspect-auto on desktop (no wasted space)  */}
      <div className="order-1 md:order-2 flex-1 min-w-0 relative aspect-square md:aspect-auto rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 group">
        <Image
          src={images[activeImage].url}
          alt={images[activeImage].alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 45vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
    </div>
  );
}
