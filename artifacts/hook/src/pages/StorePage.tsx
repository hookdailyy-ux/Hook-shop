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
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreMember {
  id: number;
  fullName: string;
  displayName: string | null;
  username: string;
  bio: string | null;
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

interface StoreData {
  member: StoreMember;
  stats: { collections: number; looks: number; totalViews: number };
  collections: StoreCollection[];
  looks: StoreLook[];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StorePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

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
        await navigator.share({ title: `${name}'s Store`, text: `Shop ${name}'s curated store on HOOK`, url: storeUrl() });
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

  if (notFound || !store) {
    return (
      <div className="py-32 text-center max-w-sm mx-auto px-4">
        <User className="h-8 w-8 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Not Found</p>
        <h1 className="font-serif text-2xl font-light mb-4">Store not available</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          This store may have been removed or is not yet active.
        </p>
        <Link href="/" className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
          Browse HOOK
        </Link>
      </div>
    );
  }

  const { member, stats, collections, looks } = store;
  const displayName = member.displayName ?? member.fullName;

  return (
    <div>
      {/* ── Cover banner ── */}
      {member.coverImageUrl ? (
        <div className="w-full aspect-[5/1] sm:aspect-[6/1] overflow-hidden">
          <img src={member.coverImageUrl} alt={displayName} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full aspect-[5/1] sm:aspect-[6/1] bg-accent/40" />
      )}

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* ── Profile header ── */}
        <div className="relative pb-8 border-b border-border">
          {/* Profile photo — overlapping cover */}
          <div className="absolute -top-10 left-0 h-20 w-20 border-2 border-background bg-accent/30 overflow-hidden">
            {member.profilePhotoUrl ? (
              <img src={member.profilePhotoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground/40" strokeWidth={1} />
              </div>
            )}
          </div>

          <div className="pt-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-light mb-1">{displayName}</h1>
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
                @{member.username}
              </p>
              {member.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  {member.bio}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {member.whatsapp && (
                <a
                  href={`https://wa.me/${member.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-4 py-2 border border-border hover:border-green-600/40 hover:text-green-700 transition-colors text-muted-foreground"
                >
                  <MessageCircle className="h-3 w-3" />
                  WhatsApp
                </a>
              )}
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
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="py-6 flex items-center gap-8 border-b border-border">
          <div className="text-center">
            <p className="font-serif text-2xl font-light">{stats.collections}</p>
            <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-0.5">Collections</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="font-serif text-2xl font-light">{stats.looks}</p>
            <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-0.5">Looks</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="font-serif text-2xl font-light">{stats.totalViews.toLocaleString()}</p>
            <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-0.5">Views</p>
          </div>
        </div>

        {/* ── Collections ── */}
        {collections.length > 0 && (
          <section className="py-10 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-light">Collections</h2>
              <FolderOpen className="h-4 w-4 text-muted-foreground/40" strokeWidth={1} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {collections.map((c) => (
                <Link key={c.id} href={`/c/${c.shareToken}`}>
                  <div className="border border-border hover:border-foreground/30 transition-colors group overflow-hidden">
                    <div className="aspect-[3/2] bg-accent/30 overflow-hidden">
                      {c.coverImageUrl ? (
                        <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderOpen className="h-6 w-6 text-muted-foreground/20" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{c.title}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{c.views} views</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Looks ── */}
        {looks.length > 0 && (
          <section className="py-10 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-light">Looks</h2>
              <Layers className="h-4 w-4 text-muted-foreground/40" strokeWidth={1} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {looks.map((l) => (
                <Link key={l.id} href={`/l/${l.shareToken}`}>
                  <div className="border border-border hover:border-foreground/30 transition-colors group overflow-hidden">
                    <div className="aspect-[3/2] bg-accent/30 overflow-hidden">
                      {l.coverImageUrl ? (
                        <img src={l.coverImageUrl} alt={l.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="h-6 w-6 text-muted-foreground/20" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{l.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {l.price && <p className="text-xs font-mono text-muted-foreground">{l.price}</p>}
                          <p className="text-[10px] text-muted-foreground/60">{l.views} views</p>
                        </div>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {collections.length === 0 && looks.length === 0 && (
          <div className="py-24 text-center border border-dashed border-border my-10">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Coming Soon</p>
            <p className="text-sm text-muted-foreground">
              {displayName} hasn't published any collections or looks yet.
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-border pt-8 pb-16 flex items-center justify-between">
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
