import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface SiteSettings {
  heroImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  discoverMoreUrl: string;
}

export function useSiteSettings() {
  return useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/site-settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json() as Promise<SiteSettings>;
    },
    staleTime: 5 * 60 * 1000,
  });
}
