import { useEffect, useState } from "react";
import { Eye, ShoppingBag, MousePointer, Package, TrendingUp, FolderOpen, Layers, BarChart3, Share2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AnalyticsData {
  cycle: { start: string; end: string };
  metrics: {
    profileViews: number;
    productClicks: number;
    basketAdds: number;
    orderSubmits: number;
    confirmedOrders: number;
    conversionRate: number;
    allTimeOrders: number;
    collectionViews: number;
    lookViews: number;
    sharedBaskets: number;
  };
  bestPerformers: {
    collection: { id: number; title: string; views: number } | null;
    look: { id: number; title: string; views: number } | null;
    topProductId: number | null;
  };
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function MyAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${BASE}/api/team/analytics`, { credentials: "include" });
        if (res.ok) setData((await res.json()) as AnalyticsData);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading analytics…</div>;
  }

  if (!data) {
    return <div className="py-16 text-center text-xs tracking-widest uppercase text-muted-foreground">No analytics data available.</div>;
  }

  const { cycle, metrics, bestPerformers } = data;

  const convDisplay = metrics.profileViews === 0 ? "0%" : `${metrics.conversionRate.toFixed(1)}%`;

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-light mb-1">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Performance for your current cycle.
        </p>
      </div>

      {/* Cycle badge */}
      <div className="inline-flex items-center gap-2 border border-border px-4 py-2 mb-8 bg-accent/20">
        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-xs text-muted-foreground">
          Current Cycle: <span className="text-foreground font-medium">{formatDate(cycle.start)}</span>
          <span className="mx-2 text-muted-foreground/40">→</span>
          <span className="text-foreground font-medium">{formatDate(cycle.end)}</span>
        </span>
      </div>

      {/* Conversion rate hero */}
      <div className="border border-border bg-accent/10 p-6 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Conversion Rate</p>
          <p className="font-serif text-5xl font-light">{convDisplay}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.orderSubmits} orders from {metrics.profileViews} store visits
          </p>
        </div>
        <TrendingUp className="h-12 w-12 text-muted-foreground/10" strokeWidth={1} />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Profile Views", value: fmt(metrics.profileViews), icon: Eye, sub: "This cycle" },
          { label: "Collection Views", value: fmt(metrics.collectionViews), icon: FolderOpen, sub: "All time" },
          { label: "Look Views", value: fmt(metrics.lookViews), icon: Layers, sub: "All time" },
          { label: "Product Clicks", value: fmt(metrics.productClicks), icon: MousePointer, sub: "This cycle" },
          { label: "Basket Adds", value: fmt(metrics.basketAdds), icon: ShoppingBag, sub: "This cycle" },
          { label: "Shared Baskets", value: fmt(metrics.sharedBaskets), icon: Share2, sub: "All time" },
          { label: "Orders", value: fmt(metrics.confirmedOrders), icon: Package, sub: "This cycle" },
        ].map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{label}</p>
              <Icon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
            </div>
            <p className="font-serif text-3xl font-light">{value}</p>
            <p className="text-[9px] text-muted-foreground/60 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* All-time orders */}
      <div className="border border-border bg-accent/5 p-5 mb-8 flex items-center gap-4">
        <Package className="h-5 w-5 text-muted-foreground/40 shrink-0" strokeWidth={1} />
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-0.5">All-Time Orders</p>
          <p className="font-serif text-2xl font-light">{metrics.allTimeOrders}</p>
        </div>
      </div>

      {/* Best performers */}
      {(bestPerformers.collection || bestPerformers.look) && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4">Best Performers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bestPerformers.collection && (
              <div className="border border-border p-4">
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FolderOpen className="h-3 w-3" /> Top Collection
                </p>
                <p className="font-medium">{bestPerformers.collection.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{bestPerformers.collection.views.toLocaleString()} views</p>
              </div>
            )}
            {bestPerformers.look && (
              <div className="border border-border p-4">
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Layers className="h-3 w-3" /> Top Look
                </p>
                <p className="font-medium">{bestPerformers.look.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{bestPerformers.look.views.toLocaleString()} views</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
