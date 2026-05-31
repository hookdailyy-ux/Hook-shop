import { useState } from "react";
import { ShoppingBag, Package, ChevronDown, ChevronUp, ExternalLink, Clock } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface BasketItem {
  key?: string;
  productId: number;
  productTitle: string;
  productImageUrl: string | null;
  displayPrice: string | null;
  numericPrice?: number | null;
  affiliateUrl?: string;
  brand: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  sourceMemberUsername?: string;
}

interface SharedBasket {
  id: number;
  token: string;
  memberUsername: string;
  memberName: string;
  items: BasketItem[];
  createdAt: string;
}

interface ProductSummaryItem {
  productId: number;
  productTitle: string;
  productImageUrl: string | null;
  brand: string | null;
  totalQuantity: number;
  variants: { size: string | null; color: string | null; quantity: number }[];
}

function buildProductSummary(baskets: SharedBasket[]): ProductSummaryItem[] {
  const map = new Map<number, ProductSummaryItem>();
  for (const basket of baskets) {
    for (const item of basket.items) {
      const existing = map.get(item.productId);
      if (existing) {
        existing.totalQuantity += item.quantity;
        const variant = existing.variants.find(
          (v) => v.size === item.size && v.color === item.color
        );
        if (variant) {
          variant.quantity += item.quantity;
        } else {
          existing.variants.push({ size: item.size, color: item.color, quantity: item.quantity });
        }
      } else {
        map.set(item.productId, {
          productId: item.productId,
          productTitle: item.productTitle,
          productImageUrl: item.productImageUrl,
          brand: item.brand,
          totalQuantity: item.quantity,
          variants: [{ size: item.size, color: item.color, quantity: item.quantity }],
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ProductSummaryCard({ item }: { item: ProductSummaryItem }) {
  return (
    <div className="flex gap-3 p-4 border border-border bg-background">
      <div className="w-14 h-18 shrink-0 overflow-hidden bg-stone-100">
        {item.productImageUrl ? (
          <img
            src={item.productImageUrl}
            alt={item.productTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground/20" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {item.brand && (
          <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{item.brand}</p>
        )}
        <p className="text-sm leading-snug line-clamp-2 mt-0.5 font-medium">{item.productTitle}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-foreground">
            Total: {item.totalQuantity}
          </span>
        </div>
        {item.variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.variants.map((v, i) => (
              <span
                key={i}
                className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-accent border border-border"
              >
                {[v.size, v.color].filter(Boolean).join(" / ") || "One size"} × {v.quantity}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BasketCard({ basket }: { basket: SharedBasket }) {
  const [expanded, setExpanded] = useState(false);
  const shareUrl = `${window.location.origin}${BASE}/basket/${basket.token}`;

  return (
    <div className="border border-border bg-background">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {basket.items.length} item{basket.items.length !== 1 ? "s" : ""}
              {" "}·{" "}
              {basket.items.reduce((s, i) => s + i.quantity, 0)} qty
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">{timeAgo(basket.createdAt)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Open basket link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border/50">
          {basket.items.map((item, i) => (
            <div key={i} className="flex gap-3 px-4 py-3">
              <div className="w-12 h-14 shrink-0 overflow-hidden bg-stone-100">
                {item.productImageUrl ? (
                  <img
                    src={item.productImageUrl}
                    alt={item.productTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground/20" strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {item.brand && (
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{item.brand}</p>
                )}
                <p className="text-xs leading-snug line-clamp-2">{item.productTitle}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {item.displayPrice && (
                    <span className="text-xs font-semibold">{item.displayPrice}</span>
                  )}
                  {item.size && (
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-accent border border-border">
                      {item.size}
                    </span>
                  )}
                  {item.color && (
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-accent border border-border">
                      {item.color}
                    </span>
                  )}
                  <span className="text-[9px] tracking-widest uppercase text-muted-foreground">
                    Qty: {item.quantity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SharedBaskets() {
  const [baskets, setBaskets] = useState<SharedBasket[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const load = async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/team/basket-shares`, { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as SharedBasket[];
        setBaskets(data);
      }
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  if (!fetched && !loading) {
    void load();
  }

  const summary = baskets ? buildProductSummary(baskets) : [];

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* Product Summary */}
      {summary.length > 0 && (
        <section>
          <div className="mb-5">
            <h2 className="font-serif text-2xl font-light">Product Demand Summary</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Aggregated across all shared baskets — see what customers want most.
            </p>
          </div>
          <div className="space-y-3">
            {summary.map((item) => (
              <ProductSummaryCard key={item.productId} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Shared Baskets List */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-light">Shared Baskets</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Baskets customers have shared with you via WhatsApp.
            </p>
          </div>
          <button
            onClick={() => { setFetched(false); setBaskets(null); void load(); }}
            className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors px-3 py-2 border border-border"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
              Loading baskets…
            </span>
          </div>
        )}

        {!loading && baskets && baskets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/10 mb-4" strokeWidth={1} />
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              No shared baskets yet
            </p>
            <p className="text-xs text-muted-foreground/50 leading-relaxed max-w-xs">
              When customers share their basket with you via WhatsApp, it will appear here.
            </p>
          </div>
        )}

        {!loading && baskets && baskets.length > 0 && (
          <div className="space-y-2">
            {baskets.map((basket) => (
              <BasketCard key={basket.id} basket={basket} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
