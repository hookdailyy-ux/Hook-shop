import { useState, type FormEvent } from "react";
import { X, Minus, Plus, ShoppingBag, Check, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface BasketItem {
  productId: number;
  productTitle: string;
  productImageUrl: string | null;
  displayPrice: string | null;
  quantity: number;
  affiliateUrl: string;
  brand: string | null;
}

interface Props {
  basket: BasketItem[];
  memberId: number;
  memberUsername: string;
  onClose: () => void;
  onSuccess: (orderRef: string) => void;
  onUpdateQty: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
}

export function CheckoutModal({ basket, memberId, memberUsername, onClose, onSuccess, onUpdateQty, onRemove }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<"basket" | "form" | "success">("basket");
  const [orderRef, setOrderRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
    notes: "",
  });

  const totalItems = basket.reduce((s, i) => s + i.quantity, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/store/${memberUsername}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerEmail: form.customerEmail.trim() || null,
          shippingAddress: form.shippingAddress.trim() || null,
          notes: form.notes.trim() || null,
          items: basket.map((i) => ({
            productId: i.productId,
            productTitle: i.productTitle,
            productImageUrl: i.productImageUrl,
            displayPrice: i.displayPrice,
            quantity: i.quantity,
            affiliateUrl: i.affiliateUrl,
            brand: i.brand,
          })),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; orderRef?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setOrderRef(data.orderRef ?? "");
      setStep("success");
      onSuccess(data.orderRef ?? "");
    } catch (err) {
      toast({ title: "Failed to place order. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step !== "success" ? onClose : undefined} />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-lg bg-background sm:rounded-2xl shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh] mt-auto sm:mt-0">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          {step === "basket" && (
            <>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-sm font-medium">Your Basket</span>
                <span className="text-xs text-muted-foreground ml-1">({totalItems} {totalItems === 1 ? "item" : "items"})</span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          {step === "form" && (
            <>
              <button onClick={() => setStep("basket")} className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground">← Back</button>
              <span className="text-sm font-medium">Your Details</span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="h-4 w-4" /></button>
            </>
          )}
          {step === "success" && (
            <div className="flex items-center gap-2 mx-auto">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-700">Order Placed!</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── BASKET VIEW ────────────────────────────────────────────── */}
          {step === "basket" && (
            <div className="p-5 space-y-4">
              {basket.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">Your basket is empty.</div>
              ) : (
                <>
                  {basket.map((item) => (
                    <div key={item.productId} className="flex gap-3 items-start">
                      <div className="w-16 h-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        {item.productImageUrl
                          ? <img src={item.productImageUrl} alt={item.productTitle} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-muted-foreground/30" strokeWidth={1} /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.brand && <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{item.brand}</p>}
                        <p className="text-sm leading-snug line-clamp-2">{item.productTitle}</p>
                        {item.displayPrice && <p className="text-sm font-semibold mt-0.5">{item.displayPrice}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 border border-border rounded-lg">
                            <button onClick={() => onUpdateQty(item.productId, Math.max(0, item.quantity - 1))} className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                            <button onClick={() => onUpdateQty(item.productId, item.quantity + 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button onClick={() => onRemove(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── DETAILS FORM ────────────────────────────────────────────── */}
          {step === "form" && (
            <form id="order-form" onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Full Name <span className="text-destructive">*</span></label>
                <Input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="Your full name" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Phone Number <span className="text-destructive">*</span></label>
                <Input value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} placeholder="+60123456789" type="tel" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">optional</span></label>
                <Input value={form.customerEmail} onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} placeholder="email@example.com" type="email" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Shipping Address <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">optional</span></label>
                <Textarea value={form.shippingAddress} onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))} placeholder="Your delivery address" rows={2} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">optional</span></label>
                <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any special requests or notes" rows={2} className="resize-none" />
              </div>

              {/* Items summary */}
              <div className="border border-border rounded-xl p-4 bg-accent/10">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">Order Summary</p>
                {basket.map((item) => (
                  <div key={item.productId} className="flex justify-between text-xs py-1">
                    <span className="text-muted-foreground line-clamp-1 max-w-[70%]">{item.quantity}× {item.productTitle}</span>
                    <span>{item.displayPrice ?? "—"}</span>
                  </div>
                ))}
              </div>
            </form>
          )}

          {/* ── SUCCESS VIEW ────────────────────────────────────────────── */}
          {step === "success" && (
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-light mb-2">Thank You!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your order has been received. The seller will contact you shortly.
                </p>
              </div>
              <div className="border border-border rounded-xl p-4 bg-accent/10">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Order Reference</p>
                <p className="font-mono text-lg font-semibold">{orderRef}</p>
                <p className="text-xs text-muted-foreground mt-1">Save this reference for tracking.</p>
              </div>
              <Button onClick={onClose} className="w-full text-xs tracking-widest uppercase">
                Continue Shopping
              </Button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step === "basket" && basket.length > 0 && (
          <div className="px-5 py-4 border-t border-border shrink-0">
            <Button onClick={() => setStep("form")} className="w-full text-xs tracking-widest uppercase">
              Proceed to Order → ({totalItems} {totalItems === 1 ? "item" : "items"})
            </Button>
          </div>
        )}
        {step === "form" && (
          <div className="px-5 py-4 border-t border-border shrink-0">
            <Button form="order-form" type="submit" disabled={loading} className="w-full text-xs tracking-widest uppercase gap-2">
              {loading ? "Placing Order…" : "Place Order"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
