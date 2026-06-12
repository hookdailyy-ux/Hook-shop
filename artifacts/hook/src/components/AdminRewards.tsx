import { useState, useEffect, useCallback } from "react";
import { Plus, ChevronDown, ChevronUp, Gift, Trash2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE } from "@/lib/apiBase";

const BASE = API_BASE;

interface AdminReward {
  id: number; teamMemberId: number; memberName: string; memberUsername: string;
  title: string; description: string | null; amount: string | null;
  rewardType: string; status: string; adminNote: string | null;
  createdAt: string; updatedAt: string;
}

interface TeamMember { id: number; fullName: string; username: string; }

const STATUS_BADGE: Record<string, string> = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  approved: "text-blue-700 bg-blue-50 border-blue-200",
  paid: "text-green-700 bg-green-50 border-green-200",
};

export function AdminRewards() {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<AdminReward[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ teamMemberId: "", title: "", description: "", amount: "", rewardType: "bonus", adminNote: "" });

  const load = useCallback(async () => {
    try {
      const [rRes, mRes] = await Promise.all([
        fetch(`${BASE}/api/admin/rewards`, { credentials: "include" }),
        fetch(`${BASE}/api/team`, { credentials: "include" }),
      ]);
      if (rRes.ok) setRewards((await rRes.json()) as AdminReward[]);
      if (mRes.ok) {
        const data = (await mRes.json()) as { members?: TeamMember[] } | TeamMember[];
        setMembers(Array.isArray(data) ? data : (data.members ?? []));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async () => {
    if (!form.teamMemberId || !form.title) { toast({ title: "Member and title are required", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/admin/rewards`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamMemberId: parseInt(form.teamMemberId),
          title: form.title,
          description: form.description || null,
          amount: form.amount || null,
          rewardType: form.rewardType,
          adminNote: form.adminNote || null,
        }),
      });
      if (res.ok) {
        toast({ title: "Reward created" });
        setForm({ teamMemberId: "", title: "", description: "", amount: "", rewardType: "bonus", adminNote: "" });
        setShowCreate(false);
        await load();
      }
    } catch { toast({ title: "Failed to create reward", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const updateStatus = async (rewardId: number, status: string) => {
    try {
      await fetch(`${BASE}/api/admin/rewards/${rewardId}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRewards((prev) => prev.map((r) => r.id === rewardId ? { ...r, status } : r));
      toast({ title: "Status updated" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const deleteReward = async (rewardId: number) => {
    if (!confirm("Delete this reward?")) return;
    try {
      await fetch(`${BASE}/api/admin/rewards/${rewardId}`, { method: "DELETE", credentials: "include" });
      setRewards((prev) => prev.filter((r) => r.id !== rewardId));
      toast({ title: "Reward deleted" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  if (loading) return <div className="py-16 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading…</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{rewards.length} total rewards</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="text-[10px] tracking-widest uppercase gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Create Reward
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="border border-border p-5 mb-6 bg-accent/5 space-y-4">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">New Reward</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest uppercase text-muted-foreground">Team Member *</label>
              <select value={form.teamMemberId} onChange={(e) => setForm((f) => ({ ...f, teamMemberId: e.target.value }))}
                className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground transition-colors">
                <option value="">Select member…</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.fullName} (@{m.username})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest uppercase text-muted-foreground">Type</label>
              <select value={form.rewardType} onChange={(e) => setForm((f) => ({ ...f, rewardType: e.target.value }))}
                className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground transition-colors">
                {["bonus", "commission", "voucher", "achievement"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] tracking-widest uppercase text-muted-foreground">Title *</label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Monthly Top Seller Bonus" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest uppercase text-muted-foreground">Amount</label>
              <Input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. RM 200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest uppercase text-muted-foreground">Admin Note</label>
              <Input value={form.adminNote} onChange={(e) => setForm((f) => ({ ...f, adminNote: e.target.value }))} placeholder="Internal note" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] tracking-widest uppercase text-muted-foreground">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Details about this reward…" rows={2} className="resize-none" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void handleCreate()} disabled={creating} size="sm" className="text-[10px] tracking-widest uppercase">
              {creating ? "Creating…" : "Create"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)} className="text-[10px] tracking-widest uppercase">Cancel</Button>
          </div>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="border border-dashed border-border py-16 text-center">
          <Gift className="h-7 w-7 mx-auto mb-2 text-muted-foreground/20" strokeWidth={1} />
          <p className="text-xs text-muted-foreground">No rewards yet. Create the first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rewards.map((reward) => {
            const isExpanded = expandedId === reward.id;
            const badgeColor = STATUS_BADGE[reward.status] ?? "";
            return (
              <div key={reward.id} className="border border-border">
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <button className="flex-1 text-left" onClick={() => setExpandedId(isExpanded ? null : reward.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border rounded-full ${badgeColor}`}>{reward.status}</span>
                      <span className="text-sm font-medium">{reward.title}</span>
                      {reward.amount && <span className="text-sm font-serif">{reward.amount}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">@{reward.memberUsername} · {reward.rewardType} · {new Date(reward.createdAt).toLocaleDateString()}</p>
                  </button>
                  <button onClick={() => void deleteReward(reward.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setExpandedId(isExpanded ? null : reward.id)} className="text-muted-foreground p-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 bg-accent/5 space-y-4">
                    {reward.description && <p className="text-sm text-muted-foreground">{reward.description}</p>}
                    {reward.adminNote && <p className="text-xs italic text-muted-foreground/70">Note: {reward.adminNote}</p>}
                    <div>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2">Update Status</p>
                      <div className="flex gap-2 flex-wrap">
                        {["pending", "approved", "paid"].map((s) => (
                          <button key={s} onClick={() => void updateStatus(reward.id, s)}
                            disabled={reward.status === s}
                            className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors disabled:opacity-40 ${reward.status === s ? `${STATUS_BADGE[s]} border-current` : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
