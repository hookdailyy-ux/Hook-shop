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
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useBasket, type BasketItem } from "@/contexts/BasketContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Derive which store an affiliate URL belongs to */
function getStore(affiliateUrl: string): "SHEIN" | "Amazon" | "Noon" | "Other" {
  const url = affiliateUrl.toLowerCase();
  if (url.includes("shein")) return "SHEIN";
  if (url.includes("amazon") || url.includes("amzn")) return "Amazon";
  if (url.includes("noon")) return "Noon";
  return "Other";
}

const STORE_META: Record<string, { label: string; btnClass: string }> = {
  SHEIN: {
    label: "SHEIN",
    btnClass:
      "w-full py-3.5 text-[11px] tracking-widest uppercase bg-foreground text-background hover:opacity-90 transition-opacity",
  },
  Amazon: {
    label: "Amazon",
    btnClass:
      "w-full py-3.5 text-[11px] tracking-widest uppercase border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors",
  },
  Noon: {
    label: "Noon",
    btnClass:
      "w-full py-3.5 text-[11px] tracking-widest uppercase bg-yellow-400 text-black hover:bg-yellow-300 transition-colors",
  },
  Other: {
    label: "Store",
    btnClass:
      "w-full py-3.5 text-[11px] tracking-widest uppercase border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors",
  },
};

function StoreSection({
  storeName,
  items,
  onRemove,
  onUpdateQty,
}: {
  storeName: string;
  items: BasketItem[];
  onRemove: (key: string) => void;
  onUpdateQty: (key: string, qty: number) => void;
}) {
  const meta = STORE_META[storeName] ?? STORE_META.Other;
  const storeItems = items;
  const storeTotal = storeItems.every((i) => i.numericPrice !== null)
    ? storeItems.reduce((s, i) => s + (i.numericPrice ?? 0) * i.quantity, 0)
    : null;
  const totalQty = storeItems.reduce((s, i) => s + i.quantity, 0);

  const handleContinue = () => {
    storeItems.forEach((item) => {
      window.open(item.affiliateUrl, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <div className="border border-border">
      {/* Store header */}
      <div className="flex items-center justify-between px-4 py-3 bg-accent/30 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase font-semibold">
            {meta.label}
          </span>
          <span className="text-[9px] tracking-widest text-muted-foreground">
            {totalQty} {totalQty === 1 ? "item" : "items"}
          </span>
        </div>
        {storeTotal !== null && (
          <span className="text-sm font-medium">
            {storeItems[0]?.displayPrice?.match(/[^\d.,\s]/)?.[0] ?? ""}
            {storeTotal.toFixed(2)}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-border/50">
        {storeItems.map((item) => (
          <div key={item.key} className="flex gap-3 p-4">
            {/* Image */}
            <div className="w-14 h-18 shrink-0 overflow-hidden bg-stone-100" style={{ height: "72px" }}>
              {item.productImageUrl ? (
                <img
                  src={item.productImageUrl}
                  alt={item.productTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground/20" strokeWidth={1} />
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
              <p className="text-xs leading-snug line-clamp-2 mt-0.5">
                {item.productTitle}
              </p>
              {item.displayPrice && (
                <p className="text-xs font-semibold mt-0.5">{item.displayPrice}</p>
              )}
              {(item.size || item.color) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.size && (
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-accent border border-border">
                      {item.size}
                    </span>
                  )}
                  {item.color && (
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-accent border border-border">
                      {item.color}
                    </span>
                  )}
                </div>
              )}

              {/* Qty + remove */}
              <div className="flex items-center gap-2.5 mt-2">
                <div className="flex items-center border border-border">
                  <button
                    onClick={() => onUpdateQty(item.key, item.quantity - 1)}
                    className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="text-xs w-6 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.key, item.quantity + 1)}
                    className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
                <button
                  onClick={() => onRemove(item.key)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-store checkout */}
      <div className="p-4 border-t border-border">
        <button onClick={handleContinue} className={meta.btnClass}>
          <span className="flex items-center justify-center gap-2">
            <ExternalLink className="h-3.5 w-3.5" />
            Continue with {meta.label}
          </span>
        </button>
      </div>
    </div>
  );
}

export function BasketDrawer() {
  const {
    items,
    isOpen,
    closeBasket,
    removeItem,
    updateQty,
    clearBasket,
    totalItems,
    currentMemberUsername,
    currentMemberName,
  } = useBasket();

  const { toast } = useToast();
  const { t } = useTranslation();
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
      toast({ title: t("basket.copied") });
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

  // Group items by inferred store
  const storeGroups = items.reduce<Record<string, BasketItem[]>>((acc, item) => {
    const store = getStore(item.affiliateUrl);
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {});

  const storeOrder: string[] = ["SHEIN", "Amazon", "Noon", "Other"];
  const activeStores = storeOrder.filter((s) => storeGroups[s]?.length);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={closeBasket}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 rtl:right-auto rtl:left-0 z-50 w-full sm:max-w-md bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm font-medium">{t("basket.title")}</span>
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
                {t("basket.clearAll")}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pb-20 text-center px-8">
              <ShoppingBag
                className="h-14 w-14 text-muted-foreground/10 mb-4"
                strokeWidth={1}
              />
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                {t("basket.empty")}
              </p>
              <p className="text-xs text-muted-foreground/50 leading-relaxed">
                {t("basket.emptyHint")}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Curator line */}
              {currentMemberName && currentMemberUsername && (
                <div className="flex items-center gap-2 pb-1">
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                    {t("basket.shoppingFrom")}
                  </p>
                  <p className="text-[9px] tracking-widest uppercase font-semibold">
                    @{currentMemberUsername}
                  </p>
                </div>
              )}

              {/* Per-store sections */}
              {activeStores.map((store) => (
                <StoreSection
                  key={store}
                  storeName={store}
                  items={storeGroups[store]}
                  onRemove={removeItem}
                  onUpdateQty={updateQty}
                />
              ))}

              {/* Share basket */}
              <div className="pt-1">
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
                    {sharing ? t("basket.generatingLink") : t("basket.shareBasket")}
                  </button>
                ) : (
                  <div className="border border-border p-3 space-y-2.5 bg-accent/20">
                    <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                      {t("basket.basketLinkReady")}
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
                            <span className="text-green-600">{t("basket.copied")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            {t("basket.copyLink")}
                          </>
                        )}
                      </button>
                      <button
                        onClick={shareViaWhatsApp}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-[9px] tracking-widest uppercase hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="h-3 w-3" />
                        {t("basket.whatsapp")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
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
