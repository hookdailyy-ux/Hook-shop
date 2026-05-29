import { Link } from "wouter";
import { useListLooks, useListProducts } from "@workspace/api-client-react";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Truck, RotateCcw, ShieldCheck, Globe } from "lucide-react";

const BENEFITS = [
  { icon: Truck, label: "Free Shipping" },
  { icon: RotateCcw, label: "Easy Returns" },
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: Globe, label: "Worldwide" },
];

const ELECTRONICS_PLACEHOLDERS = [
  { label: "Headphones", abbr: "HP" },
  { label: "Smartwatches", abbr: "SW" },
  { label: "Phone Accessories", abbr: "PA" },
  { label: "Desk Setup", abbr: "DS" },
];

const HOME_PLACEHOLDERS = [
  { label: "Decor", abbr: "DC" },
  { label: "Furniture", abbr: "FN" },
  { label: "Kitchen", abbr: "KT" },
  { label: "Bedroom", abbr: "BD" },
  { label: "Organization", abbr: "OR" },
  { label: "Home Tools", abbr: "HT" },
];

export default function Home() {
  const { data: latestLooks } = useListLooks({ limit: 4 });
  const { data: electronicsProducts } = useListProducts({ category: "electronics", limit: 4 });
  const { data: homeProducts } = useListProducts({ category: "home", limit: 4 });

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative w-full min-h-[88dvh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#e8e0d4]">
        {/* Layered editorial background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #ddd5c8 0%, #e8e0d4 40%, #f0ebe3 100%)" }} />
          <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-10" style={{ background: "linear-gradient(to top, #8b7355, transparent)" }} />
          {/* subtle side panels */}
          <div className="hidden md:block absolute left-0 top-0 w-1/4 h-full bg-[#d4c9bb]/30" />
          <div className="hidden md:block absolute right-0 top-0 w-1/4 h-full bg-[#d4c9bb]/30" />
        </div>

        {/* Ghost label */}
        <p className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.35em] uppercase text-[#8b7355]/60 font-medium">
          New Collection · 2025
        </p>

        {/* Central content */}
        <div className="relative z-10 text-center px-6 flex flex-col items-center gap-6 py-20">
          <h1
            className="font-serif font-light leading-none tracking-tight"
            style={{ fontSize: "clamp(3.5rem, 13vw, 9rem)", color: "#2a2318" }}
          >
            Timeless
            <br />
            Essentials
          </h1>

          <p className="text-sm md:text-base tracking-widest uppercase text-[#6b5e4e] max-w-xs md:max-w-sm leading-relaxed">
            Curated pieces for everyday life.
          </p>

          <Link
            href="/women"
            className="mt-2 inline-block bg-[#2a2318] text-[#f0ebe3] text-xs tracking-[0.25em] uppercase px-10 py-4 hover:bg-[#3d3226] transition-colors"
          >
            Shop Now
          </Link>
        </div>

        {/* Bottom fade */}
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
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Section header */}
          <div className="flex items-end justify-between mb-10 md:mb-12">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5">Editorial</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light">Shop The Look</h2>
            </div>
            <Link
              href="/shop-the-look"
              className="text-[10px] tracking-[0.2em] uppercase border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity"
            >
              View All
            </Link>
          </div>

          {/* 4-card grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {latestLooks && latestLooks.length > 0
              ? latestLooks.slice(0, 4).map((look) => (
                  <HomeLookCard
                    key={look.id}
                    title={look.title}
                    href="/shop-the-look"
                    imageUrl={look.imageUrl ?? undefined}
                  />
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <HomeLookCard
                    key={i}
                    title={["Weekend Casual", "Office Ready", "Evening Edit", "Street Style"][i]}
                    href="/shop-the-look"
                  />
                ))}
          </div>
        </div>
      </section>

      {/* ── Electronics ── */}
      <section className="py-16 md:py-24 bg-[#f5f0e8]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10 md:mb-12">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5">Tech</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light">Electronics</h2>
            </div>
            <Link
              href="/electronics"
              className="text-[10px] tracking-[0.2em] uppercase border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {electronicsProducts && electronicsProducts.length > 0
              ? electronicsProducts.slice(0, 4).map((product) => (
                  <HomeProductCard
                    key={product.id}
                    title={product.title}
                    price={product.price ?? undefined}
                    imageUrl={product.imageUrl ?? undefined}
                    href={`/product/${product.id}`}
                  />
                ))
              : ELECTRONICS_PLACEHOLDERS.map((item) => (
                  <HomePlaceholderCard
                    key={item.label}
                    label={item.label}
                    abbr={item.abbr}
                    href="/electronics"
                  />
                ))}
          </div>
        </div>
      </section>

      {/* ── Home Essentials ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10 md:mb-12">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5">Living</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light">Home Essentials</h2>
            </div>
            <Link
              href="/home-essentials"
              className="text-[10px] tracking-[0.2em] uppercase border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {homeProducts && homeProducts.length > 0
              ? homeProducts.slice(0, 4).map((product) => (
                  <HomeProductCard
                    key={product.id}
                    title={product.title}
                    price={product.price ?? undefined}
                    imageUrl={product.imageUrl ?? undefined}
                    href={`/product/${product.id}`}
                  />
                ))
              : HOME_PLACEHOLDERS.map((item) => (
                  <HomePlaceholderCard
                    key={item.label}
                    label={item.label}
                    abbr={item.abbr}
                    href="/home-essentials"
                  />
                ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-20 md:py-28 bg-[#2a2318] text-[#f0ebe3]">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#8b7355] mb-3">Stay in the loop</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">The Hook Edit</h2>
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

function HomeProductCard({
  title,
  price,
  imageUrl,
  href,
}: {
  title: string;
  price?: string;
  imageUrl?: string;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden aspect-[3/4] bg-[#ddd5c8] mb-3 md:mb-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border border-[#8b7355]/30 flex items-center justify-center">
              <span className="text-[10px] tracking-widest text-[#8b7355]/60 uppercase">New</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="block w-full text-center bg-[#2a2318]/85 text-[#f0ebe3] text-[10px] tracking-[0.2em] uppercase py-2.5 backdrop-blur-sm">
            View Product
          </span>
        </div>
      </div>
      <p className="text-sm font-medium leading-snug tracking-wide group-hover:underline decoration-1 underline-offset-4 transition-all line-clamp-2">
        {title}
      </p>
      {price && (
        <p className="text-[11px] text-muted-foreground mt-1 tracking-wide">{price}</p>
      )}
    </Link>
  );
}

function HomePlaceholderCard({
  label,
  abbr,
  href,
}: {
  label: string;
  abbr: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block relative overflow-hidden aspect-[3/4] bg-[#ddd5c8]"
    >
      <div className="absolute inset-0 flex items-end justify-start p-5 md:p-6">
        <div>
          <p
            className="font-serif font-light leading-none text-[#2a2318] opacity-[0.08] absolute top-4 right-4 select-none pointer-events-none"
            style={{ fontSize: "clamp(3rem, 8vw, 5rem)" }}
          >
            {abbr}
          </p>
          <h3 className="font-serif text-xl md:text-2xl font-light text-[#2a2318]">{label}</h3>
          <span className="block mt-2 text-[10px] tracking-[0.2em] uppercase text-[#6b5e4e] group-hover:underline underline-offset-4 transition-all">
            Shop Now
          </span>
        </div>
      </div>
      <div className="absolute inset-0 bg-[#2a2318]/0 group-hover:bg-[#2a2318]/5 transition-colors duration-500" />
    </Link>
  );
}

function HomeLookCard({
  title,
  href,
  imageUrl,
}: {
  title: string;
  href: string;
  imageUrl?: string;
}) {
  return (
    <Link href={href} className="group block" data-testid={`card-look-home-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      {/* Image area */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#ddd5c8] mb-3 md:mb-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border border-[#8b7355]/30 flex items-center justify-center">
              <span className="text-[10px] tracking-widest text-[#8b7355]/60 uppercase">Look</span>
            </div>
          </div>
        )}
        {/* hover CTA overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="block w-full text-center bg-[#2a2318]/85 text-[#f0ebe3] text-[10px] tracking-[0.2em] uppercase py-2.5 backdrop-blur-sm">
            Shop Now
          </span>
        </div>
      </div>

      {/* Card footer */}
      <p className="text-sm font-medium leading-snug tracking-wide group-hover:underline decoration-1 underline-offset-4 transition-all">
        {title}
      </p>
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">Shop Now</p>
    </Link>
  );
}
