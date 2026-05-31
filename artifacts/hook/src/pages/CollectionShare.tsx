import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { FolderOpen } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PublicCollection {
  id: number;
  title: string;
  description: string;
  coverImageUrl: string | null;
  shareToken: string;
  createdAt: string;
  member: { fullName: string; username: string };
}

export default function CollectionShare() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [collection, setCollection] = useState<PublicCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  if (loading) {
    return (
      <div className="py-32 text-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  if (notFound || !collection) {
    return (
      <div className="py-32 text-center max-w-sm mx-auto px-4">
        <FolderOpen className="h-8 w-8 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
          Not Found
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
      {collection.coverImageUrl ? (
        <div className="w-full aspect-[3/1] sm:aspect-[4/1] overflow-hidden mb-10">
          <img
            src={collection.coverImageUrl}
            alt={collection.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[3/1] sm:aspect-[4/1] bg-accent/40 mb-10" />
      )}

      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
            {collection.member.fullName} · Collection
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-light mb-4">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              {collection.description}
            </p>
          )}
        </div>

        <div className="border border-dashed border-border py-20 text-center mb-16">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Products
          </p>
          <p className="text-sm text-muted-foreground">
            No products added yet.
          </p>
        </div>

        <div className="border-t border-border pt-8 pb-16 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Curated by{" "}
            <span className="font-medium text-foreground">{collection.member.fullName}</span>
          </p>
          <Link
            href="/"
            className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Shop at HOOK →
          </Link>
        </div>
      </div>
    </div>
  );
}
