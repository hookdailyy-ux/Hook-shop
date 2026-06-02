import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "wouter";
import { Layers, ShoppingBag, Link2, Check, Share2, Eye, Package, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddToBasketModal } from "@/components/AddToBasketModal";
import { ImageGallery } from "@/components/ImageGallery";
import { useBasket, inferStore } from "@/contexts/BasketContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PublicLookProduct {
  id: number;
  productId: number;
  sortOrder: number;
  title: string;
  hookPrice: string | null;
  imageUrl: string | null;
  brand: string | null;
  affiliateUrl: string;
  category: string;
}

interface PublicLook {
  id: number;
  title: string;
  coverImageUrl: string | null;
  price: string | null;
  shareToken: string;
  views: number;
  productCount: number;
  createdAt: string;
  member: { fullName: string; username: string };
  products: PublicLookProduct[];
}

export default function LookShare() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [look, setLook] = useState<PublicLook | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addingProduct, setAddingProduct] = useState<PublicLookProduct | null>(null);
  const [addedFullLook, setAddedFullLook] = useState(false);
  const { toast } = useToast();
  const { addItem, openBasket } = useBasket();

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`${BASE}/api/looks/public/${token}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error("Failed");
        setLook((await res.json()) as PublicLook);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const shareUrl = useCallback(
    () => `${window.location.origin}${BASE}/l/${token}`,
    [token]
  );

  const handleAddFullLook = () => {
    if (!look || look.products.length === 0) return;
    look.products.forEach((product) => {
      addItem({
        productId: product.productId,
        productTitle: product.title,
        productImageUrl: product.imageUrl,
        displayPrice: product.hookPrice,
        affiliateUrl: product.affiliateUrl,
        brand: product.brand,
        size: null,
        color: null,
        productSource: inferStore(product.affiliateUrl),
        noonUrl: null,
        amazonUrl: null,
        noonPrice: null,
        amazonPrice: null,
        sourceMemberId: 0,
        sourceMemberUsername: look.member.username,
        sourceMemberName: look.member.fullName,
        sourceContext: "look",
        sourceToken: token ?? null,
      });
    });
    setAddedFullLook(true);
    setTimeout(() => {
      setAddedFullLook(false);
      openBasket();
    }, 800);
  };

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
    if (!look) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: look.title, text: `${look.member.fullName}'s look on HOOK`, url: shareUrl() });
      } catch { /* dismissed */ }
    } else {
      await copyLink();
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }

  if (notFound || !look) {
    return (
      <div className="py-32 text-center max-w-sm mx-auto px-4">
        <Layers className="h-8 w-8 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Not Available</p>
        <h1 className="font-serif text-2xl font-light mb-4">Look unavailable</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          This look may have been removed or set to private.
        </p>
        <Link href="/" className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
          Browse HOOK
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Hero ── */}
      {look.coverImageUrl ? (
        <div className="w-full aspect-[3/1] sm:aspect-[4/1] overflow-hidden">
          <img src={look.coverImageUrl} alt={look.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full aspect-[5/1] bg-accent/40" />
      )}

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* ── Meta ── */}
        <div className="pt-10 pb-8 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
                {look.member.fullName} · Look
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl font-light leading-tight mb-3">
                {look.title}
              </h1>
              {look.price && (
                <p className="text-sm font-mono text-muted-foreground">{look.price}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-center">
                <p className="font-serif text-3xl font-light leading-none">{look.productCount}</p>
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-1">Products</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="font-serif text-3xl font-light leading-none">{look.views.toLocaleString()}</p>
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-1">Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Share bar ── */}
        <div className="py-5 flex items-center gap-3 border-b border-border">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mr-1">Share</p>
          <button
            onClick={() => void copyLink()}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-4 py-2 border border-border hover:border-foreground/40 transition-colors text-muted-foreground hover:text-foreground"
          >
            {copiedLink ? <><Check className="h-3 w-3 text-green-600" /><span className="text-green-600">Copied!</span></> : <><Link2 className="h-3 w-3" />Copy Link</>}
          </button>
          <button
            onClick={() => void share()}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-4 py-2 border border-border hover:border-foreground/40 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-3 w-3" />
            Share
          </button>
          <Link
            href={`/store/${look.member.username}`}
            className="ml-auto flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="h-3 w-3" />
            View Store
          </Link>
        </div>

        {/* ── Add Full Look ── */}
        {look.products.length > 0 && (
          <div className="py-5 border-b border-border">
            <button
              onClick={handleAddFullLook}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background text-[11px] tracking-widest uppercase hover:opacity-90 transition-opacity"
            >
              {addedFullLook ? (
                <><Check className="h-3.5 w-3.5" /> Full Look Added!</>
              ) : (
                <><ShoppingCart className="h-3.5 w-3.5" /> Add Full Look to Basket</>
              )}
            </button>
            <p className="text-[9px] tracking-wide text-muted-foreground mt-2">
              Adds all {look.products.length} {look.products.length === 1 ? "piece" : "pieces"} · remove individual items in your basket
            </p>
          </div>
        )}

        {/* ── Products ── */}
        <div className="py-10">
          {look.products.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-border">
              <Package className="h-8 w-8 text-muted-foreground/20 mb-4" strokeWidth={1} />
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground">No Products Yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {look.products.map((product) => (
                <LookProductCard key={product.id} product={product} onAddToBasket={setAddingProduct} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border pt-8 pb-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-3.5 w-3.5 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              Curated by <span className="font-medium text-foreground">{look.member.fullName}</span>
            </p>
          </div>
          <Link href="/" className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
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
            displayPrice: addingProduct.hookPrice,
            affiliateUrl: addingProduct.affiliateUrl,
            brand: addingProduct.brand,
          }}
          sourceMemberId={0}
          sourceMemberUsername={look.member.username}
          sourceMemberName={look.member.fullName}
          sourceContext="look"
          sourceToken={token ?? null}
          onClose={() => setAddingProduct(null)}
        />
      )}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function LookProductCard({
  product,
  onAddToBasket,
}: {
  product: PublicLookProduct;
  onAddToBasket: (p: PublicLookProduct) => void;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const galleryImages = product.imageUrl ? [product.imageUrl] : [];

  return (
    <>
      <div className="group flex flex-col gap-3">
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
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToBasket(product); }}
              className="w-full bg-background/90 text-foreground text-[10px] tracking-widest uppercase py-3 backdrop-blur-sm border border-border/50 hover:bg-foreground hover:text-background transition-colors"
            >
              Add To Basket
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1 px-0.5">
          {product.brand && (
            <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
              {product.brand}
            </p>
          )}
          <p className="text-sm leading-snug line-clamp-2">{product.title}</p>
          {product.hookPrice && <p className="text-sm font-medium mt-0.5">{product.hookPrice}</p>}
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
