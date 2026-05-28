import { Link } from "wouter";
import { PlaceholderImage } from "./PlaceholderImage";
import type { Product } from "@workspace/api-client-react/src/generated/api.schemas";
import { Button } from "./ui/button";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group flex flex-col gap-4">
      <Link href={`/product/${product.id}`} className="block overflow-hidden bg-accent relative">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage label={product.title.substring(0, 2)} aspectRatio="portrait" />
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Button 
            className="w-full bg-background/90 text-foreground hover:bg-background backdrop-blur-sm shadow-none" 
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
            }}
          >
            Shop Now
          </Button>
        </div>
      </Link>
      
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            {product.brand && (
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
                {product.brand}
              </p>
            )}
            <Link href={`/product/${product.id}`} className="text-sm font-medium hover:underline decoration-1 underline-offset-4 line-clamp-2">
              {product.title}
            </Link>
          </div>
          <p className="text-sm font-medium shrink-0">
            {product.price ? `$${product.price}` : "TBA"}
          </p>
        </div>
      </div>
    </div>
  );
}
