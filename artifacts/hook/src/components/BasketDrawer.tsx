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
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";
import {
  useBasket,
  inferStore,
  buildBasketKey,
  type BasketItem,
} from "@/contexts/BasketContext";
import {
  useGetProduct,
  getGetProductQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Store display config ─────────────────────────────────────────────────────

const STORE_META: Record<string, { label: string; btnClass: string }> = {
  SHEIN: {
    label: "SHEIN",
    btnClass:
      "w-full py-3.5 text-[11px] tracking-widest uppercase bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-2",
  },
  Amazon: {
    label: "Amazon",
    btnClass:
      "w-full py-3.5 text-[11px] tracking-widest uppercase border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2",
  },
  Noon: {
    label: "Noon",
    btnClass:
      "w-full py-3.5 text-[11px] tracking-widest uppercase bg-yellow-400 text-black hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2",
  },
  Other: {
    label: "SHEIN",
    btnClass:
      "w-full py-3.5 text-[11px] tracking-widest uppercase bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-2",
  },
};

// ── Product edit modal ───────────────────────────────────────────────────────

function BasketEditModal({
  item,
  onSave,
  onCancel,
}: {
  item: BasketItem;
  onSave: (size: string | null, color: string | null, qty: number) => void;
  onCancel: () => void;
}) {
  const { data: product, isLoading } = useGetProduct(item.productId, {
    query: {
      enabled: !!item.productId,
      queryKey: getGetProductQueryKey(item.productId),
    },
  });

  const [selectedSize, setSelectedSize] = useState<string | null>(item.size);
  const [selectedColor, setSelectedColor] = useState<string | null>(item.color);
  const [qty, setQty] = useState(item.quantity);

  const sizes = Array.isArray(product?.sizes) ? (product.sizes as string[]) : [];
  const colors = Array.isArray(product?.colors) ? (product.colors as string[]) : [];
  const imageUrl = product?.imageUrl ?? item.productImageUrl;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full sm:max-w-sm bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-medium tracking-wide">Edit Item</span>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Product preview */}
            <div className="flex gap-3 pb-4 border-b border-border">
              <div className="w-16 h-20 shrink-0 overflow-hidden bg-stone-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.productTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground/20" strokeWidth={1} />
                  </div>
                )}
              </div>
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
                  <p className="text-sm font-semibold mt-1">{item.displayPrice}</p>
                )}
              </div>
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2.5">
                  Size{selectedSize ? ` — ${selectedSize}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setSelectedSize(selectedSize === size ? null : size)
                      }
                      className={`min-w-[44px] h-9 px-3 text-xs tracking-widest border transition-colors ${
                        selectedSize === size
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2.5">
                  Color{selectedColor ? ` — ${selectedColor}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        setSelectedColor(selectedColor === color ? null : color)
                      }
                      className={`h-9 px-3 text-xs tracking-widest border transition-colors ${
                        selectedColor === color
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2.5">
                Quantity
              </p>
              <div className="flex items-center border border-border w-fit">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-medium w-10 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-6 pt-4 border-t border-border flex gap-2">
          <button
            onClick={() => onSave(selectedSize, selectedColor, qty)}
            className="flex-1 py-3.5 bg-foreground text-background text-[10px] tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            Update Basket
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3.5 border border-border text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Per-item row ─────────────────────────────────────────────────────────────

function BasketItemRow({
  item,
  onRemove,
  onSwitchStore,
  onOpenEdit,
  onUpdateQty,
}: {
  item: BasketItem;
  onRemove: (key: string) => void;
  onSwitchStore: (item: BasketItem) => void;
  onOpenEdit: (item: BasketItem) => void;
  onUpdateQty: (key: string, qty: number) => void;
}) {
  const otherStore =
    item.noonUrl && item.amazonUrl
      ? item.productSource === "Noon"
        ? "Amazon"
        : item.productSource === "Amazon"
        ? "Noon"
        : null
      : null;

  return (
    <div className="p-4 space-y-2">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-14 shrink-0 overflow-hidden bg-stone-100" style={{ height: "72px" }}>
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

        {/* Details */}
        <div className="flex-1 min-w-0">
          {item.brand && (
            <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
              {item.brand}
            </p>
          )}
          <p className="text-xs leading-snug line-clamp-2 mt-0.5">{item.productTitle}</p>
          {item.displayPrice && (
            <p className="text-xs font-semibold mt-0.5">{item.displayPrice}</p>
          )}

          {/* Size / Color chips */}
          {(item.size || item.color) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
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

          {/* Qty + actions */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center border border-border">
              <button
                onClick={() => onUpdateQty(item.key, item.quantity - 1)}
                className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Minus className="h-2.5 w-2.5" />
              </button>
              <span className="text-xs w-6 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => onUpdateQty(item.key, item.quantity + 1)}
                className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>

            <button
              onClick={() => onOpenEdit(item)}
              className="flex items-center gap-1 text-[9px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="h-2.5 w-2.5" />
              Edit
            </button>

            <button
              onClick={() => onRemove(item.key)}
              className="ml-auto text-muted-foreground hover:text-destructive transition-colors p-0.5"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Also available / Switch store */}
      {otherStore && (
        <div className="flex items-center justify-between bg-accent/40 border border-border/60 px-3 py-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] tracking-wide text-muted-foreground">
              Also available on
            </span>
            <span className="text-[9px] tracking-widest uppercase font-semibold">{otherStore}</span>
            {otherStore === "Noon" && item.noonPrice && (
              <span className="text-[9px] text-muted-foreground">· {item.noonPrice}</span>
            )}
            {otherStore === "Amazon" && item.amazonPrice && (
              <span className="text-[9px] text-muted-foreground">· {item.amazonPrice}</span>
            )}
          </div>
          <button
            onClick={() => onSwitchStore(item)}
            className="flex items-center gap-1 text-[9px] tracking-widest uppercase border border-border px-2 py-1 hover:bg-foreground hover:text-background hover:border-foreground transition-colors shrink-0 ml-2"
          >
            <ArrowLeftRight className="h-2.5 w-2.5" />
            Switch
          </button>
        </div>
      )}
    </div>
  );
}

// ── Store section (collapsible) ──────────────────────────────────────────────

function StoreSection({
  storeName,
  items,
  onRemove,
  onUpdateQty,
  onSwitchStore,
  onOpenEdit,
}: {
  storeName: string;
  items: BasketItem[];
  onRemove: (key: string) => void;
  onUpdateQty: (key: string, qty: number) => void;
  onSwitchStore: (item: BasketItem) => void;
  onOpenEdit: (item: BasketItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const meta = STORE_META[storeName] ?? STORE_META.Other;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const storeTotal = items.every((i) => i.numericPrice !== null)
    ? items.reduce((s, i) => s + (i.numericPrice ?? 0) * i.quantity, 0)
    : null;
  const currencySymbol = items[0]?.displayPrice?.match(/[^\d.,\s]/)?.[0] ?? "";

  const handleContinue = (e: React.MouseEvent) => {
    e.stopPropagation();
    items.forEach((item) =>
      window.open(item.affiliateUrl, "_blank", "noopener,noreferrer")
    );
  };

  return (
    <div className="border border-border">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-accent/30 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase font-semibold">
            {meta.label}
          </span>
          <span className="text-[9px] tracking-widest text-muted-foreground">
            — {totalQty} {totalQty === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {storeTotal !== null && (
            <span className="text-sm font-medium tabular-nums">
              {currencySymbol}{storeTotal.toFixed(2)}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <>
          <div className="divide-y divide-border/50">
            {items.map((item) => (
              <BasketItemRow
                key={item.key}
                item={item}
                onRemove={onRemove}
                onUpdateQty={onUpdateQty}
                onSwitchStore={onSwitchStore}
                onOpenEdit={onOpenEdit}
              />
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <button onClick={handleContinue} className={meta.btnClass}>
              <ExternalLink className="h-3.5 w-3.5" />
              Continue with {meta.label}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Basket drawer ────────────────────────────────────────────────────────────

export function BasketDrawer() {
  const {
    items,
    isOpen,
    closeBasket,
    removeItem,
    updateQty,
    updateItemFields,
    editItem,
    clearBasket,
    totalItems,
    currentMemberUsername,
    currentMemberName,
  } = useBasket();

  const { toast } = useToast();
  const { t } = useTranslation();

  const [editingItem, setEditingItem] = useState<BasketItem | null>(null);
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

  const handleSwitchStore = (item: BasketItem) => {
    const newSource = item.productSource === "Noon" ? "Amazon" : "Noon";
    const newUrl = newSource === "Noon" ? item.noonUrl : item.amazonUrl;
    const newPrice = newSource === "Noon" ? item.noonPrice : item.amazonPrice;
    if (!newUrl) return;
    updateItemFields(item.key, {
      productSource: newSource,
      affiliateUrl: newUrl,
      displayPrice: newPrice ?? null,
      numericPrice: newPrice
        ? parseFloat(newPrice.replace(/[^\d.]/g, "")) || null
        : null,
    });
  };

  const handleSaveEdit = (
    newSize: string | null,
    newColor: string | null,
    newQty: number
  ) => {
    if (!editingItem) return;
    // editItem looks up by stable `id`, never by key — so changing size/color
    // cannot possibly create a duplicate item.
    editItem(editingItem.id, newSize, newColor, newQty);
    setEditingItem(null);
  };

  // Group items by store
  const storeGroups = items.reduce<Record<string, BasketItem[]>>((acc, item) => {
    const store = item.productSource || inferStore(item.affiliateUrl);
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {});

  const storeOrder = ["SHEIN", "Amazon", "Noon", "Other"];
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
            <div className="p-4 space-y-3">
              {/* Summary */}
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                Your Cart ({totalItems} {totalItems === 1 ? "Item" : "Items"})
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
                  onUpdateQty={updateQty}
                  onSwitchStore={handleSwitchStore}
                  onOpenEdit={setEditingItem}
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

      {/* Edit modal — rendered outside drawer so it layers on top */}
      {editingItem && (
        <BasketEditModal
          item={editingItem}
          onSave={handleSaveEdit}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </>
  );
}

// ── Floating basket button ───────────────────────────────────────────────────

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
