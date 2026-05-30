import { useListLooks } from "@workspace/api-client-react";
import { LookCard } from "@/components/LookCard";

function LookSkeleton() {
  return (
    <div>
      {/* Image skeleton */}
      <div className="w-full md:w-[42%] aspect-[3/4] bg-accent/50 animate-pulse" style={{ maxHeight: "78dvh" }} />
      {/* Details skeleton */}
      <div className="mt-6 space-y-3">
        <div className="h-3 w-16 bg-accent/50 animate-pulse" />
        <div className="h-8 w-64 bg-accent/50 animate-pulse" />
        <div className="h-3 w-80 bg-accent/50 animate-pulse" />
        <div className="h-3 w-60 bg-accent/50 animate-pulse" />
        <div className="h-12 w-48 bg-accent/50 animate-pulse mt-4" />
      </div>
      {/* Products skeleton */}
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

export default function ShopTheLook() {
  const { data: looks, isLoading } = useListLooks();

  return (
    <div className="pb-24">
      {/* Page header */}
      <div className="container mx-auto px-4 sm:px-6 pt-10 pb-8 md:pt-14 md:pb-12 border-b border-border mb-12">
        <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-2">Editorial</p>
        <h1 className="font-serif text-4xl md:text-6xl font-light mb-2">Shop The Look</h1>
        <p className="text-xs tracking-widest uppercase text-muted-foreground max-w-sm leading-relaxed">
          Complete the ensemble. Each piece handpicked, every look intentional.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="space-y-20">
            <LookSkeleton />
            <div className="border-t border-border pt-20">
              <LookSkeleton />
            </div>
          </div>
        ) : !looks || looks.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-border">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">No looks yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {looks.map((look, idx) => (
              <div
                key={look.id}
                className={`py-16 md:py-24 ${idx < looks.length - 1 ? "border-b border-border" : ""}`}
              >
                <LookCard look={look} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
