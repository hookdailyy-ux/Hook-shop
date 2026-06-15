import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, Check } from "lucide-react";
import { HeartButton } from "./HeartButton";
import { ProductDetailModal } from "./ProductDetailModal";
import type { Look, Product } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { resolveImageUrl } from "@/lib/apiBase";
import { useBasket, inferStore } from "@/contexts/BasketContext";

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
      <div className="w-full bg-[#ddd5c8] flex items-center justify-center relative" style={{ aspectRatio: "3/4", maxHeight: "80dvh" }}>
        <ShoppingBag className="h-12 w-12 text-muted-foreground/20" strokeWidth={1} />
        <div className="absolute top-4 left-4">
          <HeartButton item={{ id: lookId, type: "look", title, imageUrl: lookImageUrl }} />
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
      {slides.map((url, i) => (
        <img
          key={url + i}
          src={resolveImageUrl(url)}
          alt={i === 0 ? title : `${title} ${i + 1}`}
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      ))}

      <div className="absolute top-4 left-4 z-10">
        <HeartButton item={{ id: lookId, type: "look", title, imageUrl: lookImageUrl }} />
      </div>

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

function LookProductCard({
  product,
  onOpenDetail,
}: {
  product: Product;
  onOpenDetail: (id: number) => void;
}) {
  const { t } = useTranslation();
  const { addItem, openBasket } = useBasket();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      productTitle: product.title,
      productImageUrl: product.imageUrl ?? null,
      displayPrice: product.price ?? (product as any).amazonPrice ?? null,
      affiliateUrl: product.affiliateUrl,
      brand: product.brand ?? null,
      size: null,
      color: null,
      productSource: product.source ?? inferStore(product.affiliateUrl),
      amazonUrl: null,
      amazonPrice: null,
      sourceMemberId: 0,
      sourceMemberUsername: "",
      sourceMemberName: "",
      sourceContext: "look",
      sourceToken: null,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openBasket();
    }, 800);
  };

  return (
    <div className="flex flex-col group" data-testid={`look-item-${product.id}`}>
      {/* Image — opens product detail modal */}
      <div
        className="aspect-[3/4] bg-[#e8e0d4] overflow-hidden mb-3 relative cursor-pointer"
        onClick={() => onOpenDetail(product.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpenDetail(product.id)}
      >
        {product.imageUrl ? (
          <img
            src={resolveImageUrl(product.imageUrl)}
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
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-[9px] tracking-[0.3em] uppercase bg-black/50 px-4 py-2">
            Quick View
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        <button
          onClick={() => onOpenDetail(product.id)}
          className="text-left text-xs font-medium leading-snug line-clamp-2 hover:underline decoration-1 underline-offset-2"
        >
          {product.title}
        </button>
        <p className="text-sm font-semibold">{product.price || (product as any).amazonPrice || "TBA"}</p>

        {/* Add to Basket */}
        <button
          onClick={handleAdd}
          disabled={added}
          className="mt-1.5 w-full text-center bg-foreground text-background text-[10px] tracking-widest uppercase py-3 hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-70"
          data-testid={`button-order-${product.id}`}
        >
          {added ? (
            <><Check className="h-3 w-3" />Added!</>
          ) : (
            <><ShoppingBag className="h-3 w-3" />{t("addToBasket.title")}</>
          )}
        </button>

        {/* Heart */}
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

// ── Main LookCard ─────────────────────────────────────────────────────────────

interface LookCardProps {
  look: Look;
}

export function LookCard({ look }: LookCardProps) {
  const { t } = useTranslation();
  const [detailId, setDetailId] = useState<number | null>(null);

  const slides: string[] = [];
  if (look.imageUrl) slides.push(look.imageUrl);
  ((look as any).images ?? []).forEach((url: string) => {
    if (url && !slides.includes(url)) slides.push(url);
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

      {/* ── Look title ── */}
      <div className="text-center mt-8 mb-8">
        <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-2">
          {t("shopTheLook.outfit")}
        </p>
        <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight mb-2">
          {look.title}
        </h2>
        {look.description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {look.description}
          </p>
        )}
      </div>

      {/* ── "Shop This Look" heading ── */}
      {hasProducts && (
        <div className="flex items-center gap-5 mb-8">
          <div className="flex-1 h-px bg-border" />
          <p className="text-[11px] tracking-[0.4em] uppercase font-medium shrink-0">
            {t("shopTheLook.thisLookIncludes")}
          </p>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* ── Products ── */}
      {hasProducts ? (
        <div className="no-scrollbar flex gap-4 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-3">
          {look.products!.map((product) => (
            <div key={product.id} className="shrink-0 w-[44vw] sm:w-52 max-w-[220px]">
              <LookProductCard product={product} onOpenDetail={setDetailId} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-border">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
            {t("shopTheLook.noItems")}
          </p>
        </div>
      )}

      {/* ── Product detail modal ── */}
      {detailId !== null && (
        <ProductDetailModal
          productId={detailId}
          onClose={() => setDetailId(null)}
          sourceContext="look"
        />
      )}
    </section>
  );
}
