import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { HeartButton } from "./HeartButton";
import { QuickViewModal, type QuickViewProduct } from "./QuickViewModal";
import type { Look, Product } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";

// ── Gallery ────────────────────────────────────────────────────────────────────

interface GalleryProps {
  slides: string[];
  title: string;
  lookId: number;
  lookImageUrl: string | null;
}

function Gallery({ slides, title, lookId, lookImageUrl }: GalleryProps) {
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
      <div className="w-full aspect-[3/4] bg-[#ddd5c8] flex items-center justify-center relative">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/20" strokeWidth={1} />
        <div className="absolute top-3 left-3">
          <HeartButton item={{ id: lookId, type: "look", title, imageUrl: lookImageUrl }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full aspect-[3/4] relative overflow-hidden bg-[#e8e0d4] select-none"
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
        <HeartButton item={{ id: lookId, type: "look", title, imageUrl: lookImageUrl }} />
      </div>

      {/* Counter */}
      {slides.length > 1 && (
        <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-sm text-white text-[10px] tracking-widest px-2.5 py-1">
          {current + 1} / {slides.length}
        </div>
      )}

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`w-1.5 h-1.5 transition-all duration-300 ${
                  i === current
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Product card ───────────────────────────────────────────────────────────────

function LookProductCard({
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
    <div className="flex flex-col group">
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
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-[9px] tracking-[0.3em] uppercase bg-black/50 px-4 py-2">
            Quick View
          </span>
        </div>
        {/* Heart */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        {product.brand && (
          <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{product.brand}</p>
        )}
        <button
          onClick={() => onQuickView(qvProduct)}
          className="text-xs font-medium leading-snug line-clamp-2 text-left hover:underline decoration-1 underline-offset-2 transition-colors"
        >
          {product.title}
        </button>
        <p className="text-sm font-semibold">{product.price || "TBA"}</p>

        {/* Add to Basket */}
        <button
          onClick={() => onQuickView(qvProduct)}
          className="mt-1.5 w-full text-center bg-foreground text-background text-[10px] tracking-widest uppercase py-3 hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5"
          data-testid={`button-add-to-basket-look-${product.id}`}
        >
          <ShoppingBag className="h-3 w-3" />
          {t("addToBasket.title")}
        </button>

        <p className="text-[9px] text-center text-muted-foreground tracking-wide mt-0.5">
          {product.category === "electronics" ? t("product.deliveredByAmazon") : t("product.deliveredByShein")}
        </p>
      </div>
    </div>
  );
}

// ── Main LookCard ─────────────────────────────────────────────────────────────

interface LookCardProps {
  look: Look;
}

export function LookCard({ look }: LookCardProps) {
  const { t } = useTranslation();
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);

  // Build gallery slides: cover image + product images
  const slides: string[] = [];
  if (look.imageUrl) slides.push(look.imageUrl);
  (look.products ?? []).forEach((p) => {
    if (p.imageUrl && !slides.includes(p.imageUrl)) slides.push(p.imageUrl);
  });

  const hasProducts = (look.products?.length ?? 0) > 0;

  return (
    <section data-testid={`card-look-${look.id}`} className="w-full">
      {/* ── Gallery ── */}
      <Gallery
        slides={slides}
        title={look.title}
        lookId={look.id}
        lookImageUrl={look.imageUrl ?? null}
      />

      {/* ── Look details ── */}
      <div className="mt-6 mb-8">
        <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-2">
          {t("shopTheLook.outfit")}
        </p>
        <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight mb-2">
          {look.title}
        </h2>
        {look.description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            {look.description}
          </p>
        )}
      </div>

      {/* ── Products ── */}
      {hasProducts && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground shrink-0">
              {t("shopTheLook.thisLookIncludes")}
            </p>
            <div className="flex-1 h-px bg-border" />
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground shrink-0">
              {look.products!.length} {t(look.products!.length !== 1 ? "checkout.items" : "checkout.item")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {look.products!.map((product) => (
              <LookProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        </div>
      )}

      {!hasProducts && (
        <div className="py-16 text-center border border-dashed border-border">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
            {t("shopTheLook.noItems")}
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
