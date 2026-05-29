import { useListSetups } from "@workspace/api-client-react";
import { SetupCard } from "@/components/SetupCard";

export default function ShopTheSetup() {
  const { data: setups, isLoading } = useListSetups();

  return (
    <div className="pb-32">
      <div className="container mx-auto px-4 sm:px-6 pt-12 pb-10 md:pt-16 md:pb-14 border-b border-border mb-14">
        <h1 className="font-serif text-4xl md:text-6xl font-light mb-3">Shop The Setup</h1>
        <p className="text-xs tracking-widest uppercase text-muted-foreground max-w-md leading-relaxed">
          Every room, every desk, every kitchen — fully curated and shoppable.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="space-y-24">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="h-8 w-48 bg-accent/50 animate-pulse mb-4" />
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-2/5 aspect-[2/3] bg-accent/50 animate-pulse" />
                  <div className="flex-1 space-y-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex gap-4">
                        <div className="w-20 h-24 bg-accent/50 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-3/4 bg-accent/50 animate-pulse" />
                          <div className="h-3 w-1/2 bg-accent/50 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !setups || setups.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-border">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">No setups yet. Check back soon.</p>
          </div>
        ) : (
          <div>
            {setups.map((setup) => (
              <div key={setup.id} className="border-b border-border pb-24 mb-24 last:border-0 last:mb-0 last:pb-0">
                <SetupCard setup={setup} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
