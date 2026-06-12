import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetProduct, useListProducts, getGetProductQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { ProductCard } from "@/components/ProductCard";
import { HeartButton } from "@/components/HeartButton";
import { ImageGallery } from "@/components/ImageGallery";
import { useBasket, inferStore } from "@/contexts/BasketContext";
import { useTranslation } from "react-i18next";
import { ShoppingBag, Check } from "lucide-react";


export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [addedStore, setAddedStore] = useState<"Amazon" | "fashion" | null>(null);

  const {
    addItem,
    openBasket,
    currentMemberId,
    currentMemberUsername,
    currentMemberName,
  } = useBasket();

  const { data: product, isLoading } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) },
  });

  const { data: relatedProducts } = useListProducts(
    { category: product?.category ?? "women", limit: 5 },
    {
      query: {
        enabled: !!product?.category,
        queryKey: getListProductsQueryKey({ category: product?.category ?? "women", limit: 5 }),
      },
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">{t("product.loading")}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">{t("product.notFound")}</p>
      </div>
    );
  }

  const allImages: string[] = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...(Array.isArray(product.images) ? product.images.filter((img) => img !== product.imageUrl) : []),
  ];
  const hasImages = allImages.length > 0;

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const categoryPath =
    product.category === "home"
      ? "/home-essentials"
      : product.category === "electronics"
      ? "/electronics"
      : `/${product.category}`;
  const categoryLabel =
    product.category === "home"
      ? t("nav.homeEssentials")
      : product.category === "electronics"
      ? t("nav.electronics")
      : product.category === "women"
      ? t("nav.women")
      : product.category === "men"
      ? t("nav.men")
      : product.category === "accessories"
      ? t("nav.accessories")
      : (product.category as string).charAt(0).toUpperCase() + (product.category as string).slice(1);

  const deliveryLabel =
    product.source === "Amazon"
      ? t("product.deliveredByAmazon")
      : t("product.deliveredByShein");

  const isElectronics = product.category === "electronics";
  const amazonUrl = product.amazonUrl;

  const handleAddElectronics = () => {
    if (!amazonUrl) return;
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
      sourceContext: "store",
      sourceToken: null,
    });
    setAddedStore("Amazon");
    setTimeout(() => {
      setAddedStore(null);
      openBasket();
    }, 800);
  };

  return (
    <div className="pb-32">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 sm:px-6 py-4 md:py-5">
        <nav className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">{t("product.home")}</Link>
          <span>/</span>
          <Link href={categoryPath} className="hover:text-foreground transition-colors">{categoryLabel}</Link>
          {product.subcategory && (
            <>
              <span>/</span>
              <Link
                href={`${categoryPath}?sub=${encodeURIComponent(product.subcategory)}`}
                className="hover:text-foreground transition-colors"
              >
                {product.subcategory}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground line-clamp-1">{product.title}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24">

          {/* Image Gallery */}
          <div className="flex flex-col gap-3">

            <div className="flex gap-3">

              {/* Vertical thumbnail strip — desktop only */}
              {allImages.length > 1 && (
                <div className="hidden md:flex flex-col gap-2 w-[72px] shrink-0 max-h-[600px] overflow-y-auto"
                  style={{ scrollbarWidth: "thin" }}>
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-full shrink-0 overflow-hidden border-2 transition-colors ${
                        selectedImage === i
                          ? "border-foreground"
                          : "border-transparent hover:border-foreground/30"
                      }`}
                      style={{ aspectRatio: "3/4" }}
                      data-testid={`thumb-${i}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div
                className={`relative flex-1 aspect-[3/4] bg-accent overflow-hidden ${hasImages ? "cursor-zoom-in" : ""}`}
                onClick={() => hasImages && setGalleryOpen(true)}
                title={hasImages ? "Click to view full gallery" : undefined}
              >
                {hasImages ? (
                  <img
                    src={allImages[selectedImage]}
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
              <div
                className="flex md:hidden gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 overflow-hidden border-2 transition-colors ${
                      selectedImage === i
                        ? "border-foreground"
                        : "border-transparent"
                    }`}
                    style={{ width: 72, aspectRatio: "3/4" }}
                    data-testid={`thumb-mobile-${i}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col md:sticky md:top-24 md:self-start">
            {product.brand && (
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                {product.brand}
              </p>
            )}

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4">
              {product.title}
            </h1>

            {!isElectronics && (
              <div className="flex items-baseline gap-3 mb-6">
                <p className="text-xl font-medium">{product.price || "TBA"}</p>
                {product.originalPrice && (
                  <p className="text-sm text-muted-foreground line-through">{product.originalPrice}</p>
                )}
              </div>
            )}

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-7">
                {product.description}
              </p>
            )}

            {/* Sizes — display only */}
            {sizes.length > 0 && (
              <div className="mb-8">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
                  {t("product.size")}
                </p>
                <p className="text-sm text-foreground tracking-wide">
                  {sizes.join(" · ")}
                </p>
              </div>
            )}

            {/* CTA */}
            {isElectronics ? (
              amazonUrl ? (
                <div className="border border-border p-5 flex flex-col">
                  <p className="text-[10px] tracking-widest uppercase font-semibold mb-4">Amazon</p>
                  <div className="flex-1 min-h-[3.5rem] flex items-center mb-4">
                    {product.amazonPrice && (
                      <p className="text-2xl font-medium tracking-tight">{product.amazonPrice}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddElectronics()}
                    className="w-full border border-foreground text-foreground text-[10px] tracking-widest uppercase py-3.5 hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {addedStore === "Amazon" ? (
                      <><Check className="h-3 w-3 shrink-0" />Added!</>
                    ) : (
                      <><ShoppingBag className="h-3 w-3 shrink-0" />Add to Basket</>
                    )}
                  </button>
                  <p className="text-[9px] tracking-wide text-muted-foreground text-center mt-2.5">
                    Delivered by Amazon
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground tracking-wide text-center py-4 border border-border/40">
                  Store links not yet added
                </p>
              )
            ) : (
              <>
                {/* Validation error */}
                <button
                  onClick={() => {
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
                      sourceContext: "store",
                      sourceToken: null,
                    });
                    setAddedStore("fashion");
                    setTimeout(() => {
                      setAddedStore(null);
                      openBasket();
                    }, 800);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-foreground text-background text-xs tracking-widest uppercase py-5 hover:opacity-90 transition-opacity"
                  data-testid="button-add-to-basket"
                >
                  {addedStore === "fashion" ? (
                    <><Check className="h-4 w-4" />Added!</>
                  ) : (
                    <><ShoppingBag className="h-4 w-4" />Add to Basket</>
                  )}
                </button>
                <p className="text-[10px] text-center text-muted-foreground mt-3 tracking-wide">
                  {deliveryLabel}
                </p>
              </>
            )}

            {product.subcategory && (
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                  {categoryLabel} — {product.subcategory}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.filter((p) => p.id !== product.id).length > 0 && (
          <div className="mt-24 pt-16 border-t border-border">
            <h2 className="font-serif text-2xl md:text-3xl font-light mb-10">{t("product.youMayAlsoLike")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8">
              {relatedProducts
                .filter((p) => p.id !== product.id)
                .slice(0, 4)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </div>
        )}
      </div>

      {galleryOpen && (
        <ImageGallery
          images={allImages}
          startIndex={selectedImage}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}
