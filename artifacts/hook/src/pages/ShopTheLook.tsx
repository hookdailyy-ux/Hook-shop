import { useListLooks } from "@workspace/api-client-react";
import { LookCard } from "@/components/LookCard";

export default function ShopTheLook() {
  const { data: looks, isLoading } = useListLooks();

  return (
    <div className="pt-24 pb-32">
      <div className="container mx-auto px-4 text-center mb-20">
        <h1 className="font-serif text-5xl font-light mb-6">Shop The Look</h1>
        <p className="text-sm tracking-widest uppercase text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Curated editorial looks. Complete the ensemble with handpicked pieces chosen by our stylists.
        </p>
      </div>

      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-accent/50 animate-pulse" />
            ))}
          </div>
        ) : looks?.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-border">
            <p className="text-sm tracking-widest text-muted-foreground uppercase">No looks found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {looks?.map((look) => (
              <LookCard key={look.id} look={look} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
