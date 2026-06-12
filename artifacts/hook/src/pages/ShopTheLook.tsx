import { useListLooks } from "@workspace/api-client-react";
import { useSiteImages } from "@/hooks/useSiteImages";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import type { Look } from "@workspace/api-client-react";
import { ShoppingBag } from "lucide-react";

// ── Look grid card ────────────────────────────────────────────────────────────

function LookGridCard({ look }: { look: Look }) {
  const { t } = useTranslation();
  return (
    <Link
      href={`/shop-the-look/${look.id}`}
      className="group flex flex-col gap-3"
      data-testid={`look-grid-card-${look.id}`}
    >
      {/* Portrait image */}
      <div className="relative aspect-[3/4] bg-[#e8e0d4] overflow-hidden">
        {look.imageUrl ? (
          <img
            src={look.imageUrl}
            alt={look.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 flex items-end justify-center pb-6">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-[10px] tracking-[0.3em] uppercase bg-black/60 backdrop-blur-sm px-5 py-2.5">
            {t("hero.cta")}
          </span>
        </div>
        {/* Item count badge */}
        {(look.products?.length ?? 0) > 0 && (
          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-[9px] tracking-widest uppercase px-2 py-1">
            {look.products!.length} {look.products!.length === 1 ? "item" : "items"}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground">
          {t("shopTheLook.outfit")}
        </p>
        <h3 className="font-serif text-lg font-light leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
          {look.title}
        </h3>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] bg-accent/40 animate-pulse" />
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-12 bg-accent/40 animate-pulse" />
            <div className="h-4 w-3/4 bg-accent/40 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ShopTheLook() {
  const { data: looks, isLoading } = useListLooks();
  const { data: siteImages } = useSiteImages();
  const { data: siteSettings } = useSiteSettings();
  const sectionImage = siteImages?.look;
  const discoverMoreUrl = siteSettings?.discoverMoreUrl;
  const { t } = useTranslation();
  const hasImage = !!sectionImage?.imageUrl;

  return (
    <div className="pb-24">
      {/* ── Hero ── */}
      <div
        className={`relative w-full overflow-hidden border-b border-border bg-[#e8e0d4] ${
          hasImage ? "min-h-[220px] md:min-h-[340px]" : ""
        }`}
      >
        {hasImage && (
          <>
            <img
              src={sectionImage!.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: sectionImage!.objectFit ?? "cover",
                objectPosition: `${sectionImage!.posX}% ${sectionImage!.posY}%`,
                transform: `scale(${sectionImage!.scale / 100})`,
                transformOrigin: `${sectionImage!.posX}% ${sectionImage!.posY}%`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
          </>
        )}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-20">
          <p className={`text-[10px] tracking-[0.35em] uppercase mb-2 ${hasImage ? "text-white/60" : "text-muted-foreground"}`}>
            {t("shopTheLook.badge")}
          </p>
          <h1 className={`font-serif text-4xl md:text-6xl font-light mb-2 ${hasImage ? "text-white" : ""}`}>
            {t("shopTheLook.title")}
          </h1>
          <p className={`text-xs tracking-widest uppercase max-w-sm leading-relaxed mb-5 ${hasImage ? "text-white/70" : "text-muted-foreground"}`}>
            {t("shopTheLook.description")}
          </p>
          {discoverMoreUrl && (
            <a
              href={discoverMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase border px-6 py-2.5 transition-colors ${
                hasImage
                  ? "border-white/60 text-white/80 hover:bg-white hover:text-foreground"
                  : "border-foreground/60 text-foreground/80 hover:bg-foreground hover:text-background"
              }`}
              data-testid="button-discover-more-look"
            >
              <span>✨</span>
              <span>{t("shopTheLook.exploreMore")}</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="container mx-auto px-4 sm:px-6 mt-12">
        {isLoading ? (
          <GridSkeleton />
        ) : !looks || looks.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-border">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">{t("shopTheLook.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
            {looks.map((look) => (
              <LookGridCard key={look.id} look={look} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
