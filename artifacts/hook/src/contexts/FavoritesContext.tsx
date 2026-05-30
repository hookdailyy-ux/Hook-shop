import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type FavoriteProduct = {
  id: number;
  type: "product";
  title: string;
  price?: string | null;
  imageUrl?: string | null;
  affiliateUrl: string;
  category: string;
  source?: string | null;
};

export type FavoriteLook = {
  id: number;
  type: "look";
  title: string;
  imageUrl?: string | null;
};

export type FavoriteItem = FavoriteProduct | FavoriteLook;

interface FavoritesContextType {
  favorites: FavoriteItem[];
  count: number;
  isFavorited: (id: number, type: "product" | "look") => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);
const STORAGE_KEY = "hook_favorites_v1";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // storage full — ignore
    }
  }, [favorites]);

  const isFavorited = (id: number, type: "product" | "look") =>
    favorites.some((f) => f.id === id && f.type === type);

  const toggleFavorite = (item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id && f.type === item.type);
      return exists
        ? prev.filter((f) => !(f.id === item.id && f.type === item.type))
        : [...prev, item];
    });
  };

  return (
    <FavoritesContext.Provider value={{ favorites, count: favorites.length, isFavorited, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
