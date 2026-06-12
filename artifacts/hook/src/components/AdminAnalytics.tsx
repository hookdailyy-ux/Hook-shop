import { useEffect, useState } from "react";
import {
  Eye, MousePointer, ShoppingBag, Share2, Package, CheckCircle,
  TrendingUp, Globe, Users, BarChart3,
} from "lucide-react";

const BASE = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");

interface MemberStats {
  id: number;
  username: string;
  displayName: string | null;
  profileViews: number;
  collectionViews: number;
  lookViews: number;
  productClicks: number;
  basketAdds: number;
  sharedBaskets: number;
  orderSubmits: number;
  confirmedOrders: number;
}

interface AdminAnalyticsData {
  totals: {
    profileViews: number;
    productClicks: number;
    basketAdds: number;
    sharedBaskets: number;
    orderSubmits: number;
    confirmedOrders: number;
  };
  directHook: {
    profileViews: number;
    productClicks: number;
    basketAdds: number;
    sharedBaskets: number;
    orderSubmits: number;
  };
  members: MemberStats[];
}

type SortKey = keyof Pick<MemberStats,
  "profileViews" | "collectionViews" | "lookViews" | "productClicks" |
  "basketAdds" | "sharedBaskets" | "orderSubmits" | "confirmedOrders"
>;

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

const SORT_LABELS: Record<SortKey, string> = {
  profileViews: "Profile Views",
  collectionViews: "Collection Views",
  lookViews: "Look Views",
  productClicks: "Product Clicks",
  basketAdds: "Add to Basket",
  sharedBaskets: "Shared Baskets",
  orderSubmits: "Orders Placed",
  confirmedOrders: "Confirmed Orders",
};

export function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("profileViews");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${BASE}/api/admin/analytics`, { credentials: "include" });
        if (res.ok) setData((await res.json()) as AdminAnalyticsData);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
        Loading analytics…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-xs tracking-widest uppercase text-muted-foreground">
        No analytics data available.
      </div>
    );
  }

  const { totals, directHook, members } = data;

  const sorted = [...members].sort((a, b) => b[sortBy] - a[sortBy]);

  const TOTAL_CARDS = [
    { label: "Total Homepage Visits", value: totals.profileViews, icon: Eye },
    { label: "Total Product Clicks", value: totals.productClicks, icon: MousePointer },
    { label: "Total Add to Basket", value: totals.basketAdds, icon: ShoppingBag },
    { label: "Total Shared Baskets", value: totals.sharedBaskets, icon: Share2 },
    { label: "Total Orders Placed", value: totals.orderSubmits, icon: Package },
    { label: "Total Confirmed Orders", value: totals.confirmedOrders, icon: CheckCircle },
  ];

  const RANKINGS: { key: SortKey; label: string }[] = [
    { key: "profileViews", label: "Most Profile Views" },
    { key: "productClicks", label: "Most Product Clicks" },
    { key: "basketAdds", label: "Most Add to Basket" },
    { key: "sharedBaskets", label: "Most Shared Baskets" },
    { key: "orderSubmits", label: "Most Orders Placed" },
    { key: "confirmedOrders", label: "Most Confirmed Orders" },
  ];

  return (
    <div className="space-y-10">

      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-light mb-1">Analytics</h2>
        <p className="text-sm text-muted-foreground">Traffic & performance across all team members and direct HOOK traffic.</p>
      </div>

      {/* Global totals */}
      <section>
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" /> Global Totals
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TOTAL_CARDS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground leading-tight">{label}</p>
                <Icon className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 ml-1" strokeWidth={1.5} />
              </div>
              <p className="font-serif text-3xl font-light">{fmt(value)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Direct HOOK section */}
      <section>
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" /> Direct HOOK Traffic
        </p>
        <div className="border border-border">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-border">
            {[
              { label: "Homepage Visits", value: directHook.profileViews },
              { label: "Product Clicks", value: directHook.productClicks },
              { label: "Add to Basket", value: directHook.basketAdds },
              { label: "Shared Baskets", value: directHook.sharedBaskets },
              { label: "Orders Placed", value: directHook.orderSubmits },
            ].map(({ label, value }) => (
              <div key={label} className="px-5 py-4">
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2">{label}</p>
                <p className="font-serif text-2xl font-light">{fmt(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per-member table */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-2">
            <Users className="h-3.5 w-3.5" /> Team Member Analytics
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-widest uppercase text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="text-[10px] tracking-widest uppercase bg-background border border-border px-2 py-1 text-foreground cursor-pointer"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="border border-border p-10 text-center text-xs text-muted-foreground tracking-widest uppercase">
            No team members yet
          </div>
        ) : (
          <div className="border border-border overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  <th className="text-left px-4 py-3 text-[9px] tracking-widest uppercase text-muted-foreground">Member</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-widest uppercase text-muted-foreground">Profile Views</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-widest uppercase text-muted-foreground">Collection Views</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-widest uppercase text-muted-foreground">Look Views</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-widest uppercase text-muted-foreground">Product Clicks</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-widest uppercase text-muted-foreground">Add to Basket</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-widest uppercase text-muted-foreground">Shared Baskets</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-widest uppercase text-muted-foreground">Orders Placed</th>
                  <th className="text-right px-4 py-3 text-[9px] tracking-widest uppercase text-muted-foreground">Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m, i) => (
                  <tr key={m.id} className={`border-b border-border last:border-0 ${i === 0 ? "bg-accent/10" : ""}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {i === 0 && <TrendingUp className="h-3 w-3 text-amber-500 shrink-0" strokeWidth={2} />}
                        <div>
                          <p className="text-sm font-medium">{m.displayName}</p>
                          <p className="text-[9px] tracking-widest uppercase text-muted-foreground">@{m.username}</p>
                        </div>
                      </div>
                    </td>
                    <MemberCell value={m.profileViews} active={sortBy === "profileViews"} />
                    <MemberCell value={m.collectionViews} active={sortBy === "collectionViews"} />
                    <MemberCell value={m.lookViews} active={sortBy === "lookViews"} />
                    <MemberCell value={m.productClicks} active={sortBy === "productClicks"} />
                    <MemberCell value={m.basketAdds} active={sortBy === "basketAdds"} />
                    <MemberCell value={m.sharedBaskets} active={sortBy === "sharedBaskets"} />
                    <MemberCell value={m.orderSubmits} active={sortBy === "orderSubmits"} />
                    <MemberCell value={m.confirmedOrders} active={sortBy === "confirmedOrders"} last />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Rankings */}
      <section>
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4">
          Top Performers — Rankings
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RANKINGS.map(({ key, label }) => {
            const top = [...members].sort((a, b) => b[key] - a[key]).slice(0, 3);
            return (
              <div key={key} className="border border-border">
                <div className="px-4 py-3 border-b border-border bg-accent/10">
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{label}</p>
                </div>
                <div className="divide-y divide-border">
                  {top.length === 0 ? (
                    <p className="px-4 py-4 text-[10px] text-muted-foreground">No data</p>
                  ) : (
                    top.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[10px] font-bold w-4 ${idx === 0 ? "text-amber-500" : "text-muted-foreground/40"}`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-medium">{m.displayName}</p>
                            <p className="text-[9px] text-muted-foreground">@{m.username}</p>
                          </div>
                        </div>
                        <span className="font-serif text-lg font-light">{fmt(m[key])}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MemberCell({ value, active, last }: { value: number; active?: boolean; last?: boolean }) {
  return (
    <td className={`${last ? "px-4" : "px-3"} py-4 text-right`}>
      <span className={`font-serif text-base font-light ${active ? "text-foreground" : "text-muted-foreground"}`}>
        {fmt(value)}
      </span>
    </td>
  );
}
