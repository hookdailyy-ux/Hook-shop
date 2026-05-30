import { PlaceholderImage } from "./PlaceholderImage";
import type { Look } from "@workspace/api-client-react";

interface LookCardProps {
  look: Look;
}

function getDeliveryLabel(category: string): string {
  if (category === "electronics") return "Delivered by Amazon";
  return "Delivered by SHEIN";
}

export function LookCard({ look }: LookCardProps) {
  return (
    <section className="mb-24 last:mb-0" data-testid={`card-look-${look.id}`}>
      <div className="mb-6 md:mb-8">
        <h2 className="font-serif text-3xl md:text-4xl font-light mb-2">{look.title}</h2>
        {look.description && (
          <p className="text-sm text-muted-foreground tracking-wide max-w-md">{look.description}</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        <div className="w-full md:w-2/5 shrink-0">
          {look.imageUrl ? (
            <img
              src={look.imageUrl}
              alt={look.title}
              className="w-full aspect-[2/3] object-cover"
            />
          ) : (
            <PlaceholderImage aspectRatio="tall" className="w-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-5 border-b border-border pb-4">
            Items In This Look
          </p>
          {look.products && look.products.length > 0 ? (
            <div className="flex flex-col gap-6">
              {look.products.map((product) => (
                <div key={product.id} className="flex gap-4 items-start group" data-testid={`look-item-${product.id}`}>
                  <div className="w-20 h-24 shrink-0 bg-accent overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-accent" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    {product.brand && (
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{product.brand}</p>
                    )}
                    <p className="text-sm font-medium line-clamp-2 leading-snug">{product.title}</p>
                    <p className="text-sm">{product.price || "TBA"}</p>
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-[10px] tracking-widest uppercase border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
                      data-testid={`button-order-${product.id}`}
                    >
                      Order Now
                    </a>
                    <p className="text-[9px] tracking-wide text-muted-foreground mt-0.5">
                      {getDeliveryLabel(product.category)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground tracking-wide">No items added yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
