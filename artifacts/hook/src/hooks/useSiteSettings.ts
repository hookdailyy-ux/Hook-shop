import { useQuery } from "@tanstack/react-query";

const BASE = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");

export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export interface SiteSettings {
  heroImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  discoverMoreUrl: string;
  footerLinks: FooterLink[];
  whatsappText: string;
  whatsappNumber: string;
  whatsappMessage: string;
  faviconUrl: string;
  appleTouchIconUrl: string;
  pwaIcon192Url: string;
  pwaIcon512Url: string;
  sheinGeneralUrl: string;
  amazonGeneralUrl: string;
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
