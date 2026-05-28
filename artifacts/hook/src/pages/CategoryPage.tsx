import { useListProducts } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";

interface CategoryPageProps {
  category: "women" | "men" | "electronics" | "home";
}

const CATEGORY_DETAILS = {
  women: {
    title: "Women's Collection",
    description: "Refined essentials and statement pieces. A study in quiet confidence.",
  },
  men: {
    title: "Men's Collection",
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

export default function CategoryPage({ category }: CategoryPageProps) {
  const { data: products, isLoading } = useListProducts({ category });
  const details = CATEGORY_DETAILS[category];

  return (
    <div className="pt-24 pb-32">
      <div className="container mx-auto px-4 text-center mb-20 border-b border-border pb-16">
        <h1 className="font-serif text-5xl font-light mb-6">{details.title}</h1>
        <p className="text-sm tracking-widest uppercase text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {details.description}
        </p>
      </div>

      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-accent/50 animate-pulse" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-border">
            <p className="text-sm tracking-widest text-muted-foreground uppercase">Collection coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
