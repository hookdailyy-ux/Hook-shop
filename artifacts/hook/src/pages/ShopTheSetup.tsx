import { useListSetups, useListLooks } from "@workspace/api-client-react";
import { useSiteImages } from "@/hooks/useSiteImages";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import type { Setup, Look } from "@workspace/api-client-react";
import { ShoppingBag } from "lucide-react";
import { resolveImageUrl } from "@/lib/apiBase";

// ── Setup card ────────────────────────────────────────────────────────────────

function SetupGridCard({ setup }: { setup: Setup }) {
  const { t } = useTranslation();
  return (
    <Link
      href={`/shop-the-setup/${setup.id}`}
      className="group flex flex-col gap-3"
      data-testid={`setup-grid-card-${setup.id}`}
    >
      <div className="relative aspect-[3/4] bg-[#e8e0d4] overflow-hidden">
        {setup.imageUrl ? (
          <img
            src={resolveImageUrl(setup.imageUrl)}
            alt={setup.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 flex items-end justify-center pb-6">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-[10px] tracking-[0.3em] uppercase bg-black/60 backdrop-blur-sm px-5 py-2.5">
            {t("hero.cta")}
          </span>
        </div>
        {(setup.products?.length ?? 0) > 0 && (
          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-[9px] tracking-widest uppercase px-2 py-1">
            {setup.products!.length} {setup.products!.length === 1 ? "item" : "items"}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground">
          {t("shopTheSetup.setup")}
        </p>
        <h3 className="font-serif text-lg font-light leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
          {setup.title}
        </h3>
      </div>
    </Link>
  );
}

// ── Look mini-card (for "You May Like") ──────────────────────────────────────

function LookMiniCard({ look }: { look: Look }) {
  return (
    <Link
      href={`/shop-the-look/${look.id}`}
      className="group flex flex-col gap-3"
      data-testid={`you-may-like-look-${look.id}`}
    >
      <div className="relative aspect-[3/4] bg-[#e8e0d4] overflow-hidden">
        {look.imageUrl ? (
          <img
            src={resolveImageUrl(look.imageUrl)}
            alt={look.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-muted-foreground/20" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground">Outfit</p>
        <h3 className="font-serif text-base font-light leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
          {look.title}
        </h3>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CarouselSkeleton() {
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shrink-0 w-[44vw] sm:w-52 max-w-[220px]">
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

export default function ShopTheSetup() {
  const { data: setups, isLoading } = useListSetups();
  const { data: looks } = useListLooks();
  const { data: siteImages } = useSiteImages();
  const sectionImage = siteImages?.setup;
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
              src={resolveImageUrl(sectionImage!.imageUrl)}
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
            {t("shopTheSetup.badge")}
          </p>
          <h1 className={`font-serif text-4xl md:text-6xl font-light mb-2 ${hasImage ? "text-white" : ""}`}>
            {t("shopTheSetup.title")}
          </h1>
          <p className={`text-xs tracking-widest uppercase max-w-sm leading-relaxed ${hasImage ? "text-white/70" : "text-muted-foreground"}`}>
            {t("shopTheSetup.description")}
          </p>
        </div>
      </div>

      {/* ── Setups carousel ── */}
      <div className="container mx-auto px-4 sm:px-6 mt-12">
        {isLoading ? (
          <CarouselSkeleton />
        ) : !setups || setups.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-border">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">{t("shopTheSetup.empty")}</p>
          </div>
        ) : (
          <div className="no-scrollbar flex gap-4 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-3">
            {setups.map((setup) => (
              <div key={setup.id} className="shrink-0 w-[44vw] sm:w-52 max-w-[220px]">
                <SetupGridCard setup={setup} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── You May Like — looks ── */}
      {looks && looks.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 mt-14 pt-10 border-t border-border">
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-6">
            You May Like
          </p>
          <div className="no-scrollbar flex gap-4 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-3">
            {looks.map((look) => (
              <div key={look.id} className="shrink-0 w-[44vw] sm:w-48 max-w-[200px]">
                <LookMiniCard look={look} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
