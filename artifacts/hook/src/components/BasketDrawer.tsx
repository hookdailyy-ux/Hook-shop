import { useState } from "react";
import { useLocation } from "wouter";
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
  type BasketItem,
} from "@/contexts/BasketContext";
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

// ── Checkbox ─────────────────────────────────────────────────────────────────

function ItemCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      aria-label={checked ? "Deselect item" : "Select item"}
      className={`w-4 h-4 shrink-0 border flex items-center justify-center transition-colors ${
        checked
          ? "bg-foreground border-foreground"
          : "bg-background border-border hover:border-foreground/50"
      }`}
    >
      {checked && <Check className="h-2.5 w-2.5 text-background" strokeWidth={3} />}
    </button>
  );
}

// ── Per-item row ─────────────────────────────────────────────────────────────

function BasketItemRow({
  item,
  isSelected,
  onToggleSelect,
  onRemove,
  onSwitchStore,
  onEdit,
  onUpdateQty,
}: {
  item: BasketItem;
  isSelected: boolean;
  onToggleSelect: (key: string) => void;
  onRemove: (key: string) => void;
  onSwitchStore: (item: BasketItem) => void;
  onEdit: (productId: number) => void;
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
    <div
      className={`p-4 space-y-2 transition-colors ${
        isSelected ? "bg-accent/20" : ""
      }`}
    >
      <div className="flex gap-3 items-start">
        {/* Checkbox */}
        <div className="pt-1 shrink-0">
          <ItemCheckbox
            checked={isSelected}
            onChange={() => onToggleSelect(item.key)}
          />
        </div>

        {/* Thumbnail */}
        <div
          className="w-14 shrink-0 overflow-hidden bg-stone-100"
          style={{ height: "72px" }}
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
        </div>

        {/* Details */}
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

          {/* Qty + actions row */}
          <div className="flex items-center gap-2 mt-2">
            {/* Quantity stepper */}
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

            {/* Edit → navigates to product page */}
            <button
              onClick={() => onEdit(item.productId)}
              className="flex items-center gap-1 text-[9px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="h-2.5 w-2.5" />
              Edit
            </button>

            {/* Delete */}
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
        <div className="flex items-center justify-between bg-accent/40 border border-border/60 px-3 py-2 ml-7">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] tracking-wide text-muted-foreground">
              Also available on
            </span>
            <span className="text-[9px] tracking-widest uppercase font-semibold">
              {otherStore}
            </span>
            {otherStore === "Noon" && item.noonPrice && (
              <span className="text-[9px] text-muted-foreground">
                · {item.noonPrice}
              </span>
            )}
            {otherStore === "Amazon" && item.amazonPrice && (
              <span className="text-[9px] text-muted-foreground">
                · {item.amazonPrice}
              </span>
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
  selectedKeys,
  onToggleSelect,
  onRemove,
  onUpdateQty,
  onSwitchStore,
  onEdit,
}: {
  storeName: string;
  items: BasketItem[];
  selectedKeys: Set<string>;
  onToggleSelect: (key: string) => void;
  onRemove: (key: string) => void;
  onUpdateQty: (key: string, qty: number) => void;
  onSwitchStore: (item: BasketItem) => void;
  onEdit: (productId: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const meta = STORE_META[storeName] ?? STORE_META.Other;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const storeTotal = items.every((i) => i.numericPrice !== null)
    ? items.reduce((s, i) => s + (i.numericPrice ?? 0) * i.quantity, 0)
    : null;
  const currencySymbol =
    items[0]?.displayPrice?.match(/[^\d.,\s]/)?.[0] ?? "";

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
              {currencySymbol}
              {storeTotal.toFixed(2)}
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
                isSelected={selectedKeys.has(item.key)}
                onToggleSelect={onToggleSelect}
                onRemove={onRemove}
                onUpdateQty={onUpdateQty}
                onSwitchStore={onSwitchStore}
                onEdit={onEdit}
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
    clearBasket,
    totalItems,
    currentMemberUsername,
    currentMemberName,
  } = useBasket();

  const { toast } = useToast();
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  // Selection state — keys of checked items
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const shareUrl = shareToken
    ? `${window.location.origin}${BASE}/basket/${shareToken}`
    : null;

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const deleteSelected = () => {
    selectedKeys.forEach((key) => removeItem(key));
    setSelectedKeys(new Set());
  };

  // Edit → close basket, navigate to product page.
  // User picks a new variant there and uses the real Add to Basket button.
  // The original variant stays untouched in the basket.
  const handleEdit = (productId: number) => {
    closeBasket();
    navigate(`/product/${productId}`);
  };

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

  const selectedCount = selectedKeys.size;

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
            {selectedCount > 0 ? (
              <button
                onClick={deleteSelected}
                className="text-[9px] tracking-widest uppercase text-destructive hover:text-destructive/80 transition-colors px-2 py-1 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete ({selectedCount})
              </button>
            ) : (
              items.length > 0 && (
                <button
                  onClick={clearBasket}
                  className="text-[9px] tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
                >
                  {t("basket.clearAll")}
                </button>
              )
            )}
            <button
              onClick={closeBasket}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Selection banner */}
        {selectedCount > 0 && (
          <div className="px-5 py-2 bg-accent/40 border-b border-border flex items-center justify-between shrink-0">
            <span className="text-[9px] tracking-widest uppercase text-muted-foreground">
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-[9px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          </div>
        )}

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
                  selectedKeys={selectedKeys}
                  onToggleSelect={toggleSelect}
                  onRemove={removeItem}
                  onUpdateQty={updateQty}
                  onSwitchStore={handleSwitchStore}
                  onEdit={handleEdit}
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
                    {sharing
                      ? t("basket.generatingLink")
                      : t("basket.shareBasket")}
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
                            <span className="text-green-600">
                              {t("basket.copied")}
                            </span>
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
