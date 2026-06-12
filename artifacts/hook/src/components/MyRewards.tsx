import { useEffect, useState } from "react";
import { Gift, Clock, CheckCircle, DollarSign } from "lucide-react";
import { API_BASE } from "@/lib/apiBase";

const BASE = API_BASE;

interface Reward {
  id: number;
  title: string;
  description: string | null;
  amount: string | null;
  rewardType: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "text-blue-700 bg-blue-50 border-blue-200", icon: CheckCircle },
  paid: { label: "Paid", color: "text-green-700 bg-green-50 border-green-200", icon: DollarSign },
};

const TYPE_LABELS: Record<string, string> = {
  bonus: "Bonus",
  commission: "Commission",
  voucher: "Voucher",
  achievement: "Achievement",
};

export function MyRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${BASE}/api/team/rewards`, { credentials: "include" });
        if (res.ok) setRewards((await res.json()) as Reward[]);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const total = { paid: 0, pending: 0, approved: 0 };
  for (const r of rewards) {
    if (r.status === "paid") total.paid++;
    else if (r.status === "approved") total.approved++;
    else total.pending++;
  }

  if (loading) {
    return <div className="py-16 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading rewards…</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-light mb-1">My Rewards</h2>
        <p className="text-sm text-muted-foreground">Rewards and bonuses assigned by admin.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Pending", value: total.pending, color: "text-amber-600" },
          { label: "Approved", value: total.approved, color: "text-blue-600" },
          { label: "Paid", value: total.paid, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-border p-4 text-center">
            <p className={`font-serif text-3xl font-light ${color}`}>{value}</p>
            <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {rewards.length === 0 ? (
        <div className="border border-dashed border-border py-20 flex flex-col items-center justify-center text-center">
          <Gift className="h-8 w-8 text-muted-foreground/20 mb-3" strokeWidth={1} />
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">No Rewards Yet</p>
          <p className="text-xs text-muted-foreground/60 max-w-xs leading-relaxed">
            Rewards assigned by your admin will appear here. Keep up the great work!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward) => {
            const statusInfo = STATUS_BADGE[reward.status] ?? STATUS_BADGE.pending!;
            const StatusIcon = statusInfo.icon;
            return (
              <div key={reward.id} className="border border-border p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-widest uppercase border rounded-full ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                      <span className="text-[10px] tracking-widest uppercase text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[reward.rewardType] ?? reward.rewardType}
                      </span>
                    </div>
                    <h3 className="font-medium">{reward.title}</h3>
                    {reward.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{reward.description}</p>}
                    {reward.adminNote && (
                      <p className="text-xs text-muted-foreground/70 mt-2 italic">Admin note: {reward.adminNote}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {reward.amount && (
                      <p className="font-serif text-xl font-light">{reward.amount}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(reward.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
