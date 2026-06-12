import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { resolveImageUrl } from "@/lib/apiBase";

interface ImageGalleryProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

export function ImageGallery({ images, startIndex, onClose }: ImageGalleryProps) {
  const [current, setCurrent] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(images.length - 1, c + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) next();
    if (dx > 40) prev();
    touchStartX.current = null;
  };

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/95"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <span className="text-white/50 text-xs tracking-widest uppercase select-none">
          {current + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="text-white/60 hover:text-white transition-colors p-1.5 -mr-1.5"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main image area */}
      <div
        className="flex-1 flex items-center justify-center relative px-4 pb-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Prev arrow — desktop */}
        <button
          onClick={prev}
          disabled={current === 0}
          className="absolute left-3 z-10 hidden md:flex items-center justify-center w-10 h-10 text-white/60 hover:text-white disabled:opacity-0 transition-all"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={1.5} />
        </button>

        <img
          key={current}
          src={resolveImageUrl(images[current])}
          alt={`Product image ${current + 1}`}
          className="max-w-full object-contain select-none"
          style={{ maxHeight: "calc(100vh - 160px)" }}
          draggable={false}
        />

        {/* Next arrow — desktop */}
        <button
          onClick={next}
          disabled={current === images.length - 1}
          className="absolute right-3 z-10 hidden md:flex items-center justify-center w-10 h-10 text-white/60 hover:text-white disabled:opacity-0 transition-all"
          aria-label="Next image"
        >
          <ChevronRight className="h-7 w-7" strokeWidth={1.5} />
        </button>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="shrink-0 flex gap-2 justify-center px-4 pb-5 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 overflow-hidden transition-all ${
                i === current
                  ? "ring-2 ring-white opacity-100"
                  : "opacity-40 hover:opacity-70"
              }`}
              style={{ width: 44, height: 58 }}
              aria-label={`Go to image ${i + 1}`}
            >
              <img src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* Swipe hint — mobile only, single image */}
      {images.length > 1 && (
        <p className="text-center text-white/20 text-[9px] tracking-widest uppercase pb-3 shrink-0 md:hidden select-none">
          Swipe to browse
        </p>
      )}
    </div>
  );
}
