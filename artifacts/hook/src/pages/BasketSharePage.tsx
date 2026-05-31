import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { ShoppingBag, ExternalLink, ArrowRight } from "lucide-react";
import { useBasket, type BasketItem } from "@/contexts/BasketContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SharedBasketData {
  token: string;
  memberUsername: string;
  memberName: string;
  items: BasketItem[];
  createdAt: string;
}

export default function BasketSharePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { loadItems, openBasket } = useBasket();
  const { toast } = useToast();

  const [data, setData] = useState<SharedBasketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`${BASE}/api/basket/${token}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error("Failed");
        setData((await res.json()) as SharedBasketData);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleLoadBasket = () => {
    if (!data?.items?.length) return;
    loadItems(data.items);
    setLoaded(true);
    openBasket();
    toast({ title: "Basket loaded!", description: `${data.items.length} items ready.` });
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Loading basket…
        </p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="py-32 text-center max-w-sm mx-auto px-4">
        <ShoppingBag className="h-8 w-8 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
          Not Available
        </p>
        <h1 className="font-serif text-2xl font-light mb-4">Basket not found</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          This basket link may have expired or is invalid.
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

  const totalItems = data.items.reduce((s, i) => s + (i.quantity ?? 1), 0);
  const allPrices = data.items.every((i) => i.displayPrice);

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-2xl py-12">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
          Shared Basket · @{data.memberUsername}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-light leading-tight mb-2">
          {data.memberName}'s Basket
        </h1>
        <p className="text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? "item" : "items"} selected
        </p>
      </div>

      {/* Items list */}
      <div className="space-y-4 mb-8">
        {data.items.map((item, idx) => (
          <div
            key={`${item.key ?? item.productId}-${idx}`}
            className="flex gap-4 p-4 border border-border"
          >
            <div className="w-16 h-20 shrink-0 overflow-hidden bg-stone-100">
              {item.productImageUrl ? (
                <img
                  src={item.productImageUrl}
                  alt={item.productTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag
                    className="h-5 w-5 text-muted-foreground/20"
                    strokeWidth={1}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {item.brand && (
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                  {item.brand}
                </p>
              )}
              <p className="text-sm leading-snug">{item.productTitle}</p>
              {item.displayPrice && (
                <p className="text-sm font-semibold mt-0.5">{item.displayPrice}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {item.size && (
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-accent border border-border">
                    {item.size}
                  </span>
                )}
                {item.color && (
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-accent border border-border">
                    {item.color}
                  </span>
                )}
                <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-accent border border-border text-muted-foreground">
                  Qty: {item.quantity ?? 1}
                </span>
              </div>
              {item.affiliateUrl && (
                <a
                  href={item.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mt-2"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  View Product
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3 border-t border-border pt-6">
        {!allPrices && (
          <p className="text-xs text-muted-foreground text-center">
            Prices shown per item · Total calculated at checkout
          </p>
        )}

        <Button
          onClick={handleLoadBasket}
          disabled={loaded || data.items.length === 0}
          className="w-full text-xs tracking-widest uppercase gap-2"
        >
          {loaded ? (
            "Basket Loaded ✓"
          ) : (
            <>
              Load into My Basket
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>

        <Link
          href={`/store/${data.memberUsername}`}
          className="w-full flex items-center justify-center gap-2 py-3 border border-border text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          Visit @{data.memberUsername}'s Store
        </Link>
      </div>
    </div>
  );
}
