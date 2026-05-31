import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Package, Clock, Check, Truck, X, RefreshCw, Upload, Trash2 } from "lucide-react";
import { SingleImageUpload } from "@/components/ImageUploadField";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface OrderItem { id: number; productTitle: string; productImageUrl: string | null; displayPrice: string | null; quantity: number; brand: string | null; }
interface OrderProof { id: number; imageUrl: string; proofType: string; adminReviewed: boolean; adminNote: string | null; createdAt: string; }
interface Order {
  id: number; orderRef: string; customerName: string; customerPhone: string;
  customerEmail: string | null; shippingAddress: string | null; notes: string | null;
  status: string; createdAt: string; updatedAt: string;
  items: OrderItem[]; proofs: OrderProof[];
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Check },
  processing: { label: "Processing", color: "text-violet-700 bg-violet-50 border-violet-200", icon: RefreshCw },
  shipped: { label: "Shipped", color: "text-orange-700 bg-orange-50 border-orange-200", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-700 bg-green-50 border-green-200", icon: Package },
  cancelled: { label: "Cancelled", color: "text-red-700 bg-red-50 border-red-200", icon: X },
};

const PROOF_LABELS: Record<string, string> = {
  confirmation: "Order Confirmation",
  payment: "Payment Receipt",
  delivery: "Delivery Confirmation",
  customer: "Customer Proof",
};

export function MyOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofType, setProofType] = useState("confirmation");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/team/orders`, { credentials: "include" });
      if (res.ok) setOrders((await res.json()) as Order[]);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (orderId: number, status: string) => {
    setStatusLoading(orderId);
    try {
      const res = await fetch(`${BASE}/api/team/orders/${orderId}/status`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
        toast({ title: "Status updated" });
      }
    } catch { toast({ title: "Failed to update status", variant: "destructive" }); }
    finally { setStatusLoading(null); }
  };

  const addProof = async (orderId: number) => {
    if (!proofUrl) return;
    setProofLoading(true);
    try {
      const res = await fetch(`${BASE}/api/team/orders/${orderId}/proof`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: proofUrl, proofType }),
      });
      if (res.ok) {
        const newProof = (await res.json()) as OrderProof;
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, proofs: [...o.proofs, newProof] } : o));
        setProofUrl(""); setProofType("confirmation");
        toast({ title: "Proof uploaded" });
      }
    } catch { toast({ title: "Failed to upload proof", variant: "destructive" }); }
    finally { setProofLoading(false); }
  };

  const removeProof = async (orderId: number, proofId: number) => {
    try {
      await fetch(`${BASE}/api/team/orders/${orderId}/proof/${proofId}`, {
        method: "DELETE", credentials: "include",
      });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, proofs: o.proofs.filter((p) => p.id !== proofId) } : o));
    } catch { toast({ title: "Failed to remove proof", variant: "destructive" }); }
  };

  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  if (loading) {
    return <div className="py-16 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading orders…</div>;
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light mb-1">My Orders</h2>
          <p className="text-sm text-muted-foreground">Customer orders placed through your store.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${filterStatus === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border py-20 flex flex-col items-center justify-center text-center">
          <Package className="h-8 w-8 text-muted-foreground/20 mb-3" strokeWidth={1} />
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">No Orders Yet</p>
          <p className="text-xs text-muted-foreground/60 max-w-xs">Orders placed through your store will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const statusInfo = STATUS_INFO[order.status] ?? STATUS_INFO.pending!;
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className="border border-border">
                {/* Row header */}
                <button className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-accent/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm font-medium">{order.orderRef}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-widest uppercase border rounded-full ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.customerName} · {order.customerPhone} · {order.items.length} {order.items.length === 1 ? "item" : "items"} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-6 pt-5 space-y-6 bg-accent/5">

                    {/* Customer info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Customer</p>
                        <p className="text-sm">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        {order.customerEmail && <p className="text-xs text-muted-foreground">{order.customerEmail}</p>}
                      </div>
                      {order.shippingAddress && (
                        <div>
                          <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Shipping Address</p>
                          <p className="text-sm">{order.shippingAddress}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div className="sm:col-span-2">
                          <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm text-muted-foreground">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-3">Items Ordered</p>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                              {item.productImageUrl ? <img src={item.productImageUrl} alt={item.productTitle} className="w-full h-full object-cover" /> : <Package className="h-4 w-4 m-3 text-muted-foreground/30" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              {item.brand && <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{item.brand}</p>}
                              <p className="text-sm line-clamp-1">{item.productTitle}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                              {item.displayPrice && <p className="text-xs font-medium">{item.displayPrice}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status update */}
                    <div>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-3">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(STATUS_INFO).map(([key, info]) => {
                          const Icon = info.icon;
                          return (
                            <button key={key}
                              disabled={order.status === key || statusLoading === order.id}
                              onClick={() => void updateStatus(order.id, key)}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-widest uppercase border transition-colors disabled:opacity-40 ${order.status === key ? `${info.color} border-current` : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                              <Icon className="h-3 w-3" />
                              {info.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Proofs */}
                    <div>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-3">Order Proofs</p>
                      {order.proofs.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          {order.proofs.map((proof) => (
                            <div key={proof.id} className="relative group">
                              <div className="aspect-square overflow-hidden rounded-lg border border-border bg-stone-100">
                                <img src={proof.imageUrl} alt={PROOF_LABELS[proof.proofType] ?? proof.proofType} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-[9px] text-muted-foreground">{PROOF_LABELS[proof.proofType] ?? proof.proofType}</p>
                                {proof.adminReviewed && <span className="text-[9px] text-green-600">✓ Reviewed</span>}
                              </div>
                              <button onClick={() => void removeProof(order.id, proof.id)}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white hover:border-destructive">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload proof */}
                      <div className="border border-dashed border-border p-4 space-y-3">
                        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Upload Proof</p>
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(PROOF_LABELS).map(([key, label]) => (
                            <button key={key} onClick={() => setProofType(key)}
                              className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${proofType === key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                        <SingleImageUpload value={proofUrl} onChange={(url) => setProofUrl(url ?? "")} />
                        {proofUrl && (
                          <Button size="sm" onClick={() => void addProof(order.id)} disabled={proofLoading} className="text-[10px] tracking-widest uppercase gap-1.5">
                            <Upload className="h-3 w-3" />
                            {proofLoading ? "Uploading…" : "Add Proof"}
                          </Button>
                        )}
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
