import { Heart } from "lucide-react";
import { Link } from "wouter";
import { useFavorites, type FavoriteProduct, type FavoriteLook, type FavoriteSetup } from "@/contexts/FavoritesContext";
import { HeartButton } from "@/components/HeartButton";
import { useTranslation } from "react-i18next";

function FavoriteProductCard({ item }: { item: FavoriteProduct }) {
  const { t } = useTranslation();
  const deliveryLabel = item.source === "Amazon" || item.category === "electronics"
    ? t("product.deliveredByAmazon")
    : t("product.deliveredByShein");
  return (
    <div className="flex flex-col group">
      <div className="relative overflow-hidden aspect-[3/4] bg-[#ddd5c8] mb-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#ddd5c8] flex items-center justify-center">
            <span className="text-[9px] tracking-widest uppercase text-[#8b7355]/50">{t("common.noImage")}</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <HeartButton item={item} />
        </div>
      </div>
      <Link href={`/product/${item.id}`} className="text-sm font-medium leading-snug line-clamp-2 hover:underline decoration-1 underline-offset-4 mb-1">
        {item.title}
      </Link>
      {item.price && <p className="text-sm font-medium mb-3">{item.price}</p>}
      <a
        href={item.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-[#2a2318] text-[#f0ebe3] text-[10px] tracking-widest uppercase py-3 hover:opacity-90 transition-opacity"
      >
        Order Now
      </a>
      <p className="text-[9px] text-center text-muted-foreground mt-1.5 tracking-wide">{deliveryLabel}</p>
    </div>
  );
}

function FavoriteLookCard({ item }: { item: FavoriteLook }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col group">
      <div className="relative overflow-hidden aspect-[3/4] bg-[#ddd5c8] mb-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#ddd5c8] flex items-center justify-center">
            <span className="text-[9px] tracking-widest uppercase text-[#8b7355]/50">{t("favorites.outfit")}</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <HeartButton item={item} />
        </div>
      </div>
      <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-1">{t("favorites.outfit")}</p>
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-3">{item.title}</p>
      <Link
        href="/shop-the-look"
        className="block w-full text-center border border-[#2a2318] text-[#2a2318] text-[10px] tracking-widest uppercase py-3 hover:bg-[#2a2318] hover:text-[#f0ebe3] transition-colors"
      >
        {t("shopTheLook.title")}
      </Link>
    </div>
  );
}

function FavoriteSetupCard({ item }: { item: FavoriteSetup }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col group">
      <div className="relative overflow-hidden aspect-[3/4] bg-[#ddd5c8] mb-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#ddd5c8] flex items-center justify-center">
            <span className="text-[9px] tracking-widest uppercase text-[#8b7355]/50">{t("favorites.setup")}</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <HeartButton item={item} />
        </div>
      </div>
      <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-1">{t("favorites.setup")}</p>
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-3">{item.title}</p>
      <Link
        href="/shop-the-setup"
        className="block w-full text-center border border-[#2a2318] text-[#2a2318] text-[10px] tracking-widest uppercase py-3 hover:bg-[#2a2318] hover:text-[#f0ebe3] transition-colors"
      >
        {t("shopTheSetup.title")}
      </Link>
    </div>
  );
}

export default function Favorites() {
  const { favorites } = useFavorites();
  const { t } = useTranslation();
  const products = favorites.filter((f) => f.type === "product") as FavoriteProduct[];
  const looks = favorites.filter((f) => f.type === "look") as FavoriteLook[];
  const setups = favorites.filter((f) => f.type === "setup") as FavoriteSetup[];

  return (
    <div className="pb-32">
      <div className="container mx-auto px-4 sm:px-6 pt-10 pb-8 md:pt-14 md:pb-12 border-b border-border mb-12">
        <h1 className="font-serif text-4xl md:text-6xl font-light mb-2">{t("favorites.title")}</h1>
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          {favorites.length === 0
            ? "Nothing saved yet"
            : `${favorites.length} saved item${favorites.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {favorites.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-border">
            <Heart className="h-10 w-10 mx-auto text-muted-foreground/25 mb-5" strokeWidth={1} />
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">{t("favorites.empty")}</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mb-8">
              Tap the heart icon on any product, outfit, or setup to save it here.
            </p>
            <Link
              href="/"
              className="inline-block text-[10px] tracking-widest uppercase border border-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              {t("hero.cta")}
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            {products.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground shrink-0">
                    Products — {products.length}
                  </p>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8">
                  {products.map((item) => (
                    <FavoriteProductCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {looks.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground shrink-0">
                    Outfits — {looks.length}
                  </p>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {looks.map((item) => (
                    <FavoriteLookCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {setups.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground shrink-0">
                    Setups — {setups.length}
                  </p>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {setups.map((item) => (
                    <FavoriteSetupCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
