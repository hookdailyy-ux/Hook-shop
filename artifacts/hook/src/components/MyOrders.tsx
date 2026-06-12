import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown, ChevronUp, Package, Clock, Check, X,
  Upload, Trash2, DollarSign,
} from "lucide-react";
import { SingleImageUpload } from "@/components/ImageUploadField";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const BASE = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");

interface OrderItem {
  id: number; productTitle: string; productImageUrl: string | null;
  displayPrice: string | null; quantity: number; brand: string | null;
}
interface OrderProof {
  id: number; imageUrl: string; proofType: string;
  adminReviewed: boolean; adminNote: string | null; createdAt: string;
}
interface Order {
  id: number; orderRef: string; customerName: string; customerPhone: string;
  customerEmail: string | null; shippingAddress: string | null; notes: string | null;
  status: string; createdAt: string; updatedAt: string;
  items: OrderItem[]; proofs: OrderProof[];
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock },
  pending_review: { label: "Pending Review", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Upload },
  approved: { label: "Approved", color: "text-green-700 bg-green-50 border-green-200", icon: Check },
  rejected: { label: "Rejected", color: "text-red-700 bg-red-50 border-red-200", icon: X },
  paid: { label: "Paid", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: DollarSign },
};

interface ProofForm {
  imageUrl: string;
  platformRef: string;
  orderValue: string;
  notes: string;
}

const EMPTY_PROOF_FORM: ProofForm = { imageUrl: "", platformRef: "", orderValue: "", notes: "" };

export function MyOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [proofLoading, setProofLoading] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [proofForms, setProofForms] = useState<Record<number, ProofForm>>({});

  const getForm = (id: number): ProofForm => proofForms[id] ?? EMPTY_PROOF_FORM;
  const setFormField = (id: number, field: keyof ProofForm, value: string) => {
    setProofForms((prev) => ({ ...prev, [id]: { ...getForm(id), [field]: value } }));
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/team/orders`, { credentials: "include" });
      if (res.ok) setOrders((await res.json()) as Order[]);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submitProof = async (orderId: number) => {
    const form = getForm(orderId);
    if (!form.imageUrl) {
      toast({ title: "Please upload a screenshot first", variant: "destructive" });
      return;
    }
    setProofLoading(orderId);
    try {
      const proofRes = await fetch(`${BASE}/api/team/orders/${orderId}/proof`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: form.imageUrl,
          proofType: "confirmation",
          platformOrderRef: form.platformRef || null,
          orderValue: form.orderValue || null,
          memberNotes: form.notes || null,
        }),
      });
      if (!proofRes.ok) throw new Error("Upload failed");
      const newProof = (await proofRes.json()) as OrderProof;

      const statusRes = await fetch(`${BASE}/api/team/orders/${orderId}/status`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_review" }),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, proofs: [...o.proofs, newProof], status: statusRes.ok ? "pending_review" : o.status }
            : o
        )
      );
      setProofForms((prev) => ({ ...prev, [orderId]: EMPTY_PROOF_FORM }));
      toast({ title: "Proof submitted for review!" });
    } catch {
      toast({ title: "Failed to submit proof", variant: "destructive" });
    } finally {
      setProofLoading(null);
    }
  };

  const removeProof = async (orderId: number, proofId: number) => {
    try {
      await fetch(`${BASE}/api/team/orders/${orderId}/proof/${proofId}`, {
        method: "DELETE", credentials: "include",
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, proofs: o.proofs.filter((p) => p.id !== proofId) } : o
        )
      );
    } catch {
      toast({ title: "Failed to remove proof", variant: "destructive" });
    }
  };

  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
        Loading orders…
      </div>
    );
  }

  return (
    <div>
      {/* Header + filter */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light mb-1">My Orders</h2>
          <p className="text-sm text-muted-foreground">Orders placed through your store.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", ...Object.keys(STATUS_INFO)] as string[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${
                filterStatus === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {s === "all" ? "All" : (STATUS_INFO[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border py-20 flex flex-col items-center justify-center text-center">
          <Package className="h-8 w-8 text-muted-foreground/20 mb-3" strokeWidth={1} />
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">No Orders</p>
          <p className="text-xs text-muted-foreground/60 max-w-xs">
            Orders placed through your store will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const statusInfo = STATUS_INFO[order.status] ?? STATUS_INFO.pending!;
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === order.id;
            const proofForm = getForm(order.id);
            const canSubmitProof = ["pending", "pending_review", "rejected"].includes(order.status);

            return (
              <div key={order.id} className="border border-border">
                {/* Row header */}
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-accent/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm font-medium">{order.orderRef}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-widest uppercase border rounded-full ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                      {order.proofs.length > 0 && (
                        <span className="text-[9px] text-muted-foreground">
                          {order.proofs.length} proof{order.proofs.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.customerName} · {order.customerPhone} · {order.items.length}{" "}
                      item{order.items.length > 1 ? "s" : ""} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
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
                        {order.customerEmail && (
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        )}
                      </div>
                      {order.shippingAddress && (
                        <div>
                          <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">
                            Shipping Address
                          </p>
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
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-3">
                        Items Ordered
                      </p>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0 overflow-hidden bg-stone-100">
                              {item.productImageUrl ? (
                                <img
                                  src={item.productImageUrl}
                                  alt={item.productTitle}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 m-3 text-muted-foreground/30" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              {item.brand && (
                                <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                                  {item.brand}
                                </p>
                              )}
                              <p className="text-sm line-clamp-1">{item.productTitle}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                              {item.displayPrice && (
                                <p className="text-xs font-medium">{item.displayPrice}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status banner */}
                    {order.status === "approved" && (
                      <div className="p-3 border border-green-200 bg-green-50">
                        <p className="text-[10px] tracking-widest uppercase font-medium text-green-700 mb-0.5">
                          Order Approved
                        </p>
                        <p className="text-xs text-green-700/70">
                          This order has been approved. Commission will be paid soon.
                        </p>
                      </div>
                    )}
                    {order.status === "paid" && (
                      <div className="p-3 border border-emerald-200 bg-emerald-50">
                        <p className="text-[10px] tracking-widest uppercase font-medium text-emerald-700 mb-0.5">
                          Commission Paid
                        </p>
                        <p className="text-xs text-emerald-700/70">
                          Your commission for this order has been paid.
                        </p>
                      </div>
                    )}
                    {order.status === "rejected" && (
                      <div className="p-3 border border-red-200 bg-red-50">
                        <p className="text-[10px] tracking-widest uppercase font-medium text-red-700 mb-0.5">
                          Proof Rejected
                        </p>
                        <p className="text-xs text-red-700/70">
                          Your proof was rejected. Please upload a new screenshot below.
                        </p>
                      </div>
                    )}

                    {/* Existing proofs */}
                    {order.proofs.length > 0 && (
                      <div>
                        <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-3">
                          Uploaded Proofs
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {order.proofs.map((proof) => (
                            <div key={proof.id} className="relative group">
                              <div className="aspect-square overflow-hidden border border-border bg-stone-100">
                                <img
                                  src={proof.imageUrl}
                                  alt="Proof"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="mt-1">
                                {proof.adminReviewed && (
                                  <span className="text-[9px] text-green-600">✓ Reviewed</span>
                                )}
                                {proof.adminNote && (
                                  <p className="text-[9px] text-muted-foreground mt-0.5">
                                    Admin: {proof.adminNote}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => void removeProof(order.id, proof.id)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white hover:border-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submit proof form */}
                    {canSubmitProof && (
                      <div className="border border-border p-4 space-y-4">
                        <div>
                          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                            Submit Order Proof
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Upload a screenshot from the affiliate platform. This will be reviewed by the admin.
                          </p>
                        </div>

                        {/* Screenshot upload */}
                        <div>
                          <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2">
                            Order Screenshot <span className="text-destructive">*</span>
                          </p>
                          <SingleImageUpload
                            value={proofForm.imageUrl}
                            onChange={(url) => setFormField(order.id, "imageUrl", url ?? "")}
                          />
                        </div>

                        {/* Platform ref + value */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-widest text-muted-foreground">
                              Platform Order #{" "}
                              <span className="normal-case font-normal opacity-60">(optional)</span>
                            </label>
                            <Input
                              value={proofForm.platformRef}
                              onChange={(e) => setFormField(order.id, "platformRef", e.target.value)}
                              placeholder="e.g. ORD-123456"
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-widest text-muted-foreground">
                              Order Value{" "}
                              <span className="normal-case font-normal opacity-60">(optional)</span>
                            </label>
                            <Input
                              value={proofForm.orderValue}
                              onChange={(e) => setFormField(order.id, "orderValue", e.target.value)}
                              placeholder="e.g. RM 299.90"
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-muted-foreground">
                            Notes <span className="normal-case font-normal opacity-60">(optional)</span>
                          </label>
                          <Textarea
                            value={proofForm.notes}
                            onChange={(e) => setFormField(order.id, "notes", e.target.value)}
                            placeholder="Any additional details for the admin"
                            rows={2}
                            className="resize-none text-sm"
                          />
                        </div>

                        <Button
                          size="sm"
                          onClick={() => void submitProof(order.id)}
                          disabled={proofLoading === order.id || !proofForm.imageUrl}
                          className="text-[10px] tracking-widest uppercase gap-1.5"
                        >
                          <Upload className="h-3 w-3" />
                          {proofLoading === order.id ? "Submitting…" : "Submit for Review"}
                        </Button>
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
