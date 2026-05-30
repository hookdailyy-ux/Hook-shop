import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetProduct, useListProducts, getGetProductQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { ProductCard } from "@/components/ProductCard";

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

function getDeliveryLabel(source?: string | null, category?: string): string {
  if (source === "Amazon") return "Delivered by Amazon";
  if (category === "electronics") return "Delivered by Amazon";
  return "Delivered by SHEIN";
}

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

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
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  const allImages: string[] = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...(Array.isArray(product.images) ? product.images.filter((img) => img !== product.imageUrl) : []),
  ];
  const hasImages = allImages.length > 0;

  const colors = Array.isArray(product.colors) ? product.colors : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const categoryPath =
    product.category === "home"
      ? "/home-essentials"
      : product.category === "electronics"
      ? "/electronics"
      : `/${product.category}`;
  const categoryLabel =
    product.category === "home"
      ? "Home Essentials"
      : product.category === "electronics"
      ? "Electronics"
      : product.category.charAt(0).toUpperCase() + product.category.slice(1);

  const deliveryLabel = getDeliveryLabel(product.source, product.category);

  return (
    <div className="pb-32">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 sm:px-6 py-4 md:py-5">
        <nav className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
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
            <div className="w-full aspect-[3/4] bg-accent overflow-hidden">
              {hasImages ? (
                <img
                  src={allImages[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PlaceholderImage aspectRatio="portrait" />
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-16 h-20 overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? "border-foreground" : "border-transparent"
                    }`}
                    data-testid={`thumb-${i}`}
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

            <div className="flex items-baseline gap-3 mb-6">
              <p className="text-xl font-medium">{product.price || "TBA"}</p>
              {product.originalPrice && (
                <p className="text-sm text-muted-foreground line-through">{product.originalPrice}</p>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-7">
                {product.description}
              </p>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
                  Color{selectedColor ? `: ${selectedColor}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                      title={color}
                      className={`w-8 h-8 transition-all ${
                        selectedColor === color
                          ? "ring-2 ring-offset-2 ring-foreground"
                          : "ring-1 ring-border hover:ring-foreground/40"
                      }`}
                      style={{ backgroundColor: getColorHex(color) }}
                      data-testid={`swatch-${color}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-8">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
                  Size{selectedSize ? `: ${selectedSize}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      className={`min-w-[44px] h-11 px-3 text-xs tracking-widest border transition-colors ${
                        selectedSize === size
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground"
                      }`}
                      data-testid={`size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-foreground text-background text-xs tracking-widest uppercase py-5 hover:opacity-90 transition-opacity block"
              data-testid="button-order-now"
            >
              Order Now
            </a>

            <p className="text-[10px] text-center text-muted-foreground mt-3 tracking-wide">
              {deliveryLabel}
            </p>

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
            <h2 className="font-serif text-2xl md:text-3xl font-light mb-10">You May Also Like</h2>
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
    </div>
  );
}
