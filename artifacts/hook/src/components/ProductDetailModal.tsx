import { useState } from "react";
import { X, ShoppingBag, Check } from "lucide-react";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { HeartButton } from "@/components/HeartButton";
import { ImageGallery } from "@/components/ImageGallery";
import { useBasket, inferStore } from "@/contexts/BasketContext";
import { useTranslation } from "react-i18next";
import { resolveImageUrl } from "@/lib/apiBase";

function cssColor(name: string): string {
  const n = name.toLowerCase().trim();
  const map: Record<string, string> = {
    black: "#1a1a1a", white: "#f5f5f5", red: "#dc2626", blue: "#2563eb",
    navy: "#1e3a5f", "navy blue": "#1e3a5f", "dark blue": "#1e3a5f",
    green: "#16a34a", "dark green": "#14532d", yellow: "#ca8a04",
    orange: "#ea580c", pink: "#ec4899", purple: "#9333ea",
    "light purple": "#c084fc", lavender: "#c4b5fd", lilac: "#c084fc",
    brown: "#92400e", beige: "#d4b896", grey: "#6b7280", gray: "#6b7280",
    "light gray": "#d1d5db", "light grey": "#d1d5db", charcoal: "#374151",
    silver: "#94a3b8", gold: "#b45309", cream: "#fdf8f0", ivory: "#faf5eb",
    camel: "#c19a6b", tan: "#d2b48c", nude: "#d4a494", "off white": "#faf5f0",
    olive: "#4d7c0f", khaki: "#a3824b", teal: "#0d9488", turquoise: "#06b6d4",
    mint: "#6ee7b7", coral: "#f97316", rose: "#fb7185", salmon: "#fa8072",
    burgundy: "#7f1d1d", maroon: "#6b1a1a", mustard: "#d97706",
    "light blue": "#bfdbfe", "sky blue": "#7dd3fc", "baby blue": "#bfdbfe",
    "dark brown": "#451a03", "off-white": "#faf5f0",
  };
  return map[n] ?? "#e2e8f0";
}

interface ProductDetailModalProps {
  productId: number;
  onClose: () => void;
  sourceContext?: "look" | "store";
}

export function ProductDetailModal({ productId, onClose, sourceContext = "store" }: ProductDetailModalProps) {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const { addItem, openBasket, currentMemberId, currentMemberUsername, currentMemberName } = useBasket();

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) },
  });

  const allImages: string[] = product
    ? [
        ...(product.imageUrl ? [product.imageUrl] : []),
        ...(Array.isArray(product.images)
          ? product.images.filter((img) => img !== product.imageUrl)
          : []),
      ]
    : [];
  const hasImages = allImages.length > 0;
  const sizes = Array.isArray(product?.sizes) ? (product!.sizes as string[]) : [];
  const colors = Array.isArray((product as any)?.colors) ? ((product as any).colors as string[]) : [];

  const isElectronics = product?.category === "electronics";
  const amazonUrl = product?.amazonUrl;

  const deliveryName = (product as any)?.deliveredBy || product?.source || "SHEIN";
  const deliveryLabel = `Delivered by ${deliveryName}`;

  const handleAddToBasket = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      productTitle: product.title,
      productImageUrl: product.imageUrl ?? null,
      displayPrice: product.price ?? null,
      affiliateUrl: product.affiliateUrl,
      brand: product.brand ?? null,
      size: null,
      color: null,
      productSource: product.source ?? inferStore(product.affiliateUrl),
      amazonUrl: null,
      amazonPrice: null,
      sourceMemberId: currentMemberId ?? 0,
      sourceMemberUsername: currentMemberUsername ?? "",
      sourceMemberName: currentMemberName ?? "",
      sourceContext,
      sourceToken: null,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openBasket();
    }, 800);
  };

  const handleAddElectronics = () => {
    if (!product || !amazonUrl) return;
    addItem({
      productId: product.id,
      productTitle: product.title,
      productImageUrl: product.imageUrl ?? null,
      displayPrice: product.amazonPrice ?? null,
      affiliateUrl: amazonUrl,
      brand: product.brand ?? null,
      size: null,
      color: null,
      productSource: "Amazon",
      amazonUrl: product.amazonUrl ?? null,
      amazonPrice: product.amazonPrice ?? null,
      sourceMemberId: currentMemberId ?? 0,
      sourceMemberUsername: currentMemberUsername ?? "",
      sourceMemberName: currentMemberName ?? "",
      sourceContext,
      sourceToken: null,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openBasket();
    }, 800);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 z-[61] w-full sm:max-w-2xl bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
            {isLoading ? "Loading…" : (product?.brand ?? "")}
          </span>
          <button
            onClick={onClose}
            aria-label="Close product details"
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
                {t("product.loading")}
              </p>
            </div>
          ) : !product ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-xs tracking-widest uppercase text-muted-foreground">
                {t("product.notFound")}
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 pb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">

                {/* ── Image Gallery ── */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">

                    {/* Vertical thumbnails + color swatches — sm+ */}
                    {(allImages.length > 1 || colors.length > 0) && (
                      <div
                        className="hidden sm:flex flex-col gap-2 w-[56px] shrink-0 max-h-[480px] overflow-y-auto"
                        style={{ scrollbarWidth: "thin" }}
                      >
                        {allImages.length > 1 && allImages.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedImage(i)}
                            className={`w-full shrink-0 overflow-hidden border-2 transition-colors ${
                              selectedImage === i
                                ? "border-foreground"
                                : "border-transparent hover:border-foreground/30"
                            }`}
                            style={{ aspectRatio: "3/4" }}
                          >
                            <img src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}

                        {colors.length > 0 && (
                          <div className={`flex flex-col gap-2 ${allImages.length > 1 ? "mt-2 pt-2 border-t border-border/40" : ""}`}>
                            <p className="text-[8px] tracking-widest uppercase text-muted-foreground text-center">
                              Colors
                            </p>
                            {colors.map((color) => (
                              <div key={color} className="flex flex-col items-center gap-0.5" title={color}>
                                <div
                                  className="w-7 h-7 border border-border/50"
                                  style={{ backgroundColor: cssColor(color) }}
                                />
                                <span className="text-[8px] tracking-wide text-muted-foreground text-center leading-tight w-full truncate px-0.5">
                                  {color}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main image */}
                    <div
                      className={`relative flex-1 aspect-[3/4] bg-accent overflow-hidden ${hasImages ? "cursor-zoom-in" : ""}`}
                      onClick={() => hasImages && setGalleryOpen(true)}
                    >
                      {hasImages ? (
                        <img
                          src={resolveImageUrl(allImages[selectedImage])}
                          alt={product.title}
                          className="w-full h-full transition-opacity duration-200"
                          style={{
                            objectFit: (product.imageObjectFit as "cover" | "contain") ?? "cover",
                            objectPosition: `${product.imagePosX ?? 50}% ${product.imagePosY ?? 50}%`,
                          }}
                        />
                      ) : (
                        <PlaceholderImage aspectRatio="portrait" />
                      )}
                      <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                        <HeartButton
                          item={{
                            id: product.id,
                            type: "product",
                            title: product.title,
                            price: product.price,
                            imageUrl: product.imageUrl,
                            affiliateUrl: product.affiliateUrl,
                            category: product.category,
                            source: product.source,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile thumbnail row */}
                  {allImages.length > 1 && (
                    <div className="flex sm:hidden gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {allImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImage(i)}
                          className={`shrink-0 overflow-hidden border-2 transition-colors ${
                            selectedImage === i ? "border-foreground" : "border-transparent"
                          }`}
                          style={{ width: 56, aspectRatio: "3/4" }}
                        >
                          <img src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mobile color swatches */}
                  {colors.length > 0 && (
                    <div className="flex sm:hidden gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {colors.map((color) => (
                        <div key={color} className="shrink-0 flex flex-col items-center gap-1" title={color}>
                          <div
                            className="w-7 h-7 border border-border/50"
                            style={{ backgroundColor: cssColor(color) }}
                          />
                          <span className="text-[8px] tracking-wide text-muted-foreground text-center leading-tight max-w-[40px] truncate">
                            {color}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Product Info ── */}
                <div className="flex flex-col">
                  {product.brand && (
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
                      {product.brand}
                    </p>
                  )}
                  <h2 className="font-serif text-2xl sm:text-3xl font-light leading-tight mb-3">
                    {product.title}
                  </h2>

                  {!isElectronics && (
                    <div className="flex items-baseline gap-3 mb-5">
                      <p className="text-xl font-medium">{product.price || (product as any).amazonPrice || "TBA"}</p>
                      {product.originalPrice && (
                        <p className="text-sm text-muted-foreground line-through">{product.originalPrice}</p>
                      )}
                    </div>
                  )}

                  {product.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      {product.description}
                    </p>
                  )}

                  {/* Sizes */}
                  {sizes.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                        {t("product.size")}
                      </p>
                      <p className="text-sm text-foreground tracking-wide">{sizes.join(" · ")}</p>
                    </div>
                  )}

                  {/* CTA */}
                  {isElectronics ? (
                    amazonUrl ? (
                      <div className="border border-border p-4 flex flex-col">
                        <p className="text-[10px] tracking-widest uppercase font-semibold mb-3">Amazon</p>
                        {product.amazonPrice && (
                          <p className="text-2xl font-medium tracking-tight mb-3">{product.amazonPrice}</p>
                        )}
                        <button
                          onClick={handleAddElectronics}
                          className="w-full border border-foreground text-foreground text-[10px] tracking-widest uppercase py-3.5 hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2"
                        >
                          {added ? (
                            <><Check className="h-3 w-3" />Added!</>
                          ) : (
                            <><ShoppingBag className="h-3 w-3" />Add to Basket</>
                          )}
                        </button>
                        <p className="text-[9px] tracking-wide text-muted-foreground text-center mt-2">
                          {deliveryLabel}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground tracking-wide text-center py-4 border border-border/40">
                        Store links not yet added
                      </p>
                    )
                  ) : (
                    <>
                      <button
                        onClick={handleAddToBasket}
                        className="w-full flex items-center justify-center gap-2 bg-foreground text-background text-xs tracking-widest uppercase py-4 hover:opacity-90 transition-opacity"
                        data-testid={`modal-add-to-basket-${product.id}`}
                      >
                        {added ? (
                          <><Check className="h-4 w-4" />Added!</>
                        ) : (
                          <><ShoppingBag className="h-4 w-4" />Add to Basket</>
                        )}
                      </button>
                      <p className="text-[10px] text-center text-muted-foreground mt-2.5 tracking-wide">
                        {deliveryLabel}
                      </p>

                    </>
                  )}

                  {product.subcategory && (
                    <div className="mt-6 pt-5 border-t border-border">
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                        {product.category} — {product.subcategory}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {galleryOpen && (
        <ImageGallery
          images={allImages}
          startIndex={selectedImage}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}
