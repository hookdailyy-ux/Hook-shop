import { Link } from "wouter";
import { PlaceholderImage } from "./PlaceholderImage";
import type { Look } from "@workspace/api-client-react/src/generated/api.schemas";

interface LookCardProps {
  look: Look;
}

export function LookCard({ look }: LookCardProps) {
  return (
    <div className="group flex flex-col gap-4">
      <Link href={`/shop-the-look#${look.id}`} className="block overflow-hidden bg-accent relative">
        {look.imageUrl ? (
          <img 
            src={look.imageUrl} 
            alt={look.title} 
            className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage label={look.title.substring(0, 2)} aspectRatio="tall" />
        )}
      </Link>
      
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium tracking-wide uppercase">{look.title}</h3>
        {look.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{look.description}</p>
        )}
      </div>
    </div>
  );
}
