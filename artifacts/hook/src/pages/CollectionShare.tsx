import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "wouter";
import {
  FolderOpen,
  ShoppingBag,
  Link2,
  Check,
  Share2,
  Eye,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddToBasketModal } from "@/components/AddToBasketModal";
import { ImageGallery } from "@/components/ImageGallery";
import { inferStore } from "@/contexts/BasketContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicProduct {
  id: number;
  productId: number;
  title: string;
  displayPrice: string | null;
  imageUrl: string | null;
  brand: string | null;
  affiliateUrl: string;
  category: string;
  sortOrder: number;
}

interface PublicCollection {
  id: number;
  title: string;
  description: string;
  coverImageUrl: string | null;
  coverImagePosX: number;
  coverImagePosY: number;
  coverImageScale: number;
  coverImageObjectFit: string;
  shareToken: string;
  views: number;
  productCount: number;
  createdAt: string;
  member: { fullName: string; username: string };
  products: PublicProduct[];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CollectionShare() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [collection, setCollection] = useState<PublicCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addingProduct, setAddingProduct] = useState<PublicProduct | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`${BASE}/api/collections/public/${token}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error("Failed");
        setCollection((await res.json()) as PublicCollection);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const shareUrl = useCallback(() => {
    if (!collection) return window.location.href;
    return `${window.location.origin}${BASE}/c/${collection.shareToken}`;
  }, [collection]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopiedLink(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const share = async () => {
    if (!collection) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection.title,
          text: `${collection.member.fullName}'s collection on HOOK`,
          url: shareUrl(),
        });
      } catch {
        // dismissed — ignore
      }
    } else {
      await copyLink();
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="py-32 text-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  // ── Not Found / Hidden ──
  if (notFound || !collection) {
    return (
      <div className="py-32 text-center max-w-sm mx-auto px-4">
        <FolderOpen className="h-8 w-8 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
          Not Available
        </p>
        <h1 className="font-serif text-2xl font-light mb-4">
          Collection unavailable
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          This collection may have been removed or set to private.
        </p>
        <Link
          href="/"
          className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Browse HOOK
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Hero: image + text overlay ── */}
      <div
        className={`relative w-full overflow-hidden border-b border-border bg-[#e8e0d4] ${
          collection.coverImageUrl ? "min-h-[260px] md:min-h-[400px]" : "min-h-[160px]"
        }`}
      >
        {collection.coverImageUrl && (
          <>
            <img
              src={collection.coverImageUrl}
              alt={collection.title}
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: (collection.coverImageObjectFit as "cover" | "contain") || "cover",
                objectPosition: `${collection.coverImagePosX ?? 50}% ${collection.coverImagePosY ?? 50}%`,
                transform: `scale(${(collection.coverImageScale ?? 100) / 100})`,
                transformOrigin: `${collection.coverImagePosX ?? 50}% ${collection.coverImagePosY ?? 50}%`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/20 to-black/70" />
          </>
        )}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl pb-10">
            <p
              className={`text-[10px] tracking-[0.3em] uppercase mb-3 ${
                collection.coverImageUrl ? "text-white/70" : "text-muted-foreground"
              }`}
            >
              {collection.member.fullName} · Collection
            </p>
            <h1
              className={`font-serif text-4xl sm:text-5xl font-light leading-tight mb-2 ${
                collection.coverImageUrl ? "text-white" : ""
              }`}
            >
              {collection.title}
            </h1>
            {collection.description && (
              <p
                className={`text-sm leading-relaxed max-w-lg ${
                  collection.coverImageUrl ? "text-white/70" : "text-muted-foreground"
                }`}
              >
                {collection.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">

        {/* ── Stats + Share bar ── */}
        <div className="py-5 flex flex-wrap items-center gap-3 border-b border-border">
          {/* Stats */}
          <div className="flex items-center gap-5 mr-auto">
            <div className="text-center">
              <p className="font-serif text-2xl font-light leading-none">{collection.productCount}</p>
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-0.5">Products</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-serif text-2xl font-light leading-none">{collection.views.toLocaleString()}</p>
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-0.5">Views</p>
            </div>
          </div>

          {/* Share buttons */}
          <button
            onClick={() => void copyLink()}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-4 py-2 border border-border hover:border-foreground/40 transition-colors text-muted-foreground hover:text-foreground"
          >
            {copiedLink ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="h-3 w-3" />
                Copy Link
              </>
            )}
          </button>
          <button
            onClick={() => void share()}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-4 py-2 border border-foreground/60 text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            <Share2 className="h-3 w-3" />
            Share This Collection
          </button>
        </div>

        {/* ── Products ── */}
        <div className="py-10">
          {collection.products.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-border">
              <Package className="h-8 w-8 text-muted-foreground/20 mb-4" strokeWidth={1} />
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                No Products Yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {collection.products.map((product) => (
                <CollectionProductCard key={product.id} product={product} onAddToBasket={setAddingProduct} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border pt-8 pb-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-3.5 w-3.5 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              Curated by{" "}
              <span className="font-medium text-foreground">
                {collection.member.fullName}
              </span>
            </p>
          </div>
          <Link
            href="/"
            className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Shop at HOOK →
          </Link>
        </div>
      </div>

      {/* Add to basket modal */}
      {addingProduct && (
        <AddToBasketModal
          product={{
            id: addingProduct.productId,
            title: addingProduct.title,
            imageUrl: addingProduct.imageUrl,
            displayPrice: addingProduct.displayPrice,
            affiliateUrl: addingProduct.affiliateUrl,
            brand: addingProduct.brand,
            source: inferStore(addingProduct.affiliateUrl),
          }}
          sourceMemberId={0}
          sourceMemberUsername={collection.member.username}
          sourceMemberName={collection.member.fullName}
          sourceContext="collection"
          sourceToken={collection.shareToken}
          onClose={() => setAddingProduct(null)}
        />
      )}
    </div>
  );
}

// ─── Collection Product Card ──────────────────────────────────────────────────

function CollectionProductCard({
  product,
  onAddToBasket,
}: {
  product: PublicProduct;
  onAddToBasket: (p: PublicProduct) => void;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const galleryImages = product.imageUrl ? [product.imageUrl] : [];

  return (
    <>
      <div className="group flex flex-col gap-3">
        {/* Image */}
        <div className="relative overflow-hidden bg-accent/30">
          <div
            className={`aspect-[3/4] ${galleryImages.length > 0 ? "cursor-zoom-in" : ""}`}
            onClick={() => galleryImages.length > 0 && setGalleryOpen(true)}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Hover overlay button — desktop */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToBasket(product); }}
              className="w-full bg-background/90 text-foreground text-[10px] tracking-widest uppercase py-3 backdrop-blur-sm border border-border/50 hover:bg-foreground hover:text-background transition-colors"
            >
              Add To Basket
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 px-0.5">
          {product.brand && (
            <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
              {product.brand}
            </p>
          )}
          <p className="text-sm leading-snug line-clamp-2">{product.title}</p>
          {product.displayPrice && (
            <p className="text-sm font-medium mt-0.5">{product.displayPrice}</p>
          )}

          {/* Always-visible button — mobile */}
          <button
            onClick={() => onAddToBasket(product)}
            className="mt-2 w-full text-[10px] tracking-widest uppercase py-3 border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-colors md:hidden"
          >
            Add To Basket
          </button>
        </div>
      </div>

      {galleryOpen && (
        <ImageGallery
          images={galleryImages}
          startIndex={0}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}
