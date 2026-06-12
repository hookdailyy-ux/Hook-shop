import { useState } from "react";
import { X, ShoppingBag, Minus, Plus, Check, Loader2 } from "lucide-react";
import { useBasket, inferStore, type AddItemInput } from "@/contexts/BasketContext";
import {
  useGetProduct,
  getGetProductQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { resolveImageUrl } from "@/lib/apiBase";

const COLOR_MAP: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f5f0",
  beige: "#d4b896",
  cream: "#f5f0e8",
  sand: "#c2a882",
  camel: "#c19a6b",
  khaki: "#c3b091",
  navy: "#1b2a4a",
  olive: "#6b7645",
  grey: "#888888",
  gray: "#888888",
  indigo: "#3a4a7a",
  natural: "#d4c4a0",
  oat: "#e8dcc8",
  slate: "#708090",
  cognac: "#9b4e2f",
  tan: "#d2b48c",
  stone: "#8b8680",
  "light blue": "#aac4d8",
  blue: "#3a6a9a",
  brown: "#8b5e3c",
  "space grey": "#8a8a8a",
  silver: "#c0c0c0",
  "matte white": "#f0ede8",
  "matte black": "#2a2a2a",
};

function getColorHex(name: string): string {
  return COLOR_MAP[name.toLowerCase()] ?? "#d4b896";
}

interface Props {
  product: {
    id: number;
    title: string;
    imageUrl: string | null;
    displayPrice: string | null;
    affiliateUrl: string;
    brand: string | null;
    source?: string | null;
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

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real product data to get sizes + colors
  const { data: fullProduct, isLoading } = useGetProduct(product.id, {
    query: {
      enabled: !!product.id,
      queryKey: getGetProductQueryKey(product.id),
    },
  });

  const sizes = Array.isArray(fullProduct?.sizes) ? (fullProduct.sizes as string[]) : [];
  const colors = Array.isArray(fullProduct?.colors) ? (fullProduct.colors as string[]) : [];

  const switchingStore =
    currentMemberId !== null &&
    currentMemberId !== 0 &&
    sourceMemberId !== 0 &&
    currentMemberId !== sourceMemberId;

  const handleAdd = () => {
    // Validate required variant selections
    if (sizes.length > 0 && !selectedSize) {
      setError(t("product.selectSizeFirst") || "Please select a size");
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      setError(t("product.selectColorFirst") || "Please select a color");
      return;
    }
    setError(null);

    const productSource = product.source ?? inferStore(product.affiliateUrl);
    const input: AddItemInput = {
      productId: product.id,
      productTitle: product.title,
      productImageUrl: product.imageUrl,
      displayPrice: product.displayPrice,
      affiliateUrl: product.affiliateUrl,
      brand: product.brand,
      size: selectedSize,
      color: selectedColor,
      productSource,
      amazonUrl: null,
      amazonPrice: null,
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
      <div className="relative z-10 w-full sm:max-w-sm bg-background shadow-2xl">
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
                src={resolveImageUrl(product.imageUrl)}
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

        {/* Variant selectors */}
        <div className="p-5 space-y-5 max-h-[50vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {switchingStore && (
            <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 leading-relaxed">
              Adding this will clear your current basket (from another store).
            </div>
          )}

          {/* Colors */}
          {!isLoading && colors.length > 0 && (
            <div>
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2.5">
                {t("product.color")}
                {selectedColor ? ` — ${selectedColor}` : (
                  <span className="text-destructive"> *</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(selectedColor === color ? null : color);
                      setError(null);
                    }}
                    title={color}
                    className={`w-8 h-8 transition-all ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-foreground"
                        : "ring-1 ring-border hover:ring-foreground/40"
                    }`}
                    style={{ backgroundColor: getColorHex(color) }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {!isLoading && sizes.length > 0 && (
            <div>
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2.5">
                {t("product.size")}
                {selectedSize ? ` — ${selectedSize}` : (
                  <span className="text-destructive"> *</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(selectedSize === size ? null : size);
                      setError(null);
                    }}
                    className={`min-w-[44px] h-10 px-3 text-xs tracking-widest border transition-colors ${
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

          {/* Quantity */}
          {!isLoading && (
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
                <span className="text-sm w-10 text-center font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Validation error */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        {/* Action */}
        <div className="px-5 pb-6 pt-2">
          <button
            onClick={handleAdd}
            disabled={added || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background text-xs tracking-widest uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-50"
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
          </button>
        </div>
      </div>
    </div>
  );
}
