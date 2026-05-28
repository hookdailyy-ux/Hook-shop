import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListProducts, useListSubcategories, getListSubcategoriesQueryKey } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";

const CATEGORY_DETAILS: Record<string, { title: string; description: string }> = {
  women: {
    title: "Women",
    description: "Refined essentials and statement pieces. A study in quiet confidence.",
  },
  men: {
    title: "Men",
    description: "Structural simplicity. Wardrobe foundations built to last.",
  },
  electronics: {
    title: "Electronics",
    description: "Design-forward technology. Form meets function.",
  },
  home: {
    title: "Home Essentials",
    description: "Objects for living. Crafted for the modern interior.",
  },
};

interface CategoryPageProps {
  category: "women" | "men" | "electronics" | "home";
}

export default function CategoryPage({ category }: CategoryPageProps) {
  const [, location] = useLocation();
  const [activeSub, setActiveSub] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get("sub");
    setActiveSub(sub);
  }, [location]);

  const { data: subcategories } = useListSubcategories(
    { category },
    { query: { queryKey: getListSubcategoriesQueryKey({ category }) } }
  );

  const { data: products, isLoading } = useListProducts({
    category,
    ...(activeSub ? { subcategory: activeSub } : {}),
  });

  const details = CATEGORY_DETAILS[category];

  return (
    <div className="pb-32">
      <div className="container mx-auto px-4 sm:px-6 pt-12 pb-10 md:pt-16 md:pb-14 border-b border-border">
        <h1 className="font-serif text-4xl md:text-6xl font-light mb-3">{details.title}</h1>
        <p className="text-xs tracking-widest uppercase text-muted-foreground max-w-md leading-relaxed">
          {details.description}
        </p>
      </div>

      {subcategories && subcategories.length > 0 && (
        <div className="border-b border-border sticky top-14 md:top-16 z-30 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6">
            <div
              className="flex gap-0 overflow-x-auto scrollbar-none -mx-4 sm:mx-0 px-4 sm:px-0"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <button
                onClick={() => setActiveSub(null)}
                className={`shrink-0 px-5 py-4 text-xs tracking-widest uppercase border-b-2 transition-colors ${
                  !activeSub
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                data-testid="filter-all"
              >
                All
              </button>
              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSub(activeSub === sub.name ? null : sub.name)}
                  className={`shrink-0 px-5 py-4 text-xs tracking-widest uppercase border-b-2 transition-colors ${
                    activeSub === sub.name
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`filter-${sub.name.toLowerCase()}`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 mt-10 md:mt-12">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-accent/50 animate-pulse" />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-border">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              {activeSub ? `No ${activeSub} products yet.` : "Collection coming soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
