import { useState } from "react";
import {
  X,
  Trash2,
  ShoppingBag,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
} from "lucide-react";
import { useBasket, inferStore, type BasketItem } from "@/contexts/BasketContext";
import { QuickViewModal, type QuickViewProduct } from "@/components/QuickViewModal";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

// ── Store display config ──────────────────────────────────────────────────────

const STORE_META: Record<string, { label: string; exploreLabel: string }> = {
  SHEIN: { label: "SHEIN", exploreLabel: "EXPLORE MORE VIA SHEIN" },
  Amazon: { label: "Amazon", exploreLabel: "EXPLORE MORE VIA AMAZON" },
  Noon: { label: "Noon", exploreLabel: "EXPLORE MORE VIA NOON" },
  Other: { label: "Other", exploreLabel: "EXPLORE MORE" },
};

// ── Individual item row ───────────────────────────────────────────────────────

function BasketItemRow({
  item,
  onRemove,
  onQuickView,
}: {
  item: BasketItem;
  onRemove: (key: string) => void;
  onQuickView: (item: BasketItem) => void;
}) {
  return (
    <div className="py-5 px-4">
      <div className="flex gap-3 items-start">
        {/* Image — clickable → QuickView */}
        <button
          onClick={() => onQuickView(item)}
          aria-label={`Quick view ${item.productTitle}`}
          className="w-[72px] shrink-0 overflow-hidden bg-[#e8e0d4] hover:opacity-80 transition-opacity"
          style={{ height: "90px" }}
        >
          {item.productImageUrl ? (
            <img
              src={item.productImageUrl}
              alt={item.productTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag
                className="h-4 w-4 text-muted-foreground/20"
                strokeWidth={1}
              />
            </div>
          )}
        </button>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {item.brand && (
            <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-0.5">
              {item.brand}
            </p>
          )}

          {/* Name — clickable → QuickView */}
          <button
            onClick={() => onQuickView(item)}
            className="text-left text-xs font-medium leading-snug line-clamp-2 hover:underline decoration-1 underline-offset-2 transition-all w-full"
          >
            {item.productTitle}
          </button>

          {item.displayPrice && (
            <p className="text-xs font-semibold mt-1">{item.displayPrice}</p>
          )}

          {/* Available Sizes — display only, no interaction */}
          {(item.availableSizes?.length ?? 0) > 0 && (
            <div className="mt-2">
              <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-0.5">
                Available Sizes
              </p>
              <p className="text-[10px] text-foreground/70 tracking-wide">
                {item.availableSizes!.join(" · ")}
              </p>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onRemove(item.key)}
          aria-label="Remove item"
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 mt-0.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ORDER NOW */}
      <div className="mt-3 ml-[84px]">
        <a
          href={item.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-foreground text-background text-[10px] tracking-widest uppercase hover:opacity-90 transition-opacity"
          data-testid={`button-order-now-${item.productId}`}
        >
          <ExternalLink className="h-3 w-3" />
          Order Now
        </a>
      </div>
    </div>
  );
}

// ── Store section (collapsible) ───────────────────────────────────────────────

function StoreSection({
  storeName,
  items,
  onRemove,
  onQuickView,
  exploreUrl,
}: {
  storeName: string;
  items: BasketItem[];
  onRemove: (key: string) => void;
  onQuickView: (item: BasketItem) => void;
  exploreUrl: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const { toast } = useToast();

  const meta = STORE_META[storeName] ?? STORE_META.Other;
  const totalItems = items.length;

  const handleShare = async () => {
    setSharing(true);
    try {
      const lines = items
        .map((item) => `• ${item.productTitle} → ${item.affiliateUrl}`)
        .join("\n");
      const text = `🛍 Shop my picks from ${meta.label}:\n\n${lines}`;

      if (navigator.share) {
        await navigator.share({ text });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } else {
        // Fallback: open WhatsApp
        const encoded = encodeURIComponent(text);
        window.open(
          `https://wa.me/?text=${encoded}`,
          "_blank",
          "noopener,noreferrer"
        );
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast({ title: "Could not open share sheet", variant: "destructive" });
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="border border-border">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-accent/30 hover:bg-accent/50 transition-colors"
        data-testid={`store-section-${storeName}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] tracking-[0.3em] uppercase font-semibold">
            {meta.label}
          </span>
          <span className="text-[9px] text-muted-foreground">
            — {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Items */}
          <div className="divide-y divide-border/40">
            {items.map((item) => (
              <BasketItemRow
                key={item.key}
                item={item}
                onRemove={onRemove}
                onQuickView={onQuickView}
              />
            ))}
          </div>

          {/* Footer: share + explore */}
          <div className="p-4 space-y-2 border-t border-border/60">
            {/* Share Basket */}
            <button
              onClick={() => void handleShare()}
              disabled={sharing}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-border text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
              data-testid={`button-share-basket-${storeName}`}
            >
              {sharing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : shared ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-green-600">Shared!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  Share Basket
                </>
              )}
            </button>

            {/* Explore More via Store */}
            {exploreUrl && (
              <a
                href={exploreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-foreground text-background text-[10px] tracking-widest uppercase hover:opacity-90 transition-opacity"
                data-testid={`button-explore-more-${storeName}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {meta.exploreLabel}
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Basket drawer ─────────────────────────────────────────────────────────────

export function BasketDrawer() {
  const {
    items,
    isOpen,
    closeBasket,
    removeItem,
    clearBasket,
    totalItems,
    currentMemberUsername,
  } = useBasket();

  const { t } = useTranslation();
  const { data: settings } = useSiteSettings();

  // QuickView state — null = closed
  const [quickViewItem, setQuickViewItem] = useState<BasketItem | null>(null);

  // Per-store general affiliate links from admin settings
  const generalLinks: Record<string, string> = {
    SHEIN: settings?.sheinGeneralUrl ?? "",
    Amazon: settings?.amazonGeneralUrl ?? "",
    Noon: settings?.noonGeneralUrl ?? "",
    Other: settings?.sheinGeneralUrl ?? "",
  };

  // Group items by store
  const storeGroups = items.reduce<Record<string, BasketItem[]>>(
    (acc, item) => {
      const store = item.productSource || inferStore(item.affiliateUrl);
      if (!acc[store]) acc[store] = [];
      acc[store].push(item);
      return acc;
    },
    {}
  );

  const storeOrder = ["SHEIN", "Amazon", "Noon", "Other"];
  const activeStores = storeOrder.filter((s) => storeGroups[s]?.length);

  // Build QuickViewProduct from a basket item
  const quickViewProduct: QuickViewProduct | null = quickViewItem
    ? {
        id: quickViewItem.productId,
        title: quickViewItem.productTitle,
        imageUrl: quickViewItem.productImageUrl,
        price: quickViewItem.displayPrice,
        brand: quickViewItem.brand,
        affiliateUrl: quickViewItem.affiliateUrl,
        category: "",
        source: quickViewItem.productSource,
      }
    : null;

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
            <span className="text-sm font-medium tracking-wide">
              {t("basket.title")}
            </span>
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
                data-testid="button-clear-basket"
              >
                {t("basket.clearAll")}
              </button>
            )}
            <button
              onClick={closeBasket}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 ml-1"
              aria-label="Close basket"
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
            <div className="p-4 space-y-3">
              {/* Summary line */}
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground pb-1">
                {totalItems} {totalItems === 1 ? "Item" : "Items"}
                {currentMemberUsername && (
                  <span className="ml-2 font-semibold text-foreground">
                    · @{currentMemberUsername}
                  </span>
                )}
              </p>

              {/* Collapsible store sections */}
              {activeStores.map((store) => (
                <StoreSection
                  key={store}
                  storeName={store}
                  items={storeGroups[store]}
                  onRemove={removeItem}
                  onQuickView={setQuickViewItem}
                  exploreUrl={generalLinks[store] ?? ""}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QuickView modal — rendered after drawer in DOM, appears on top */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          fromBasket
          onClose={() => setQuickViewItem(null)}
        />
      )}
    </>
  );
}

// ── Floating basket button ────────────────────────────────────────────────────

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
