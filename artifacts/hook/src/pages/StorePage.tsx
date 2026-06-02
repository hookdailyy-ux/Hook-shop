import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "wouter";
import {
  User,
  Layers,
  FolderOpen,
  MessageCircle,
  Link2,
  Check,
  Share2,
  ShoppingBag,
  Eye,
  Heart,
  Tag,
  RefreshCw,
  Instagram,
  Star,
  Package,
  TrendingUp,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddToBasketModal } from "@/components/AddToBasketModal";
import { useBasket, inferStore } from "@/contexts/BasketContext";
import { useFavorites } from "@/contexts/FavoritesContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreMember {
  id: number;
  fullName: string;
  displayName: string | null;
  username: string;
  bio: string | null;
  whyShopWithMe: string | null;
  profilePhotoUrl: string | null;
  coverImageUrl: string | null;
  whatsapp: string | null;
}

interface StoreCollection {
  id: number;
  title: string;
  coverImageUrl: string | null;
  shareToken: string;
  views: number;
  createdAt: string;
}

interface StoreLook {
  id: number;
  title: string;
  coverImageUrl: string | null;
  price: string | null;
  shareToken: string;
  views: number;
  createdAt: string;
}

interface StoreFeaturedProduct {
  id: number;
  title: string;
  imageUrl: string | null;
  brand: string | null;
  affiliateUrl: string;
  category: string;
  displayPrice: string | null;
}

interface StoreData {
  member: StoreMember;
  stats: {
    products: number;
    collections: number;
    looks: number;
    followers: number;
    totalViews: number;
  };
  collections: StoreCollection[];
  looks: StoreLook[];
  featuredProducts: StoreFeaturedProduct[];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StorePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addingProduct, setAddingProduct] = useState<StoreFeaturedProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { items: basketItems, openBasket } = useBasket();
  const { count: favCount } = useFavorites();

  useEffect(() => {
    if (!username) return;
    void (async () => {
      try {
        const res = await fetch(`${BASE}/api/store/${username.toLowerCase()}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error("Failed");
        setStore((await res.json()) as StoreData);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  // Track profile view
  useEffect(() => {
    if (!store) return;
    void fetch(`${BASE}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: store.member.id, entityType: "profile", entityId: store.member.id, eventType: "view" }),
    });
  }, [store?.member.id]);

  const handleProductAddToBasket = (product: StoreFeaturedProduct) => {
    setAddingProduct(product);
    if (store) {
      void fetch(`${BASE}/api/analytics/event`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: store.member.id, entityType: "product", entityId: product.id, eventType: "add_to_basket" }),
      });
    }
  };

  const trackProductClick = (productId: number) => {
    if (!store) return;
    void fetch(`${BASE}/api/analytics/event`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: store.member.id, entityType: "product", entityId: productId, eventType: "click" }),
    });
  };

  const storeUrl = useCallback(
    () => `${window.location.origin}${BASE}/store/${username}`,
    [username]
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl());
      setCopiedLink(true);
      toast({ title: "Store link copied" });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const share = async () => {
    if (!store) return;
    const name = store.member.displayName ?? store.member.fullName;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name}'s Store`, url: storeUrl() });
      } catch { /* dismissed */ }
    } else {
      await copyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/40 flex items-center justify-center mb-6">
          <User className="h-7 w-7 text-muted-foreground/40" strokeWidth={1} />
        </div>
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">Store Not Found</p>
        <h1 className="font-serif text-3xl font-light mb-4">This store isn't available</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
          The store may have been removed or is not yet active.
        </p>
        <Link href="/" className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
          Browse HOOK →
        </Link>
      </div>
    );
  }

  const { member, stats, collections, looks, featuredProducts } = store;
  const displayName = member.displayName ?? member.fullName;

  const q = searchQuery.trim().toLowerCase();
  const filteredProducts = q
    ? featuredProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q)
      )
    : featuredProducts;
  const filteredCollections = q
    ? collections.filter((c) => c.title.toLowerCase().includes(q))
    : collections;
  const filteredLooks = q
    ? looks.filter((l) => l.title.toLowerCase().includes(q))
    : looks;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>

      {/* ══ STORE HEADER ═════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">

          {/* Logo + "Powered by HOOK" */}
          <Link href="/" className="flex flex-col items-start shrink-0 group">
            <span className="font-serif text-lg leading-none tracking-widest text-foreground group-hover:opacity-70 transition-opacity">
              HOOK
            </span>
            <span className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground/60 leading-none mt-0.5">
              Powered by HOOK
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-sm mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search this store…"
              className="w-full pl-8 pr-3 py-2 text-xs tracking-wide border border-border bg-accent/20 focus:bg-background focus:outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Wishlist + Basket */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/favorites"
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              {favCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-foreground text-background text-[8px] flex items-center justify-center leading-none">
                  {favCount > 9 ? "9+" : favCount}
                </span>
              )}
            </Link>
            <button
              onClick={openBasket}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              {basketItems.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-foreground text-background text-[8px] flex items-center justify-center leading-none">
                  {basketItems.length > 9 ? "9+" : basketItems.length}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ══ COVER IMAGE ══════════════════════════════════════════════════════ */}
      <div className="relative">
        <div className="h-44 sm:h-60 lg:h-80 overflow-hidden bg-stone-200 dark:bg-stone-800">
          {member.coverImageUrl ? (
            <img
              src={member.coverImageUrl}
              alt={`${displayName}'s cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: "linear-gradient(135deg, hsl(35,25%,88%) 0%, hsl(25,20%,82%) 50%, hsl(40,22%,85%) 100%)",
              }}
            />
          )}
          {/* Gradient fade at bottom for photo overlap effect */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/20 to-transparent" />
        </div>

        {/* Profile photo — centered, half overlapping cover bottom */}
        <div className="absolute bottom-0 inset-x-0 flex justify-center translate-y-1/2 z-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-stone-100 dark:bg-stone-700 shrink-0">
            {member.profilePhotoUrl ? (
              <img src={member.profilePhotoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ PAGE BODY ════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Space for overlapping profile photo */}
        <div className="pt-16 sm:pt-18 lg:pt-20" />

        {/* ── Profile name row ─────────────────────────────────────────────── */}
        <div className="text-center mb-4 lg:mb-6">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">
            {displayName}
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mt-2">
            @{member.username}
          </p>
        </div>

        {/* ══ 2-COL LAYOUT: Main | Right sidebar ════════════════════════════ */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">

          {/* ── MAIN COLUMN ─────────────────────────────────────────────────── */}
          <div className="min-w-0">

            {/* Bio (main column) */}
            {member.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed text-center lg:text-left mb-6 max-w-xl mx-auto lg:mx-0">
                {member.bio}
              </p>
            )}

            {/* Mobile action buttons */}
            <div className="flex justify-center gap-2 mb-8 flex-wrap lg:hidden">
              {member.whatsapp && (
                <a
                  href={`https://wa.me/${member.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-xs tracking-widest uppercase rounded-full shadow-sm hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message Me
                </a>
              )}
              <button
                onClick={() => void copyLink()}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-xs tracking-widest uppercase rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors bg-background"
              >
                {copiedLink
                  ? <><Check className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600">Copied!</span></>
                  : <><Link2 className="h-3.5 w-3.5" />Copy Link</>}
              </button>
              <button
                onClick={() => void share()}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-xs tracking-widest uppercase rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors bg-background"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>

            {/* ── MOBILE: About + Why Shop card (inline, before stats) ─────── */}
            <div className="lg:hidden mb-8">
              <AboutSidebarCard
                member={member}
                copiedLink={copiedLink}
                onCopyLink={() => void copyLink()}
                onShare={() => void share()}
              />
            </div>

            {/* ── STATS BAR ─────────────────────────────────────────────────── */}
            <div className="no-scrollbar flex items-center gap-0 border-t border-b border-border mb-10 overflow-x-auto">
              {[
                { label: "Products", value: stats.products.toLocaleString(), icon: Package },
                { label: "Collections", value: stats.collections.toLocaleString(), icon: FolderOpen },
                { label: "Looks", value: stats.looks.toLocaleString(), icon: Layers },
                { label: "Followers", value: stats.followers.toLocaleString(), icon: Heart },
                { label: "Views", value: stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews.toLocaleString(), icon: Eye },
              ].map(({ label, value, icon: Icon }, i, arr) => (
                <div
                  key={label}
                  className={`flex-1 min-w-[90px] py-5 flex flex-col items-center gap-1.5 text-center shrink-0 ${i < arr.length - 1 ? "border-r border-border" : ""}`}
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground/50" strokeWidth={1.5} />
                  <p className="font-serif text-xl sm:text-2xl font-light leading-none">{value}</p>
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* ── COLLECTIONS ──────────────────────────────────────────────── */}
            {filteredCollections.length > 0 && (
              <section className="mb-12">
                <SectionHeader icon={FolderOpen} title="Collections" count={filteredCollections.length} />

                {/* Mobile: horizontal scroll */}
                <div
                  className="flex gap-4 overflow-x-auto pb-3 lg:hidden"
                  style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
                >
                  {filteredCollections.map((c) => (
                    <Link key={c.id} href={`/c/${c.shareToken}`}>
                      <div className="w-[72vw] max-w-[280px] min-w-[220px] shrink-0 bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                        <div className="aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-800">
                          {c.coverImageUrl ? (
                            <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FolderOpen className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-medium line-clamp-1 mb-1">{c.title}</p>
                          <p className="text-[10px] text-muted-foreground">{c.views.toLocaleString()} views</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop: grid */}
                <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredCollections.map((c) => (
                    <Link key={c.id} href={`/c/${c.shareToken}`}>
                      <div className="group bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-all duration-300">
                        <div className="aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-800">
                          {c.coverImageUrl ? (
                            <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FolderOpen className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <p className="font-medium mb-1">{c.title}</p>
                          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{c.views.toLocaleString()} views</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── LOOKS ────────────────────────────────────────────────────── */}
            {filteredLooks.length > 0 && (
              <section className="mb-12">
                <SectionHeader icon={Layers} title="Looks" count={filteredLooks.length} />

                {/* Mobile: horizontal scroll */}
                <div
                  className="flex gap-4 overflow-x-auto pb-3 lg:hidden"
                  style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
                >
                  {filteredLooks.map((l) => (
                    <Link key={l.id} href={`/l/${l.shareToken}`}>
                      <div className="w-[60vw] max-w-[240px] min-w-[180px] shrink-0 bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                        <div className="aspect-[3/4] overflow-hidden bg-stone-100 dark:bg-stone-800">
                          {l.coverImageUrl ? (
                            <img src={l.coverImageUrl} alt={l.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Layers className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium line-clamp-1 mb-0.5">{l.title}</p>
                          {l.price && <p className="text-xs font-mono text-muted-foreground">{l.price}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop: grid */}
                <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredLooks.map((l) => (
                    <Link key={l.id} href={`/l/${l.shareToken}`}>
                      <div className="group bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-all duration-300">
                        <div className="aspect-[3/4] overflow-hidden bg-stone-100 dark:bg-stone-800">
                          {l.coverImageUrl ? (
                            <img src={l.coverImageUrl} alt={l.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Layers className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-medium line-clamp-1 mb-1">{l.title}</p>
                          {l.price && <p className="text-xs font-mono text-muted-foreground">{l.price}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── FEATURED PRODUCTS ─────────────────────────────────────────── */}
            {filteredProducts.length > 0 && (
              <section className="mb-12">
                <SectionHeader icon={ShoppingBag} title="Products" count={filteredProducts.length} />

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onAddToBasket={handleProductAddToBasket} onTrackClick={() => trackProductClick(p.id)} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {filteredCollections.length === 0 && filteredLooks.length === 0 && filteredProducts.length === 0 && (
              <div className="py-16 text-center border border-dashed border-border rounded-2xl my-8">
                <TrendingUp className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Coming Soon</p>
                <p className="text-sm text-muted-foreground">
                  {displayName} is building their store. Check back soon!
                </p>
              </div>
            )}

            {/* ── PROMOTIONAL CARDS ─────────────────────────────────────────── */}
            <PromoCards displayName={displayName} />

          </div>
          {/* end main col */}

          {/* ── RIGHT SIDEBAR (desktop only) ──────────────────────────────── */}
          <div className="hidden lg:block mt-0">
            <div className="sticky top-6">
              <AboutSidebarCard
                member={member}
                copiedLink={copiedLink}
                onCopyLink={() => void copyLink()}
                onShare={() => void share()}
              />
            </div>
          </div>

        </div>
        {/* end grid */}

        {/* Add to basket modal */}
        {addingProduct && store && (
          <AddToBasketModal
            product={{
              id: addingProduct.id,
              title: addingProduct.title,
              imageUrl: addingProduct.imageUrl,
              displayPrice: addingProduct.displayPrice,
              affiliateUrl: addingProduct.affiliateUrl,
              brand: addingProduct.brand,
              source: inferStore(addingProduct.affiliateUrl),
            }}
            sourceMemberId={store.member.id}
            sourceMemberUsername={store.member.username}
            sourceMemberName={store.member.displayName ?? store.member.fullName}
            sourceContext="store"
            onClose={() => setAddingProduct(null)}
          />
        )}

        {/* Footer */}
        <div className="border-t border-border pt-8 mt-6 pb-16 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-muted-foreground">
            Curated by <span className="font-medium text-foreground">{displayName}</span>
          </p>
          <Link href="/" className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
            Shop at HOOK →
          </Link>
        </div>

      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-foreground/60" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl font-light">{title}</h2>
      </div>
      <span className="text-[10px] tracking-widest uppercase text-muted-foreground border border-border px-2 py-1">
        {count}
      </span>
    </div>
  );
}

// ─── About Sidebar Card ───────────────────────────────────────────────────────

function AboutSidebarCard({
  member,
  copiedLink,
  onCopyLink,
  onShare,
}: {
  member: StoreMember;
  copiedLink: boolean;
  onCopyLink: () => void;
  onShare: () => void;
}) {
  return (
    <div className="space-y-4">

      {/* About Me */}
      {member.bio && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-medium">About Me</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{member.bio}</p>
        </div>
      )}

      {/* Why Shop With Me */}
      {member.whyShopWithMe && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Why Shop With Me</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{member.whyShopWithMe}</p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-border/50 p-5 space-y-3">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-medium mb-4">Connect</p>

        {member.whatsapp && (
          <a
            href={`https://wa.me/${member.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-green-600 text-white text-xs tracking-widest uppercase rounded-xl hover:bg-green-700 transition-colors shadow-sm"
          >
            <MessageCircle className="h-4 w-4" />
            Message Me
          </a>
        )}

        <button
          onClick={onCopyLink}
          className="flex items-center justify-center gap-2.5 w-full py-3 border border-border text-xs tracking-widest uppercase rounded-xl text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          {copiedLink ? (
            <><Check className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600">Link Copied!</span></>
          ) : (
            <><Link2 className="h-3.5 w-3.5" />Copy Store Link</>
          )}
        </button>

        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2.5 w-full py-3 border border-border text-xs tracking-widest uppercase rounded-xl text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share Store
        </button>
      </div>

      {/* Branding tag */}
      <div className="text-center pt-1">
        <p className="text-[9px] tracking-widest uppercase text-muted-foreground/50">
          Powered by <span className="font-medium">HOOK</span>
        </p>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, onAddToBasket, onTrackClick }: {
  product: StoreFeaturedProduct;
  onAddToBasket: (p: StoreFeaturedProduct) => void;
  onTrackClick: () => void;
}) {
  return (
    <div className="group bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-all duration-300 flex flex-col">
      <div className="aspect-[3/4] overflow-hidden bg-stone-100 dark:bg-stone-800 relative">
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
        {/* Hover overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
          <button
            onClick={() => onAddToBasket(product)}
            className="w-full py-2.5 bg-white/95 text-foreground text-[10px] tracking-widest uppercase rounded-xl shadow-sm hover:bg-foreground hover:text-background transition-colors backdrop-blur-sm"
          >
            Add to Basket
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
        {product.brand && (
          <p className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground">{product.brand}</p>
        )}
        <p className="text-xs sm:text-sm leading-snug line-clamp-2 flex-1">{product.title}</p>
        {product.displayPrice && (
          <p className="text-sm font-semibold">{product.displayPrice}</p>
        )}
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => { onTrackClick(); onAddToBasket(product); }}
            className="flex-1 py-2.5 bg-foreground text-background text-[10px] tracking-widest uppercase rounded-xl hover:opacity-90 transition-opacity"
          >
            Add to Basket
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Promotional Cards ────────────────────────────────────────────────────────

function PromoCards({ displayName }: { displayName: string }) {
  const cards = [
    {
      icon: Tag,
      bg: "from-amber-50 to-stone-100 dark:from-amber-900/20 dark:to-stone-800",
      iconColor: "text-amber-700 dark:text-amber-400",
      badge: "Members Only",
      title: "Special Prices",
      desc: `${displayName} has negotiated exclusive pricing on hand-picked styles. What you see here, you won't find cheaper elsewhere.`,
    },
    {
      icon: RefreshCw,
      bg: "from-rose-50 to-stone-100 dark:from-rose-900/20 dark:to-stone-800",
      iconColor: "text-rose-600 dark:text-rose-400",
      badge: "Always Fresh",
      title: "New Every Week",
      desc: "Fresh collections and styled looks are added every week. Save the store link and revisit often for the latest drops.",
    },
    {
      icon: Instagram,
      bg: "from-violet-50 to-stone-100 dark:from-violet-900/20 dark:to-stone-800",
      iconColor: "text-violet-600 dark:text-violet-400",
      badge: "Stay Connected",
      title: "Follow For More",
      desc: `Follow ${displayName} on social media for daily styling inspiration, outfit ideas, and first looks at new collections.`,
    },
  ];

  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {cards.map(({ icon: Icon, bg, iconColor, badge, title, desc }) => (
          <div
            key={title}
            className={`rounded-2xl p-5 sm:p-6 bg-gradient-to-br ${bg} border border-border/30`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-9 h-9 rounded-full bg-white/60 dark:bg-white/10 flex items-center justify-center shadow-sm`}>
                <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.5} />
              </div>
              <span className={`text-[9px] tracking-widest uppercase font-medium ${iconColor}`}>{badge}</span>
            </div>
            <h3 className="font-serif text-xl font-light mb-2">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
