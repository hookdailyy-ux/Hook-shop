import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const SITE_IMAGE_KEYS = ["hero", "women", "men", "sport", "accessories", "home", "electronics", "look", "setup"] as const;
export type SiteImageKey = (typeof SITE_IMAGE_KEYS)[number];

export interface SiteImage {
  imageUrl: string;
  posX: number;
  posY: number;
  scale: number;
  objectFit?: "cover" | "contain";
}

export type SiteImagesMap = Partial<Record<SiteImageKey, SiteImage>>;

const QUERY_KEY = ["site-images"];

export function useSiteImages() {
  return useQuery<SiteImagesMap>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/site-images`);
      if (!res.ok) throw new Error("Failed to fetch site images");
      return res.json() as Promise<SiteImagesMap>;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpsertSiteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, data }: { key: SiteImageKey; data: SiteImage }) => {
      const res = await fetch(`${BASE}/api/site-images/${key}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save image");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteSiteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: SiteImageKey) => {
      const res = await fetch(`${BASE}/api/site-images/${key}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete image");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
