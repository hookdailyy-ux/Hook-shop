import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Package, Clock, Check, X, Upload, DollarSign, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface OrderItem { id: number; productTitle: string; displayPrice: string | null; quantity: number; brand: string | null; }
interface OrderProof { id: number; imageUrl: string; proofType: string; adminReviewed: boolean; adminNote: string | null; createdAt: string; }
interface AdminOrder {
  id: number; orderRef: string; teamMemberId: number; memberName: string; memberUsername: string;
  customerName: string; customerPhone: string; customerEmail: string | null;
  shippingAddress: string | null; notes: string | null;
  status: string; createdAt: string; updatedAt: string;
  items: OrderItem[]; proofs: OrderProof[];
}

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
  pending_review: { label: "Pending Review", color: "text-blue-700 bg-blue-50 border-blue-200" },
  approved: { label: "Approved", color: "text-green-700 bg-green-50 border-green-200" },
  rejected: { label: "Rejected", color: "text-red-700 bg-red-50 border-red-200" },
  paid: { label: "Paid", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};

export function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMember, setFilterMember] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/admin/orders`, { credentials: "include" });
      if (res.ok) setOrders((await res.json()) as AdminOrder[]);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`${BASE}/api/admin/orders/${orderId}/status`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
        toast({ title: "Status updated" });
      }
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const reviewProof = async (orderId: number, proofId: number) => {
    try {
      await fetch(`${BASE}/api/admin/orders/${orderId}/proof/${proofId}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReviewed: true }),
      });
      setOrders((prev) => prev.map((o) => o.id === orderId
        ? { ...o, proofs: o.proofs.map((p) => p.id === proofId ? { ...p, adminReviewed: true } : p) }
        : o));
      toast({ title: "Proof marked as reviewed" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const members = [...new Set(orders.map((o) => o.memberUsername))];
  const filtered = orders.filter((o) =>
    (filterStatus === "all" || o.status === filterStatus) &&
    (filterMember === "all" || o.memberUsername === filterMember)
  );

  if (loading) return <div className="py-16 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading…</div>;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "pending_review", "approved", "rejected", "paid"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${filterStatus === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
              {s}
            </button>
          ))}
        </div>
        {members.length > 1 && (
          <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}
            className="border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-foreground transition-colors">
            <option value="all">All Members</option>
            {members.map((m) => <option key={m} value={m}>@{m}</option>)}
          </select>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} orders</span>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border py-16 text-center">
          <Package className="h-7 w-7 mx-auto mb-2 text-muted-foreground/20" strokeWidth={1} />
          <p className="text-xs text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const statusInfo = STATUS_INFO[order.status] ?? STATUS_INFO.pending!;
            const isExpanded = expandedId === order.id;
            const pendingProofs = order.proofs.filter((p) => !p.adminReviewed).length;

            return (
              <div key={order.id} className="border border-border">
                <button className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-accent/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm">{order.orderRef}</span>
                      <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                      {pendingProofs > 0 && <span className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full">{pendingProofs} proof{pendingProofs > 1 ? "s" : ""} to review</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground">@{order.memberUsername}</span> · {order.customerName} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-5 pt-4 space-y-5 bg-accent/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Customer</p>
                        <p>{order.customerName}</p>
                        <p className="text-muted-foreground text-xs">{order.customerPhone}</p>
                        {order.customerEmail && <p className="text-muted-foreground text-xs">{order.customerEmail}</p>}
                      </div>
                      {order.shippingAddress && (
                        <div>
                          <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Address</p>
                          <p className="text-xs">{order.shippingAddress}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2">Items ({order.items.length})</p>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{item.quantity}× {item.productTitle}</span>
                            <span>{item.displayPrice ?? "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(STATUS_INFO).map(([key, info]) => (
                          <button key={key} onClick={() => void updateStatus(order.id, key)}
                            disabled={order.status === key}
                            className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors disabled:opacity-40 ${order.status === key ? `${info.color} border-current` : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                            {info.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {order.proofs.length > 0 && (
                      <div>
                        <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-3">Proofs ({order.proofs.length})</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {order.proofs.map((proof) => (
                            <div key={proof.id}>
                              <div className="aspect-square overflow-hidden rounded-lg border border-border bg-stone-100 relative">
                                <img src={proof.imageUrl} alt="Proof" className="w-full h-full object-cover" />
                                {proof.adminReviewed && (
                                  <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-1 capitalize">{proof.proofType}</p>
                              {!proof.adminReviewed && (
                                <button onClick={() => void reviewProof(order.id, proof.id)}
                                  className="text-[9px] tracking-widest uppercase text-blue-600 hover:underline mt-0.5">
                                  Mark Reviewed
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
