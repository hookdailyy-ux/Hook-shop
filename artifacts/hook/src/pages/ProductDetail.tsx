import { useParams } from "wouter";
import { useGetProduct, useListProducts, getGetProductQueryKey } from "@workspace/api-client-react";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: product, isLoading } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) }
  });

  const { data: relatedProducts } = useListProducts({ 
    category: product?.category, 
    limit: 4 
  }, {
    query: { enabled: !!product?.category }
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm tracking-widest uppercase">Loading...</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center text-sm tracking-widest uppercase">Product not found</div>;
  }

  return (
    <div className="pt-12 pb-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 mb-32">
          {/* Images */}
          <div className="flex flex-col gap-4">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="w-full aspect-[3/4] object-cover"
              />
            ) : (
              <PlaceholderImage label={product.title.substring(0, 2)} aspectRatio="portrait" />
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center sticky top-24 self-start">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">
              {product.brand || "HOOK Collection"}
            </p>
            <h1 className="font-serif text-4xl lg:text-5xl font-light mb-6">{product.title}</h1>
            <p className="text-2xl font-light mb-8">
              {product.price ? `$${product.price}` : "TBA"}
              {product.originalPrice && (
                <span className="ml-4 text-muted-foreground line-through text-lg">${product.originalPrice}</span>
              )}
            </p>

            <div className="prose prose-sm text-muted-foreground max-w-none mb-12 font-serif text-lg leading-relaxed">
              {product.description || "A curated piece from our latest collection. Exclusively selected for its quality, form, and timeless appeal."}
            </div>

            <Button 
              size="lg" 
              className="w-full rounded-none uppercase tracking-widest text-xs h-14"
              onClick={() => window.open(product.affiliateUrl, "_blank", "noopener,noreferrer")}
            >
              Shop Now
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-wider">
              You will be redirected to the retailer's website to complete your purchase.
            </p>
          </div>
        </div>

        {/* Related */}
        {relatedProducts && relatedProducts.length > 1 && (
          <div className="pt-24 border-t border-border">
            <h2 className="font-serif text-3xl font-light mb-12 text-center">More from this Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.filter(p => p.id !== product.id).slice(0, 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
