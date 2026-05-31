import { useState, type FormEvent } from "react";
import { X, Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useBasket } from "@/contexts/BasketContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Props {
  onClose: () => void;
  onSuccess: (orderRef: string) => void;
}

export function CheckoutModal({ onClose, onSuccess }: Props) {
  const { items, currentMemberUsername, clearBasket } = useBasket();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "success">("form");
  const [orderRef, setOrderRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
    notes: "",
  });

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    if (!currentMemberUsername) {
      toast({ title: "No store selected", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/store/${currentMemberUsername}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerEmail: form.customerEmail.trim() || null,
          shippingAddress: form.shippingAddress.trim() || null,
          notes: form.notes.trim() || null,
          items: items.map((i) => ({
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
      clearBasket();
      setOrderRef(data.orderRef ?? "");
      setStep("success");
      onSuccess(data.orderRef ?? "");
    } catch {
      toast({ title: "Failed to place order. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex flex-col sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step !== "success" ? onClose : undefined}
      />
      <div className="relative z-10 w-full sm:max-w-lg bg-background sm:rounded-2xl shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh] mt-auto sm:mt-0">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          {step === "form" && (
            <>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-sm font-medium">Your Details</span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
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
          {step === "form" && (
            <form id="order-form" onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.customerPhone}
                  onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                  placeholder="+60123456789"
                  type="tel"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Email <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">optional</span>
                </label>
                <Input
                  value={form.customerEmail}
                  onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                  placeholder="email@example.com"
                  type="email"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Shipping Address <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">optional</span>
                </label>
                <Textarea
                  value={form.shippingAddress}
                  onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                  placeholder="Your delivery address"
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Notes <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">optional</span>
                </label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Special requests or notes"
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Order summary */}
              <div className="border border-border p-4 bg-accent/10 space-y-1">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Order Summary</p>
                {items.map((item) => (
                  <div key={item.key} className="flex justify-between text-xs py-0.5">
                    <span className="text-muted-foreground line-clamp-1 max-w-[68%]">
                      {item.quantity}× {item.productTitle}
                      {item.size ? ` · ${item.size}` : ""}
                      {item.color ? ` · ${item.color}` : ""}
                    </span>
                    <span className="font-medium">{item.displayPrice ?? "—"}</span>
                  </div>
                ))}
                <div className="pt-2 mt-1 border-t border-border text-[10px] text-muted-foreground">
                  {totalItems} item{totalItems !== 1 ? "s" : ""} total
                </div>
              </div>
            </form>
          )}

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
              <div className="border border-border p-4 bg-accent/10">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Order Reference</p>
                <p className="font-mono text-lg font-semibold">{orderRef}</p>
                <p className="text-xs text-muted-foreground mt-1">Save this for tracking.</p>
              </div>
              <Button onClick={onClose} className="w-full text-xs tracking-widest uppercase">
                Continue Shopping
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "form" && (
          <div className="px-5 py-4 border-t border-border shrink-0">
            <Button
              form="order-form"
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full text-xs tracking-widest uppercase"
            >
              {loading
                ? "Placing Order…"
                : `Place Order · ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
