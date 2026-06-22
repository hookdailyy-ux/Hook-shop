import { Link } from "wouter";
import { useListLooks, useListSetups } from "@workspace/api-client-react";
import { useSiteImages } from "@/hooks/useSiteImages";
import { NewsletterForm } from "@/components/NewsletterForm";
import { HeartButton } from "@/components/HeartButton";
import type { FavoriteItem } from "@/contexts/FavoritesContext";
import { Truck, RotateCcw, ShieldCheck, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resolveImageUrl } from "@/lib/apiBase";

export default function Home() {
  const { data: latestLooks } = useListLooks({ limit: 4 });
  const { data: latestSetups } = useListSetups({ limit: 4 });
  const { data: siteImages } = useSiteImages();
  const heroImage = siteImages?.hero;
  const { t } = useTranslation();

  const BENEFITS = [
    { icon: Truck, label: t("benefits.freeShipping") },
    { icon: RotateCcw, label: t("benefits.easyReturns") },
    { icon: ShieldCheck, label: t("benefits.securePayment") },
    { icon: Globe, label: t("benefits.worldwide") },
  ];

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative w-full min-h-[88dvh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#e8e0d4]">
        {heroImage ? (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={resolveImageUrl(heroImage.imageUrl)}
              alt=""
              className="absolute w-full h-full"
              style={{
                objectFit: heroImage.objectFit ?? "cover",
                objectPosition: `${heroImage.posX}% ${heroImage.posY}%`,
                transform: `scale(${heroImage.scale / 100})`,
                transformOrigin: `${heroImage.posX}% ${heroImage.posY}%`,
              }}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ) : (
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #ddd5c8 0%, #e8e0d4 40%, #f0ebe3 100%)" }} />
            <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-10" style={{ background: "linear-gradient(to top, #8b7355, transparent)" }} />
            <div className="hidden md:block absolute left-0 top-0 w-1/4 h-full bg-[#d4c9bb]/30" />
            <div className="hidden md:block absolute right-0 top-0 w-1/4 h-full bg-[#d4c9bb]/30" />
          </div>
        )}
        <p className={`absolute top-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.35em] uppercase font-medium ${heroImage ? "text-white/60" : "text-[#8b7355]/60"}`}>
          {t("hero.badge")}
        </p>
        <div className="relative z-10 text-center px-6 flex flex-col items-center gap-6 py-20">
          <h1
            className="font-serif font-light leading-none tracking-tight"
            style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", color: heroImage ? "#f5f0e8" : "#2a2318" }}
          >
            {t("hero.title1")}<br />{t("hero.title2")}
          </h1>
          <p className={`text-[11px] tracking-[0.3em] uppercase font-medium max-w-xs md:max-w-sm leading-relaxed ${heroImage ? "text-white/60" : "text-[#8b7355]/70"}`}>
            {t("hero.subtitle")}
          </p>

        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--background)))" }} />
      </section>

      {/* ── Benefits row ── */}
      <section className="border-y border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2.5 py-6 md:py-7">
                <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop The Look ── */}
      {latestLooks && latestLooks.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10 md:mb-12">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5">{t("home.editorialBadge")}</p>
                <Link href="/shop-the-look"><h2 className="font-serif text-3xl md:text-4xl font-light hover:opacity-70 transition-opacity">{t("home.shopTheLook")}</h2></Link>
              </div>
              <Link href="/shop-the-look" className="text-[10px] tracking-[0.2em] uppercase border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity">
                View All
              </Link>
            </div>
            <div className="no-scrollbar overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
              <div className="flex gap-3 w-max md:w-auto md:grid md:grid-cols-4 md:gap-5">
                {latestLooks.slice(0, 4).map((look) => (
                  <div key={look.id} className="shrink-0 w-[calc(50vw-22px)] sm:w-[calc(50vw-28px)] md:w-auto md:shrink">
                    <HomeEditorialCard
                      title={look.title}
                      href={`/shop-the-look/${look.id}`}
                      imageUrl={look.imageUrl ?? undefined}
                      label={t("shopTheLook.outfit")}
                      cta={t("hero.cta")}
                      favoriteItem={{ id: look.id, type: "look", title: look.title, imageUrl: look.imageUrl }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Shop The Setup ── */}
      {latestSetups && latestSetups.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f5f0e8]">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10 md:mb-12">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5">{t("home.interiorsBadge")}</p>
                <Link href="/shop-the-setup"><h2 className="font-serif text-3xl md:text-4xl font-light hover:opacity-70 transition-opacity">{t("home.shopTheSetup")}</h2></Link>
              </div>
              <Link href="/shop-the-setup" className="text-[10px] tracking-[0.2em] uppercase border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity">
                View All
              </Link>
            </div>
            <div className="no-scrollbar overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
              <div className="flex gap-3 w-max md:w-auto md:grid md:grid-cols-4 md:gap-5">
                {latestSetups.slice(0, 4).map((setup) => (
                  <div key={setup.id} className="shrink-0 w-[calc(50vw-22px)] sm:w-[calc(50vw-28px)] md:w-auto md:shrink">
                    <HomeEditorialCard
                      title={setup.title}
                      href={`/shop-the-setup/${setup.id}`}
                      imageUrl={setup.imageUrl ?? undefined}
                      label={t("shopTheSetup.setup")}
                      cta={t("home.shopTheSetup")}
                      favoriteItem={{ id: setup.id, type: "setup", title: setup.title, imageUrl: setup.imageUrl }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ── */}
      <section className="py-20 md:py-28 bg-[#2a2318] text-[#f0ebe3]">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#8b7355] mb-3">{t("home.newsletterBadge")}</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">{t("home.newsletterTitle")}</h2>
          <p className="text-sm text-[#b09a82] tracking-wide max-w-xs mx-auto mb-10 leading-relaxed">
            A weekly curation of style, space, and culture. Straight to your inbox.
          </p>
          <div className="max-w-sm mx-auto [&_input]:bg-transparent [&_input]:border-[#8b7355] [&_input]:text-[#f0ebe3] [&_input]:placeholder:text-[#8b7355] [&_button]:bg-[#f0ebe3] [&_button]:text-[#2a2318] [&_button]:border-0">
            <NewsletterForm />
          </div>
        </div>
      </section>

    </div>
  );
}

function HomeEditorialCard({
  title,
  href,
  imageUrl,
  label,
  cta,
  favoriteItem,
}: {
  title: string;
  href: string;
  imageUrl?: string;
  label: string;
  cta: string;
  favoriteItem?: FavoriteItem;
}) {
  return (
    <div className="group flex flex-col">
      {/* Image container — heart sits inside but stops propagation */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#ddd5c8] mb-3 md:mb-4">
        <Link href={href} className="block w-full h-full">
          {imageUrl ? (
            <img
              src={resolveImageUrl(imageUrl)}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border border-[#8b7355]/30 flex items-center justify-center">
                <span className="text-[10px] tracking-widest text-[#8b7355]/60 uppercase">{label}</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="block w-full text-center bg-[#2a2318]/85 text-[#f0ebe3] text-[10px] tracking-[0.2em] uppercase py-2.5 backdrop-blur-sm">
              {cta}
            </span>
          </div>
        </Link>

        {/* Heart button — always visible, top-right, above the image */}
        {favoriteItem && (
          <div className="absolute top-2 right-2 z-20 opacity-100">
            <HeartButton item={favoriteItem} />
          </div>
        )}
      </div>

      <Link href={href}>
        <p className="text-sm font-medium leading-snug tracking-wide group-hover:underline decoration-1 underline-offset-4 transition-all">
          {title}
        </p>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">{cta}</p>
      </Link>
    </div>
  );
}
