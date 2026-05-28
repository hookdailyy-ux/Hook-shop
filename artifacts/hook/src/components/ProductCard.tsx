import { Link } from "wouter";
import { PlaceholderImage } from "./PlaceholderImage";
import type { Product } from "@workspace/api-client-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group flex flex-col gap-3" data-testid={`card-product-${product.id}`}>
      <Link href={`/product/${product.id}`} className="block overflow-hidden bg-accent relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage aspectRatio="portrait" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 md:block hidden">
          <button
            className="w-full bg-background/90 text-foreground text-xs tracking-widest uppercase py-3 backdrop-blur-sm border border-border/50"
            onClick={(e) => {
              e.preventDefault();
              window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
            }}
          >
            Shop Now
          </button>
        </div>
      </Link>

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
          className="mt-2 w-full text-xs tracking-widest uppercase py-3 border border-foreground bg-foreground text-background md:hidden"
          onClick={() => window.open(product.affiliateUrl, "_blank", "noopener,noreferrer")}
          data-testid={`button-shop-${product.id}`}
        >
          Shop Now
        </button>
      </div>
    </div>
  );
}
