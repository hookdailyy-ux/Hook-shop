import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

function setOrCreateLink(id: string, rel: string, href: string, sizes?: string) {
  if (!href) return;
  const existing = document.getElementById(id) as HTMLLinkElement | null;
  if (existing) {
    existing.href = href;
  } else {
    const link = document.createElement("link");
    link.id = id;
    link.rel = rel;
    link.href = href;
    if (sizes) link.setAttribute("sizes", sizes);
    document.head.appendChild(link);
  }
}

export function HeadManager() {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;
    if (settings.faviconUrl) setOrCreateLink("dyn-favicon", "icon", settings.faviconUrl);
    if (settings.appleTouchIconUrl) setOrCreateLink("dyn-apple-touch-icon", "apple-touch-icon", settings.appleTouchIconUrl);
    if (settings.pwaIcon192Url) setOrCreateLink("dyn-icon-192", "icon", settings.pwaIcon192Url, "192x192");
    if (settings.pwaIcon512Url) setOrCreateLink("dyn-icon-512", "icon", settings.pwaIcon512Url, "512x512");
  }, [settings?.faviconUrl, settings?.appleTouchIconUrl, settings?.pwaIcon192Url, settings?.pwaIcon512Url]);

  return null;
}
