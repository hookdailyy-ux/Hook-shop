import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { HeartButton } from "./HeartButton";
import { QuickViewModal, type QuickViewProduct } from "./QuickViewModal";
import type { Setup, Product } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";

// ── Gallery ────────────────────────────────────────────────────────────────────

interface GalleryProps {
  slides: string[];
  title: string;
  setupId: number;
  setupImageUrl: string | null;
}

function Gallery({ slides, title, setupId, setupImageUrl }: GalleryProps) {
  const [current, setCurrent] = useState(0);
  const touchRef = useRef({ x: 0, y: 0 });

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1)), [slides.length]);
  const next = useCallback(() => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1)), [slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchRef.current.x - e.changedTouches[0].clientX;
    const dy = Math.abs(touchRef.current.y - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 48 && dy < 80) {
      if (dx > 0) next(); else prev();
    }
  };

  if (slides.length === 0) {
    return (
      <div className="w-full bg-[#ddd5c8] flex items-center justify-center relative" style={{ aspectRatio: "3/4", maxHeight: "80dvh" }}>
        <ShoppingBag className="h-12 w-12 text-muted-foreground/20" strokeWidth={1} />
        <div className="absolute top-4 left-4">
          <HeartButton item={{ id: setupId, type: "setup", title, imageUrl: setupImageUrl }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full relative overflow-hidden bg-[#e8e0d4] select-none"
      style={{ aspectRatio: "3/4", maxHeight: "80dvh" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {slides.map((url, i) => (
        <img
          key={url + i}
          src={url}
          alt={i === 0 ? title : `${title} ${i + 1}`}
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      ))}

      {/* Heart button */}
      <div className="absolute top-4 left-4 z-10">
        <HeartButton item={{ id: setupId, type: "setup", title, imageUrl: setupImageUrl }} />
      </div>

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Counter — bottom center */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
            <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] tracking-widest px-3 py-1">
              {current + 1} / {slides.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Product card ───────────────────────────────────────────────────────────────

function SetupProductCard({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView: (p: QuickViewProduct) => void;
}) {
  const { t } = useTranslation();
  const qvProduct: QuickViewProduct = {
    id: product.id,
    title: product.title,
    imageUrl: product.imageUrl ?? null,
    price: product.price ?? null,
    brand: product.brand ?? null,
    affiliateUrl: product.affiliateUrl,
    category: product.category,
    source: product.source ?? null,
  };

  return (
    <div className="flex flex-col group" data-testid={`setup-item-${product.id}`}>
      {/* Image */}
      <div
        className="aspect-[3/4] bg-[#e8e0d4] overflow-hidden mb-3 relative cursor-pointer"
        onClick={() => onQuickView(qvProduct)}
        role="button"
        aria-label={`Quick view ${product.title}`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105"
            style={{
              objectFit: (product.imageObjectFit as "cover" | "contain") ?? "cover",
              objectPosition: `${product.imagePosX ?? 50}% ${product.imagePosY ?? 50}%`,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-muted-foreground/20" strokeWidth={1} />
          </div>
        )}
        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-[9px] tracking-[0.3em] uppercase bg-black/50 px-4 py-2">
            Quick View
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        <button
          onClick={() => onQuickView(qvProduct)}
          className="text-xs font-medium leading-snug line-clamp-2 text-left hover:underline decoration-1 underline-offset-2"
        >
          {product.title}
        </button>
        <p className="text-sm font-semibold">{product.price || "TBA"}</p>

        {/* Add to Basket */}
        <button
          onClick={() => onQuickView(qvProduct)}
          className="mt-1.5 w-full text-center bg-foreground text-background text-[10px] tracking-widest uppercase py-3 hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5"
          data-testid={`button-order-${product.id}`}
        >
          <ShoppingBag className="h-3 w-3" />
          {t("addToBasket.title")}
        </button>

        {/* Heart — always visible below button */}
        <div className="flex justify-center mt-1">
          <HeartButton
            item={{
              id: product.id,
              type: "product",
              title: product.title,
              imageUrl: product.imageUrl,
              affiliateUrl: product.affiliateUrl,
              category: product.category,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main SetupCard ─────────────────────────────────────────────────────────────

interface SetupCardProps {
  setup: Setup;
}

export function SetupCard({ setup }: SetupCardProps) {
  const { t } = useTranslation();
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);

  // Gallery slides: cover image + unique product images
  const slides: string[] = [];
  if (setup.imageUrl) slides.push(setup.imageUrl);
  (setup.products ?? []).forEach((p) => {
    if (p.imageUrl && !slides.includes(p.imageUrl)) slides.push(p.imageUrl);
  });

  const hasProducts = (setup.products?.length ?? 0) > 0;

  return (
    <section data-testid={`card-setup-${setup.id}`} className="w-full">
      {/* ── Gallery ── */}
      <Gallery
        slides={slides}
        title={setup.title}
        setupId={setup.id}
        setupImageUrl={setup.imageUrl ?? null}
      />

      {/* ── Setup title ── */}
      <div className="text-center mt-8 mb-8">
        <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-2">
          {t("shopTheSetup.setup")}
        </p>
        <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight mb-2">
          {setup.title}
        </h2>
        {setup.description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {setup.description}
          </p>
        )}
      </div>

      {/* ── "Shop This Setup" heading ── */}
      {hasProducts && (
        <div className="flex items-center gap-5 mb-8">
          <div className="flex-1 h-px bg-border" />
          <p className="text-[11px] tracking-[0.4em] uppercase font-medium shrink-0">
            {t("shopTheSetup.thisSetupIncludes")}
          </p>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* ── Products ── */}
      {hasProducts ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {setup.products!.map((product) => (
            <SetupProductCard
              key={product.id}
              product={product}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-border">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
            {t("shopTheSetup.noItems")}
          </p>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          sourceContext="look"
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </section>
  );
}
