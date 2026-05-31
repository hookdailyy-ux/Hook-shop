import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListProducts, useListSubcategories, getListSubcategoriesQueryKey } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteImages } from "@/hooks/useSiteImages";
import type { SiteImageKey } from "@/hooks/useSiteImages";
import { useTranslation } from "react-i18next";

// To add a new SHEIN-powered section, set showDiscoverMore: true below.
// The "Explore More via SHEIN" button only appears when showDiscoverMore is true
// AND the admin has configured a SHEIN Referral URL in Settings.
const CATEGORY_META: Record<string, { titleKey: string; descKey: string; showDiscoverMore?: boolean }> = {
  women: {
    titleKey: "category.women.title",
    descKey: "category.women.description",
    showDiscoverMore: true,
  },
  men: {
    titleKey: "category.men.title",
    descKey: "category.men.description",
    showDiscoverMore: true,
  },
  electronics: {
    titleKey: "category.electronics.title",
    descKey: "category.electronics.description",
    showDiscoverMore: false,
  },
  home: {
    titleKey: "category.homeEssentials.title",
    descKey: "category.homeEssentials.description",
    showDiscoverMore: true,
  },
  accessories: {
    titleKey: "category.accessories.title",
    descKey: "category.accessories.description",
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
  const { t } = useTranslation();

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

  const meta = CATEGORY_META[category];
  const title = meta ? t(meta.titleKey) : category.charAt(0).toUpperCase() + category.slice(1);
  const description = meta ? t(meta.descKey) : "";
  const showDiscoverMore = (meta?.showDiscoverMore ?? false) && !!siteSettings?.discoverMoreUrl;

  return (
    <div className="pb-32">
      {categoryImage?.imageUrl && (
        <div className="w-full h-52 md:h-80 overflow-hidden relative">
          <img
            src={categoryImage.imageUrl}
            alt=""
            className="absolute w-full h-full"
            style={{
              objectFit: categoryImage.objectFit ?? "cover",
              objectPosition: `${categoryImage.posX}% ${categoryImage.posY}%`,
              transform: `scale(${categoryImage.scale / 100})`,
              transformOrigin: `${categoryImage.posX}% ${categoryImage.posY}%`,
            }}
          />
        </div>
      )}
      <div className="container mx-auto px-4 sm:px-6 pt-12 pb-10 md:pt-16 md:pb-14 border-b border-border">
        <h1 className="font-serif text-4xl md:text-6xl font-light mb-3">{title}</h1>
        {description && (
          <p className="text-xs tracking-widest uppercase text-muted-foreground max-w-md leading-relaxed mb-5">
            {description}
          </p>
        )}
        {showDiscoverMore && (
          <a
            href={siteSettings!.discoverMoreUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase border border-foreground/60 px-6 py-2.5 text-foreground/80 hover:bg-foreground hover:text-background transition-colors"
            data-testid="button-discover-more"
          >
            <span>✨</span>
            <span>{t("category.exploreMoreShein")}</span>
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
                {t("category.all")}
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
              {activeSub ? t("category.noProducts") : t("category.collectionComingSoon")}
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
