import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Trophy, Eye, Package, TrendingUp, Medal, Star, Heart } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface RankedMember {
  id: number;
  fullName: string;
  displayName: string | null;
  username: string;
  profilePhotoUrl: string | null;
  monthlyOrders: number;
  allTimeOrders: number;
  monthlyViews: number;
  badges: string[];
  rank: number;
}

interface RankingsData {
  monthly: RankedMember[];
  allTime: RankedMember[];
  period: { start: string; end: string };
}

const BADGE_INFO: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  top_seller: { label: "Top Seller", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Trophy },
  most_viewed: { label: "Most Viewed", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Eye },
  most_followed: { label: "Most Followed", color: "text-rose-600 bg-rose-50 border-rose-200", icon: Heart },
  trending: { label: "Trending", color: "text-purple-600 bg-purple-50 border-purple-200", icon: TrendingUp },
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function RankingsPage() {
  const [data, setData] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"monthly" | "alltime">("monthly");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${BASE}/api/rankings`);
        if (res.ok) setData((await res.json()) as RankingsData);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const members = tab === "monthly" ? data?.monthly : data?.allTime;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Hero */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-amber-600" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-light mb-3">Leaderboard</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            HOOK's top performing sellers, ranked by orders, views, and conversion.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border border-border p-1 w-fit">
          {(["monthly", "alltime"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 text-[10px] tracking-widest uppercase transition-colors ${tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "monthly" ? "Monthly" : "All Time"}
            </button>
          ))}
        </div>

        {tab === "monthly" && data?.period && (
          <p className="text-xs text-muted-foreground mb-6">
            Period: {new Date(data.period.start).toLocaleDateString()} → {new Date(data.period.end).toLocaleDateString()}
          </p>
        )}

        {loading ? (
          <div className="py-20 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading leaderboard…</div>
        ) : !members || members.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border">
            <Medal className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" strokeWidth={1} />
            <p className="text-xs text-muted-foreground">No rankings yet. Be the first to make a sale!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const displayName = member.displayName ?? member.fullName;
              const medal = RANK_MEDALS[member.rank - 1];
              return (
                <div key={member.id} className={`border border-border p-4 sm:p-5 flex items-center gap-4 ${member.rank <= 3 ? "bg-gradient-to-r from-amber-50/50 to-transparent" : ""}`}>
                  {/* Rank */}
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center font-serif text-xl">
                    {medal ?? <span className="text-sm font-medium text-muted-foreground">#{member.rank}</span>}
                  </div>

                  {/* Photo */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full overflow-hidden bg-stone-100 border-2 border-white shadow-sm">
                    {member.profilePhotoUrl
                      ? <img src={member.profilePhotoUrl} alt={displayName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center font-serif text-lg font-light text-muted-foreground/40">
                          {displayName[0]?.toUpperCase()}
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/store/${member.username}`}>
                        <span className="font-medium hover:underline cursor-pointer">{displayName}</span>
                      </Link>
                      {member.badges.map((badge) => {
                        const info = BADGE_INFO[badge];
                        if (!info) return null;
                        const Icon = info.icon;
                        return (
                          <span key={badge} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded-full ${info.color}`}>
                            <Icon className="h-2.5 w-2.5" />
                            {info.label}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">@{member.username}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <p className="font-serif text-xl font-light">{tab === "monthly" ? member.monthlyOrders : member.allTimeOrders}</p>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground">Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="font-serif text-xl font-light">{member.monthlyViews >= 1000 ? `${(member.monthlyViews / 1000).toFixed(1)}k` : member.monthlyViews}</p>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground">Views</p>
                    </div>
                  </div>

                  {/* Mobile stats */}
                  <div className="sm:hidden text-right shrink-0">
                    <p className="font-serif text-lg">{tab === "monthly" ? member.monthlyOrders : member.allTimeOrders}</p>
                    <p className="text-[9px] uppercase text-muted-foreground">orders</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link href="/" className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
            ← Browse HOOK
          </Link>
        </div>
      </div>
    </div>
  );
}
