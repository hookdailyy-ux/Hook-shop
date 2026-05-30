import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListProducts, useListSubcategories, getListSubcategoriesQueryKey } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteImages } from "@/hooks/useSiteImages";
import type { SiteImageKey } from "@/hooks/useSiteImages";

const CATEGORY_DETAILS: Record<string, { title: string; description: string; showDiscoverMore?: boolean }> = {
  women: {
    title: "Women",
    description: "Refined essentials and statement pieces. A study in quiet confidence.",
    showDiscoverMore: true,
  },
  men: {
    title: "Men",
    description: "Structural simplicity. Wardrobe foundations built to last.",
    showDiscoverMore: true,
  },
  electronics: {
    title: "Electronics",
    description: "Design-forward technology. Form meets function.",
    showDiscoverMore: false,
  },
  home: {
    title: "Home Essentials",
    description: "Objects for living. Crafted for the modern interior.",
    showDiscoverMore: true,
  },
  accessories: {
    title: "Accessories",
    description: "The finishing touch. Pieces that complete every look.",
    showDiscoverMore: true,
  },
};

interface CategoryPageProps {
  category: string;
}

export default function CategoryPage({ category }: CategoryPageProps) {
  const [, location] = useLocation();
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const { data: siteSettings } = useSiteSettings();
  const { data: siteImages } = useSiteImages();
  const categoryImage = siteImages?.[category as SiteImageKey];

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

  const details = CATEGORY_DETAILS[category] ?? {
    title: category.charAt(0).toUpperCase() + category.slice(1),
    description: "",
    showDiscoverMore: false,
  };

  const discoverMoreUrl = siteSettings?.discoverMoreUrl;
  const showDiscoverMore = details.showDiscoverMore && !!discoverMoreUrl;

  return (
    <div className="pb-32">
      {categoryImage?.imageUrl && (
        <div className="w-full h-52 md:h-80 overflow-hidden relative">
          <img
            src={categoryImage.imageUrl}
            alt=""
            className="absolute w-full h-full object-cover"
            style={{
              objectPosition: `${categoryImage.posX}% ${categoryImage.posY}%`,
              transform: `scale(${categoryImage.scale / 100})`,
              transformOrigin: `${categoryImage.posX}% ${categoryImage.posY}%`,
            }}
          />
        </div>
      )}
      <div className="container mx-auto px-4 sm:px-6 pt-12 pb-10 md:pt-16 md:pb-14 border-b border-border">
        <h1 className="font-serif text-4xl md:text-6xl font-light mb-3">{details.title}</h1>
        {details.description && (
          <p className="text-xs tracking-widest uppercase text-muted-foreground max-w-md leading-relaxed mb-5">
            {details.description}
          </p>
        )}
        {showDiscoverMore && (
          <a
            href={discoverMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[10px] tracking-[0.25em] uppercase border border-foreground/60 px-6 py-2.5 text-foreground/80 hover:bg-foreground hover:text-background transition-colors"
            data-testid="button-discover-more"
          >
            Discover More
          </a>
        )}
      </div>

      {subcategories && subcategories.length > 0 && (
        <div className="border-b border-border sticky top-14 md:top-16 z-30 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6">
            <div
              className="flex gap-0 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0"
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
                  data-testid={`filter-${sub.name.toLowerCase().replace(/\s+/g, "-")}`}
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
