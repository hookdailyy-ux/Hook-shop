import { Link } from "wouter";
import { ShoppingBag } from "lucide-react";
import { PlaceholderImage } from "./PlaceholderImage";
import { HeartButton } from "./HeartButton";
import type { Product } from "@workspace/api-client-react";
import { useBasket } from "@/contexts/BasketContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function trackDirectEvent(productId: number, eventType: "click" | "add_to_basket") {
  void fetch(`${BASE}/api/analytics/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType: "product", entityId: productId, eventType }),
  });
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, openBasket } = useBasket();

  const handleAddToBasket = (e: React.MouseEvent) => {
    e.preventDefault();
    trackDirectEvent(product.id, "add_to_basket");
    addItem({
      productId: product.id,
      productTitle: product.title,
      productImageUrl: product.imageUrl ?? null,
      displayPrice: product.price ?? null,
      affiliateUrl: product.affiliateUrl,
      brand: product.brand ?? null,
      size: null,
      color: null,
      sourceMemberId: 0,
      sourceMemberUsername: "",
      sourceMemberName: "HOOK",
      sourceContext: "store",
      sourceToken: null,
    });
    openBasket();
  };

  return (
    <div className="group flex flex-col gap-3" data-testid={`card-product-${product.id}`}>
      <div className="relative overflow-hidden bg-accent">
        <Link href={`/product/${product.id}`} className="block">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <PlaceholderImage aspectRatio="portrait" />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 md:block hidden">
            <button
              className="w-full bg-background/90 text-foreground text-xs tracking-widest uppercase py-3 backdrop-blur-sm border border-border/50 flex items-center justify-center gap-2"
              onClick={handleAddToBasket}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Basket
            </button>
          </div>
        </Link>

        <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
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

      <div className="flex flex-col gap-1 px-0.5">
        {product.brand && (
          <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
            {product.brand}
          </p>
        )}
        <Link
          href={`/product/${product.id}`}
          className="text-sm leading-snug hover:underline decoration-1 underline-offset-4 line-clamp-2"
        >
          {product.title}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm font-medium">{product.price || "TBA"}</p>
          {product.originalPrice && (
            <p className="text-xs text-muted-foreground line-through">{product.originalPrice}</p>
          )}
        </div>
        <button
          className="mt-2 w-full text-xs tracking-widest uppercase py-3 border border-foreground bg-foreground text-background md:hidden flex items-center justify-center gap-2"
          onClick={handleAddToBasket}
          data-testid={`button-shop-${product.id}`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Add to Basket
        </button>
      </div>
    </div>
  );
}
