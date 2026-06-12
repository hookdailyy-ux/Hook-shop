import { useState } from "react";
import { X, ShoppingBag, Check, Loader2, ExternalLink } from "lucide-react";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { HeartButton } from "@/components/HeartButton";
import { useBasket, inferStore, type AddItemInput } from "@/contexts/BasketContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
  sourceMemberId?: number;
  sourceMemberUsername?: string;
  sourceMemberName?: string;
  sourceContext?: "store" | "collection" | "look";
  /** When true, shows ORDER NOW link instead of Add to Basket (for basket quick-view) */
  fromBasket?: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickViewModal({
  product,
  sourceMemberId = 0,
  sourceMemberUsername = "",
  sourceMemberName = "",
  sourceContext = "look",
  fromBasket = false,
  onClose,
}: Props) {
  const { addItem, openBasket } = useBasket();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [added, setAdded] = useState(false);

  const { data: fullProduct, isLoading } = useGetProduct(product.id, {
    query: {
      enabled: !!product.id,
      queryKey: getGetProductQueryKey(product.id),
    },
  });

  const sizes = Array.isArray(fullProduct?.sizes) ? (fullProduct.sizes as string[]) : [];
  const description = fullProduct?.description ?? null;
  const isElectronics = fullProduct?.category === "electronics" || product.category === "electronics";
  const isAmazon = product.source === "Amazon" || (product.source == null && inferStore(product.affiliateUrl) === "Amazon");
  const deliveryLabel = isElectronics || isAmazon
    ? t("product.deliveredByAmazon")
    : t("product.deliveredByShein");

  const handleAdd = () => {
    const productSource = product.source ?? inferStore(product.affiliateUrl);
    const input: AddItemInput = {
      productId: product.id,
      productTitle: product.title,
      productImageUrl: product.imageUrl,
      displayPrice: product.price,
      affiliateUrl: product.affiliateUrl,
      brand: product.brand,
      size: null,
      color: null,
      productSource,
      amazonUrl: null,
      amazonPrice: null,
      sourceMemberId,
      sourceMemberUsername,
      sourceMemberName,
      sourceContext,
      sourceToken: null,
    };
    addItem(input, 1);
    toast({ title: "Added to basket" });
    setAdded(true);
    setTimeout(() => {
      onClose();
      openBasket();
    }, 700);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, right panel on desktop */}
      <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-stretch sm:justify-end">
        <div className="pointer-events-auto w-full sm:w-[360px] bg-background shadow-2xl flex flex-col max-h-[88vh] sm:max-h-full overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4 duration-300">

          {/* Header: title + close */}
          <div className="flex items-start justify-between gap-4 p-5 pb-1">
            <div className="flex-1 min-w-0">
              {product.brand && (
                <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
                  {product.brand}
                </p>
              )}
              <h2 className="font-serif text-xl sm:text-2xl font-light leading-tight">
                {product.title}
              </h2>
              {product.price && (
                <p className="text-base font-semibold mt-1">{product.price}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Product image */}
          <div className="mx-5 mt-4 bg-[#e8e0d4] relative overflow-hidden">
            <div className="aspect-[4/3] relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
                </div>
              )}
            </div>
            {/* Heart on image */}
            <div className="absolute top-2 right-2">
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

          {/* Details */}
          <div className="p-5 flex flex-col gap-4 pb-8">
            {/* Description */}
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading…
              </div>
            ) : description ? (
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            ) : null}

            {/* Sizes — display only */}
            {!isLoading && sizes.length > 0 && (
              <div>
                <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                  {t("product.size")}
                </p>
                <p className="text-sm text-foreground tracking-wide">
                  {sizes.join(" · ")}
                </p>
              </div>
            )}

            {/* Add to Basket — or ORDER NOW when opened from basket */}
            {fromBasket ? (
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-foreground text-background text-xs tracking-widest uppercase py-4 hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Order Now
              </a>
            ) : (
              <>
                <button
                  onClick={handleAdd}
                  disabled={added}
                  className="w-full flex items-center justify-center gap-2 bg-foreground text-background text-xs tracking-widest uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {added ? (
                    <><Check className="h-3.5 w-3.5" />Added!</>
                  ) : (
                    <><ShoppingBag className="h-3.5 w-3.5" />Add to Basket</>
                  )}
                </button>

                {/* View on Store */}
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on Store
                </a>
              </>
            )}

            {/* Delivery label */}
            <p className="text-[9px] text-center text-muted-foreground tracking-wide">
              {deliveryLabel}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
