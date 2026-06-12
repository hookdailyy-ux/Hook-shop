import { useState } from "react";
import { X, ShoppingBag, Minus, Plus, Check, Loader2, ExternalLink } from "lucide-react";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { HeartButton } from "@/components/HeartButton";
import { useBasket, inferStore, type AddItemInput } from "@/contexts/BasketContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

// ── Color utilities ────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f0", beige: "#d4b896", cream: "#f5f0e8",
  sand: "#c2a882", camel: "#c19a6b", khaki: "#c3b091", navy: "#1b2a4a",
  olive: "#6b7645", grey: "#888888", gray: "#888888", indigo: "#3a4a7a",
  natural: "#d4c4a0", oat: "#e8dcc8", slate: "#708090", cognac: "#9b4e2f",
  tan: "#d2b48c", stone: "#8b8680", "light blue": "#aac4d8", blue: "#3a6a9a",
  brown: "#8b5e3c", "space grey": "#8a8a8a", silver: "#c0c0c0",
  "matte white": "#f0ede8", "matte black": "#2a2a2a",
};
function getColorHex(name: string): string {
  return COLOR_MAP[name.toLowerCase()] ?? "#d4b896";
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface QuickViewProduct {
  id: number;
  title: string;
  imageUrl: string | null;
  price: string | null;
  brand: string | null;
  affiliateUrl: string;
  category: string;
  source?: string | null;
}

interface Props {
  product: QuickViewProduct;
  /** Context info for basket attribution */
  sourceMemberId?: number;
  sourceMemberUsername?: string;
  sourceMemberName?: string;
  sourceContext?: "store" | "collection" | "look";
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickViewModal({
  product,
  sourceMemberId = 0,
  sourceMemberUsername = "",
  sourceMemberName = "",
  sourceContext = "look",
  onClose,
}: Props) {
  const { addItem, openBasket } = useBasket();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: fullProduct, isLoading } = useGetProduct(product.id, {
    query: {
      enabled: !!product.id,
      queryKey: getGetProductQueryKey(product.id),
    },
  });

  const sizes = Array.isArray(fullProduct?.sizes) ? (fullProduct.sizes as string[]) : [];
  const colors = Array.isArray(fullProduct?.colors) ? (fullProduct.colors as string[]) : [];
  const description = fullProduct?.description ?? null;
  const isElectronics = fullProduct?.category === "electronics" || product.category === "electronics";
  const isAmazon = product.source === "Amazon" || (product.source == null && inferStore(product.affiliateUrl) === "Amazon");
  const deliveryLabel = isElectronics || isAmazon
    ? t("product.deliveredByAmazon")
    : t("product.deliveredByShein");

  const handleAdd = () => {
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
      displayPrice: product.price,
      affiliateUrl: product.affiliateUrl,
      brand: product.brand,
      size: selectedSize,
      color: selectedColor,
      productSource,
      noonUrl: null,
      amazonUrl: null,
      noonPrice: null,
      amazonPrice: null,
      sourceMemberId,
      sourceMemberUsername,
      sourceMemberName,
      sourceContext,
      sourceToken: null,
    };
    addItem(input, qty);

    toast({ title: "Added to basket" });
    setAdded(true);
    setTimeout(() => {
      onClose();
      openBasket();
    }, 600);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="relative w-full sm:max-w-3xl bg-background shadow-2xl overflow-hidden sm:max-h-[90vh] flex flex-col sm:flex-row animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-1.5 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Left: Image */}
          <div className="w-full sm:w-[44%] shrink-0 bg-[#e8e0d4] relative">
            <div className="aspect-[3/4] sm:h-full sm:aspect-auto relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/20" strokeWidth={1} />
                </div>
              )}
              {/* Heart button */}
              <div className="absolute top-3 left-3">
                <HeartButton
                  item={{
                    id: product.id,
                    type: "product",
                    title: product.title,
                    imageUrl: product.imageUrl,
                    affiliateUrl: product.affiliateUrl,
                    category: product.category,
                    source: product.source,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 sm:p-8 space-y-5 pb-8">
              {/* Brand + Title */}
              <div>
                {product.brand && (
                  <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5">
                    {product.brand}
                  </p>
                )}
                <h2 className="font-serif text-2xl sm:text-3xl font-light leading-tight">
                  {product.title}
                </h2>
                {product.price && (
                  <p className="text-lg font-semibold mt-2">{product.price}</p>
                )}
              </div>

              {/* Description */}
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading details…
                </div>
              ) : description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              ) : null}

              {/* Colors */}
              {!isLoading && colors.length > 0 && (
                <div>
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2.5">
                    Color{selectedColor ? ` — ${selectedColor}` : <span className="text-destructive"> *</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => { setSelectedColor(selectedColor === color ? null : color); setError(null); }}
                        title={color}
                        className={`w-7 h-7 transition-all ${
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
                    Size{selectedSize ? ` — ${selectedSize}` : <span className="text-destructive"> *</span>}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => { setSelectedSize(selectedSize === size ? null : size); setError(null); }}
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
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-2.5">Quantity</p>
                  <div className="flex items-center border border-border w-fit">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm w-10 text-center font-medium">{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && <p className="text-xs text-destructive">{error}</p>}

              {/* CTA */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAdd}
                  disabled={added || isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-foreground text-background text-xs tracking-widest uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {added ? (
                    <><Check className="h-3.5 w-3.5" />Added!</>
                  ) : (
                    <><ShoppingBag className="h-3.5 w-3.5" />Add to Basket</>
                  )}
                </button>

                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 border border-border text-xs tracking-widest uppercase py-3 text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on Store
                </a>
              </div>

              {/* Delivery label */}
              <p className="text-[9px] text-center text-muted-foreground tracking-wide pt-1">
                {deliveryLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
