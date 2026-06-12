import { useListSetups } from "@workspace/api-client-react";
import { useSiteImages } from "@/hooks/useSiteImages";
import { SetupCard } from "@/components/SetupCard";
import { useTranslation } from "react-i18next";
import type { Setup } from "@workspace/api-client-react";

function SetupSkeleton() {
  return (
    <div>
      <div className="w-full aspect-[3/4] bg-accent/50 animate-pulse" style={{ maxHeight: "80dvh" }} />
      <div className="mt-8 space-y-3 text-center">
        <div className="h-3 w-16 bg-accent/50 animate-pulse mx-auto" />
        <div className="h-8 w-64 bg-accent/50 animate-pulse mx-auto" />
      </div>
      <div className="mt-10">
        <div className="h-px bg-accent/50 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] bg-accent/50 animate-pulse mb-3" />
              <div className="h-3 w-3/4 bg-accent/50 animate-pulse mb-1.5" />
              <div className="h-3 w-1/2 bg-accent/50 animate-pulse mb-3" />
              <div className="h-10 bg-accent/50 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupMiniCard({ setup }: { setup: Setup }) {
  return (
    <a
      href={`#setup-${setup.id}`}
      className="group flex flex-col gap-3"
      data-testid={`setup-mini-card-${setup.id}`}
    >
      <div className="relative aspect-[3/4] bg-[#e8e0d4] overflow-hidden">
        {setup.imageUrl ? (
          <img
            src={setup.imageUrl}
            alt={setup.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] tracking-widest uppercase text-muted-foreground/50">No Image</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-xs font-medium leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
          {setup.title}
        </p>
        {(setup.products?.length ?? 0) > 0 && (
          <p className="text-[10px] text-muted-foreground tracking-wide">
            {setup.products!.length} {setup.products!.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>
    </a>
  );
}

export default function ShopTheSetup() {
  const { data: setups, isLoading } = useListSetups();
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

      {/* ── Setups list ── */}
      <div className="container mx-auto px-4 sm:px-6 mt-12">
        {isLoading ? (
          <div className="space-y-20">
            <SetupSkeleton />
            <div className="border-t border-border pt-20"><SetupSkeleton /></div>
          </div>
        ) : !setups || setups.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-border">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">{t("shopTheSetup.empty")}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {setups.map((setup, idx) => (
              <div
                key={setup.id}
                id={`setup-${setup.id}`}
                className={`py-16 md:py-24 scroll-mt-20 ${idx < setups.length - 1 ? "border-b border-border" : ""}`}
              >
                <SetupCard setup={setup} />
              </div>
            ))}
          </div>
        )}

        {/* ── You May Also Like ── */}
        {setups && setups.length > 1 && (
          <div className="mt-24 pt-16 border-t border-border">
            <h2 className="font-serif text-2xl md:text-3xl font-light mb-10">
              {t("product.youMayAlsoLike")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8">
              {setups.slice(0, 4).map((setup) => (
                <SetupMiniCard key={setup.id} setup={setup} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
