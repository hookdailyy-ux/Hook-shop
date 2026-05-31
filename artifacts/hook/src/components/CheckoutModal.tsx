import { useState, type FormEvent } from "react";
import { X, Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useBasket } from "@/contexts/BasketContext";
import { useTranslation } from "react-i18next";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Props {
  onClose: () => void;
  onSuccess: (orderRef: string) => void;
}

export function CheckoutModal({ onClose, onSuccess }: Props) {
  const { items, currentMemberUsername, clearBasket } = useBasket();
  const { toast } = useToast();
  const { t } = useTranslation();
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
      toast({ title: t("checkout.namePhoneRequired"), variant: "destructive" });
      return;
    }
    if (!currentMemberUsername) {
      toast({ title: t("checkout.noStoreSelected"), variant: "destructive" });
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
      toast({ title: t("checkout.failedToPlace"), variant: "destructive" });
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
                <span className="text-sm font-medium">{t("checkout.yourDetails")}</span>
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
              <span className="text-sm font-medium text-green-700">{t("checkout.orderPlaced")}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === "form" && (
            <form id="order-form" onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("checkout.fullName")} <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  placeholder={t("checkout.fullNamePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("checkout.phoneNumber")} <span className="text-destructive">*</span>
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
                  {t("checkout.email")} <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">{t("checkout.optional")}</span>
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
                  {t("checkout.shippingAddress")} <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">{t("checkout.optional")}</span>
                </label>
                <Textarea
                  value={form.shippingAddress}
                  onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                  placeholder={t("checkout.addressPlaceholder")}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("checkout.notes")} <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">{t("checkout.optional")}</span>
                </label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder={t("checkout.notesPlaceholder")}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Order summary */}
              <div className="border border-border p-4 bg-accent/10 space-y-1">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{t("checkout.orderSummary")}</p>
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
                  {totalItems} {t(totalItems !== 1 ? "checkout.items" : "checkout.item")}
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
                <h2 className="font-serif text-2xl font-light mb-2">{t("checkout.thankYou")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("checkout.orderReceived")}
                </p>
              </div>
              <div className="border border-border p-4 bg-accent/10">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{t("checkout.orderReference")}</p>
                <p className="font-mono text-lg font-semibold">{orderRef}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("checkout.saveForTracking")}</p>
              </div>
              <Button onClick={onClose} className="w-full text-xs tracking-widest uppercase">
                {t("checkout.continueShopping")}
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
                ? t("checkout.placingOrder")
                : `${t("checkout.placeOrderBtn")} · ${totalItems} ${t(totalItems !== 1 ? "checkout.items" : "checkout.item")}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
