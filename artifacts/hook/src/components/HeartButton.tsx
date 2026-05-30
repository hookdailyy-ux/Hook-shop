import { Heart } from "lucide-react";
import { useFavorites, type FavoriteItem } from "@/contexts/FavoritesContext";

interface HeartButtonProps {
  item: FavoriteItem;
  className?: string;
}

export function HeartButton({ item, className = "" }: HeartButtonProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const saved = isFavorited(item.id, item.type);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(item);
      }}
      className={`flex items-center justify-center w-9 h-9 bg-background/80 backdrop-blur-sm hover:bg-background transition-all active:scale-90 ${className}`}
      aria-label={saved ? "Remove from favorites" : "Add to favorites"}
      data-testid={`heart-${item.type}-${item.id}`}
    >
      <Heart
        className={`h-[18px] w-[18px] transition-all duration-200 ${
          saved ? "fill-red-500 text-red-500 scale-110" : "text-foreground/60 hover:text-foreground"
        }`}
        strokeWidth={1.5}
      />
    </button>
  );
}
