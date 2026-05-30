import { useListSetups } from "@workspace/api-client-react";
import { useSiteImages } from "@/hooks/useSiteImages";
import { SetupCard } from "@/components/SetupCard";

function SetupSkeleton() {
  return (
    <div>
      <div className="w-full md:w-[42%] aspect-[3/4] bg-accent/50 animate-pulse" style={{ maxHeight: "78dvh" }} />
      <div className="mt-6 space-y-3">
        <div className="h-3 w-16 bg-accent/50 animate-pulse" />
        <div className="h-8 w-64 bg-accent/50 animate-pulse" />
        <div className="h-3 w-80 bg-accent/50 animate-pulse" />
        <div className="h-3 w-60 bg-accent/50 animate-pulse" />
        <div className="h-12 w-48 bg-accent/50 animate-pulse mt-4" />
      </div>
      <div className="mt-12">
        <div className="h-px bg-accent/50 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] bg-accent/50 animate-pulse mb-3" />
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

export default function ShopTheSetup() {
  const { data: setups, isLoading } = useListSetups();
  const { data: siteImages } = useSiteImages();
  const sectionImage = siteImages?.setup;

  return (
    <div className="pb-24">
      {sectionImage?.imageUrl && (
        <div className="w-full h-52 md:h-80 overflow-hidden relative">
          <img
            src={sectionImage.imageUrl}
            alt=""
            className="absolute w-full h-full object-cover"
            style={{
              objectPosition: `${sectionImage.posX}% ${sectionImage.posY}%`,
              transform: `scale(${sectionImage.scale / 100})`,
              transformOrigin: `${sectionImage.posX}% ${sectionImage.posY}%`,
            }}
          />
        </div>
      )}
      {/* Page header */}
      <div className="container mx-auto px-4 sm:px-6 pt-10 pb-8 md:pt-14 md:pb-12 border-b border-border mb-12">
        <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-2">Interiors</p>
        <h1 className="font-serif text-4xl md:text-6xl font-light mb-2">Shop The Setup</h1>
        <p className="text-xs tracking-widest uppercase text-muted-foreground max-w-sm leading-relaxed">
          Every room, every desk, every kitchen — fully curated and shoppable.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="space-y-20">
            <SetupSkeleton />
            <div className="border-t border-border pt-20">
              <SetupSkeleton />
            </div>
          </div>
        ) : !setups || setups.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-border">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">No setups yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {setups.map((setup, idx) => (
              <div
                key={setup.id}
                className={`py-16 md:py-24 ${idx < setups.length - 1 ? "border-b border-border" : ""}`}
              >
                <SetupCard setup={setup} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
