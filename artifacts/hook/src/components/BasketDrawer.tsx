import { useState } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Share2,
  Copy,
  Check,
  MessageCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useBasket } from "@/contexts/BasketContext";
import { CheckoutModal } from "./CheckoutModal";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function BasketDrawer() {
  const {
    items,
    isOpen,
    closeBasket,
    removeItem,
    updateQty,
    clearBasket,
    totalItems,
    totalPrice,
    currentMemberUsername,
    currentMemberName,
  } = useBasket();

  const { toast } = useToast();
  const [showCheckout, setShowCheckout] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const shareUrl = shareToken
    ? `${window.location.origin}${BASE}/basket/${shareToken}`
    : null;

  const handleShare = async () => {
    if (!currentMemberUsername || items.length === 0) return;
    setSharing(true);
    try {
      const res = await fetch(`${BASE}/api/basket/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberUsername: currentMemberUsername,
          memberName: currentMemberName ?? currentMemberUsername,
          items,
        }),
      });
      const data = (await res.json()) as { token?: string };
      if (!res.ok || !data.token) throw new Error("Failed");
      setShareToken(data.token);
    } catch {
      toast({ title: "Failed to generate basket link", variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      toast({ title: "Basket link copied!" });
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const shareViaWhatsApp = () => {
    if (!shareUrl) return;
    const msg = encodeURIComponent(
      `Hi! Here's my basket from your HOOK store: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={closeBasket}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm font-medium">Your Basket</span>
            {totalItems > 0 && (
              <span className="text-[10px] font-bold bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={clearBasket}
                className="text-[9px] tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
              >
                Clear All
              </button>
            )}
            <button
              onClick={closeBasket}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pb-20 text-center px-8">
              <ShoppingBag
                className="h-14 w-14 text-muted-foreground/10 mb-4"
                strokeWidth={1}
              />
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                Your basket is empty
              </p>
              <p className="text-xs text-muted-foreground/50 leading-relaxed">
                Add products from a store, collection or look to get started.
              </p>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {currentMemberName && (
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                    Shopping from
                  </p>
                  <p className="text-[9px] tracking-widest uppercase font-semibold">
                    @{currentMemberUsername}
                  </p>
                </div>
              )}

              {items.map((item) => (
                <div key={item.key} className="flex gap-3">
                  {/* Image */}
                  <div className="w-16 h-20 shrink-0 overflow-hidden bg-stone-100">
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item.productTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag
                          className="h-5 w-5 text-muted-foreground/20"
                          strokeWidth={1}
                        />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {item.brand && (
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                        {item.brand}
                      </p>
                    )}
                    <p className="text-sm leading-snug line-clamp-2 mt-0.5">
                      {item.productTitle}
                    </p>
                    {item.displayPrice && (
                      <p className="text-sm font-semibold mt-0.5">
                        {item.displayPrice}
                      </p>
                    )}

                    {/* Variant chips */}
                    {(item.size || item.color) && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {item.size && (
                          <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-accent border border-border">
                            {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-accent border border-border">
                            {item.color}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Qty + remove */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-0 border border-border">
                        <button
                          onClick={() =>
                            updateQty(item.key, item.quantity - 1)
                          }
                          className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm w-7 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQty(item.key, item.quantity + 1)
                          }
                          className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.key)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3 shrink-0 bg-background">
            {/* Total */}
            {totalPrice !== null && (
              <div className="flex items-center justify-between py-1">
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
                  Estimated Total
                </span>
                <span className="font-serif text-xl font-light">
                  RM {totalPrice.toFixed(2)}
                </span>
              </div>
            )}

            {/* Share basket */}
            {!shareToken ? (
              <button
                onClick={() => void handleShare()}
                disabled={sharing}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-border text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
              >
                {sharing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
                {sharing ? "Generating Link…" : "Share Basket"}
              </button>
            ) : (
              <div className="border border-border p-3 space-y-2.5 bg-accent/20">
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                  Basket Link Ready
                </p>
                <p className="text-[10px] font-mono truncate text-muted-foreground border border-border px-2 py-1.5 bg-background">
                  {shareUrl}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => void copyShareUrl()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border text-[9px] tracking-widest uppercase hover:border-foreground/40 transition-colors"
                  >
                    {copiedShare ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Link
                      </>
                    )}
                  </button>
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-[9px] tracking-widest uppercase hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* Place order */}
            <Button
              onClick={() => setShowCheckout(true)}
              className="w-full text-xs tracking-widest uppercase gap-2"
            >
              Place Order
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Checkout modal (on top of drawer) */}
      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={(ref) => {
            setShowCheckout(false);
            closeBasket();
            toast({
              title: `Order placed — ref ${ref}`,
              description: "The seller will contact you shortly.",
            });
          }}
        />
      )}
    </>
  );
}

export function FloatingBasketButton() {
  const { totalItems, openBasket } = useBasket();

  return (
    <button
      onClick={openBasket}
      aria-label="Open basket"
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-foreground text-background shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
    >
      <ShoppingBag className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold px-1">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
