import { PlaceholderImage } from "./PlaceholderImage";
import { HeartButton } from "./HeartButton";
import type { Setup, Product } from "@workspace/api-client-react";

interface SetupCardProps {
  setup: Setup;
}

function getDeliveryLabel(source?: string | null, category?: string): string {
  if (source === "Amazon") return "Delivered by Amazon";
  if (category === "electronics") return "Delivered by Amazon";
  return "Delivered by SHEIN";
}

function SetupProductCard({ product }: { product: Product }) {
  return (
    <div className="flex flex-col" data-testid={`setup-item-${product.id}`}>
      <div className="aspect-[4/5] bg-[#ddd5c8] overflow-hidden mb-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#ddd5c8] flex items-center justify-center">
            <span className="text-[9px] tracking-widest uppercase text-[#8b7355]/50">No Image</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {product.brand && (
          <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{product.brand}</p>
        )}
        <p className="text-xs font-medium leading-snug line-clamp-2">{product.title}</p>
        <p className="text-sm font-medium mt-0.5">{product.price || "TBA"}</p>
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block w-full text-center bg-[#2a2318] text-[#f0ebe3] text-[10px] tracking-widest uppercase py-3 hover:opacity-90 transition-opacity"
          data-testid={`button-order-${product.id}`}
        >
          Order Now
        </a>
        <p className="text-[9px] text-center text-muted-foreground mt-1 tracking-wide">
          {getDeliveryLabel(product.source, product.category)}
        </p>
      </div>
    </div>
  );
}

export function SetupCard({ setup }: SetupCardProps) {
  const hasProducts = setup.products && setup.products.length > 0;
  const itemsId = `setup-items-${setup.id}`;

  return (
    <section data-testid={`card-setup-${setup.id}`}>

      {/* ── Hero Image + Details ── */}
      <div className="flex flex-col md:flex-row md:gap-12 md:items-start">

        {/* Setup image */}
        <div className="w-full md:w-[42%] shrink-0 relative">
          {setup.imageUrl ? (
            <img
              src={setup.imageUrl}
              alt={setup.title}
              className="w-full object-cover"
              style={{ aspectRatio: "3/4", maxHeight: "78dvh" }}
              loading="lazy"
            />
          ) : (
            <div
              className="w-full bg-[#ddd5c8] flex items-center justify-center"
              style={{ aspectRatio: "3/4", maxHeight: "78dvh" }}
            >
              <PlaceholderImage aspectRatio="tall" className="w-full h-full" />
            </div>
          )}
          {/* Heart button */}
          <div className="absolute top-3 right-3">
            <HeartButton
              item={{
                id: setup.id,
                type: "setup",
                title: setup.title,
                imageUrl: setup.imageUrl,
              }}
            />
          </div>
        </div>

        {/* Setup details */}
        <div className="flex-1 min-w-0 pt-7 md:pt-2 md:sticky md:top-24 md:self-start">
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-3">Setup</p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4">
            {setup.title}
          </h2>
          {setup.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-7 max-w-sm">
              {setup.description}
            </p>
          )}

          <a
            href={`#${itemsId}`}
            className="block w-full md:inline-block md:w-auto text-center bg-[#2a2318] text-[#f0ebe3] text-xs tracking-[0.25em] uppercase px-10 py-4 hover:opacity-90 transition-opacity"
          >
            Shop The Setup
          </a>

          {hasProducts && (
            <p className="text-[10px] text-muted-foreground tracking-wide mt-3">
              {setup.products!.length} item{setup.products!.length !== 1 ? "s" : ""} included
            </p>
          )}
        </div>
      </div>

      {/* ── This Setup Includes ── */}
      <div id={itemsId} className="mt-12 md:mt-16 scroll-mt-24">
        <div className="flex items-center gap-4 mb-6">
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground shrink-0">
            This Setup Includes
          </p>
          <div className="flex-1 h-px bg-border" />
        </div>

        {hasProducts ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {setup.products!.map((product) => (
                <SetupProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-border flex flex-col items-center gap-3">
              <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground">
                Complete the setup
              </p>
              <a
                href={`#${itemsId}`}
                className="block w-full md:w-auto md:inline-block text-center border border-[#2a2318] text-[#2a2318] text-xs tracking-[0.25em] uppercase px-12 py-4 hover:bg-[#2a2318] hover:text-[#f0ebe3] transition-colors"
              >
                Shop Complete Setup
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground tracking-wide py-10 text-center border border-dashed border-border">
            No items added yet.
          </p>
        )}
      </div>
    </section>
  );
}
