import { Link } from "wouter";
import { useListProducts, useListLooks } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { LookCard } from "@/components/LookCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: trendingProducts } = useListProducts({ trending: true, limit: 8 });
  const { data: dailyEssentials } = useListProducts({ featured: true, limit: 4 });
  const { data: latestLooks } = useListLooks({ limit: 4 });

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] w-full flex items-center justify-center bg-gradient-to-br from-accent/50 to-background overflow-hidden">
        <div className="absolute inset-0 z-0">
          <PlaceholderImage label="HERO EDITORIAL" aspectRatio="video" className="h-full w-full object-cover" />
        </div>
        <div className="relative z-10 text-center max-w-3xl px-4 py-24 bg-background/30 backdrop-blur-sm border border-border/20">
          <h1 className="font-serif text-5xl md:text-7xl mb-6 font-light">The New Standard</h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase mb-10 max-w-md mx-auto leading-relaxed">
            Curated pieces for a life well-lived. Discover the essential collection.
          </p>
          <Button asChild size="lg" className="rounded-none uppercase tracking-widest text-xs px-12 h-14">
            <Link href="/women">Explore Collection</Link>
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-border">
        {[
          { label: "Women", href: "/women" },
          { label: "Men", href: "/men" },
          { label: "Electronics", href: "/electronics" },
          { label: "Home", href: "/home-essentials" },
        ].map((cat) => (
          <Link key={cat.label} href={cat.href} className="group relative aspect-square md:aspect-auto md:h-96 overflow-hidden border-r last:border-r-0 border-border">
            <PlaceholderImage label={cat.label.substring(0, 2)} aspectRatio="square" className="h-full w-full" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-500 flex items-center justify-center">
              <span className="text-white font-serif text-3xl font-light tracking-wide">{cat.label}</span>
            </div>
          </Link>
        ))}
      </section>

      {/* Trending Products */}
      <section className="py-24 container mx-auto px-4 border-b border-border">
        <div className="flex items-end justify-between mb-16">
          <h2 className="font-serif text-4xl font-light">Trending Now</h2>
          <Link href="/women" className="text-xs tracking-widest uppercase border-b border-border pb-1 hover:border-foreground transition-colors">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trendingProducts?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
          {!trendingProducts?.length && (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-accent/50 animate-pulse" />
            ))
          )}
        </div>
      </section>

      {/* Shop The Look */}
      <section className="py-24 bg-accent/20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <h2 className="font-serif text-4xl font-light">Shop The Look</h2>
            <Link href="/shop-the-look" className="text-xs tracking-widest uppercase border-b border-border pb-1 hover:border-foreground transition-colors">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {latestLooks?.map(look => (
              <LookCard key={look.id} look={look} />
            ))}
          </div>
        </div>
      </section>

      {/* Daily Essentials */}
      <section className="py-24 container mx-auto px-4 border-b border-border">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-light mb-4">Daily Essentials</h2>
          <p className="text-sm text-muted-foreground tracking-widest uppercase">The pieces we reach for every day</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {dailyEssentials?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-32 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-light mb-6">The Hook Newsletter</h2>
          <p className="text-muted text-sm tracking-widest uppercase mb-12 max-w-md mx-auto">
            A weekly curation of style, space, and culture. Delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto filter invert">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
