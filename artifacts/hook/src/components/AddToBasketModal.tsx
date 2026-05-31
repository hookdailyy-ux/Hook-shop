import { useState } from "react";
import { X, ShoppingBag, Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBasket, type AddItemInput } from "@/contexts/BasketContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface Props {
  product: {
    id: number;
    title: string;
    imageUrl: string | null;
    displayPrice: string | null;
    affiliateUrl: string;
    brand: string | null;
  };
  sourceMemberId: number;
  sourceMemberUsername: string;
  sourceMemberName: string;
  sourceContext: "store" | "collection" | "look";
  sourceToken?: string | null;
  onClose: () => void;
}

export function AddToBasketModal({
  product,
  sourceMemberId,
  sourceMemberUsername,
  sourceMemberName,
  sourceContext,
  sourceToken,
  onClose,
}: Props) {
  const { addItem, openBasket, currentMemberId } = useBasket();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const switchingStore =
    currentMemberId !== null && currentMemberId !== sourceMemberId;

  const handleAdd = () => {
    const input: AddItemInput = {
      productId: product.id,
      productTitle: product.title,
      productImageUrl: product.imageUrl,
      displayPrice: product.displayPrice,
      affiliateUrl: product.affiliateUrl,
      brand: product.brand,
      size: size.trim() || null,
      color: color.trim() || null,
      sourceMemberId,
      sourceMemberUsername,
      sourceMemberName,
      sourceContext,
      sourceToken: sourceToken ?? null,
    };
    addItem(input, qty);

    if (switchingStore) {
      toast({
        title: `Basket updated for @${sourceMemberUsername}`,
        description: "Previous basket items were cleared.",
      });
    }

    setAdded(true);
    setTimeout(() => {
      onClose();
      openBasket();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-sm bg-background shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-medium">{t("addToBasket.title")}</span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Product preview */}
        <div className="flex gap-3 p-5 border-b border-border">
          <div className="w-14 h-16 shrink-0 overflow-hidden bg-stone-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
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
          <div className="min-w-0">
            {product.brand && (
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                {product.brand}
              </p>
            )}
            <p className="text-sm leading-snug line-clamp-2">{product.title}</p>
            {product.displayPrice && (
              <p className="text-sm font-semibold mt-0.5">{product.displayPrice}</p>
            )}
          </div>
        </div>

        {/* Variant inputs */}
        <div className="p-5 space-y-4">
          {switchingStore && (
            <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 leading-relaxed">
              Adding this will clear your current basket (from @{" "}
              {currentMemberId !== null ? "another store" : ""}).
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-widest text-muted-foreground">
                {t("addToBasket.size")} <span className="normal-case font-normal opacity-60">({t("checkout.optional")})</span>
              </label>
              <Input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder={t("addToBasket.sizePlaceholder")}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-widest text-muted-foreground">
                {t("addToBasket.color")} <span className="normal-case font-normal opacity-60">({t("checkout.optional")})</span>
              </label>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder={t("addToBasket.colorPlaceholder")}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Quantity
            </label>
            <div className="flex items-center gap-0 border border-border w-fit">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm w-10 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="px-5 pb-6">
          <Button
            onClick={handleAdd}
            disabled={added}
            className="w-full text-xs tracking-widest uppercase gap-2"
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Added!
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                {t("addToBasket.title")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
