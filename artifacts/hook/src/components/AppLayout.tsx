import { ReactNode, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown, Heart, ShoppingBag } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useBasket } from "@/contexts/BasketContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const toggle = () => {
    const next = isAr ? "en" : "ar";
    void i18n.changeLanguage(next);
    try { localStorage.setItem("hook_lang", next); } catch { /* ignore */ }
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = next;
  };

  return (
    <button
      onClick={toggle}
      className="shrink-0 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors px-1 py-2"
      title={isAr ? "Switch to English" : "التبديل إلى العربية"}
      data-testid="language-switcher"
    >
      {isAr ? "EN" : "عر"}
    </button>
  );
}

function NavDropdown({
  label,
  items,
  isActive,
}: {
  label: string;
  items: { href: string; label: string }[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className={`flex items-center gap-1 transition-colors uppercase text-[11px] font-medium tracking-widest ${
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[180px] bg-background border border-border/60 shadow-sm z-50">
          <div className="py-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clothesOpen, setClothesOpen] = useState(false);
  const [accessoriesOpen, setAccessoriesOpen] = useState(false);
  const [location] = useLocation();
  const { count } = useFavorites();
  const { totalItems, openBasket } = useBasket();
  const { data: siteSettings } = useSiteSettings();
  const footerLinks = siteSettings?.footerLinks ?? [];
  const whatsappNumber = siteSettings?.whatsappNumber ?? "";
  const whatsappText = siteSettings?.whatsappText || "Contact Us";
  const whatsappMessage = siteSettings?.whatsappMessage ?? "";
  const { t } = useTranslation();

  const clothesItems = [
    { href: "/women", label: t("nav.women") },
    { href: "/men", label: t("nav.men") },
    { href: "/shop-the-look", label: t("nav.shopTheLook") },
  ];

  const accessoriesItems = [
    { href: "/accessories", label: t("nav.allAccessories") },
    { href: "/accessories?gender=women", label: t("nav.womenAccessories") },
    { href: "/accessories?gender=men", label: t("nav.menAccessories") },
  ];

  const isClothesActive =
    location.startsWith("/women") ||
    location.startsWith("/men") ||
    location.startsWith("/shop-the-look");

  const isAccessoriesActive = location.startsWith("/accessories");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="px-5 md:px-8 h-14 md:h-16 flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="font-serif text-xl md:text-2xl tracking-widest font-semibold shrink-0">
            HOOK
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-[11px] font-medium tracking-widest">
            <Link
              href="/"
              className={`transition-colors uppercase ${location === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t("nav.home")}
            </Link>
            <NavDropdown label={t("nav.fashion")} items={clothesItems} isActive={isClothesActive} />
            <NavDropdown label={t("nav.accessories")} items={accessoriesItems} isActive={isAccessoriesActive} />
            <Link
              href="/electronics"
              className={`transition-colors uppercase ${location.startsWith("/electronics") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t("nav.electronics")}
            </Link>
            <Link
              href="/home-essentials"
              className={`transition-colors uppercase ${location.startsWith("/home-essentials") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t("nav.homeEssentials")}
            </Link>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Favorites icon */}
          <Link
            href="/favorites"
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Favorites"
            data-testid="nav-favorites"
          >
            <Heart className="h-5 w-5" strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#2a2318] text-[#f0ebe3] text-[9px] font-semibold flex items-center justify-center px-0.5 leading-none">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {/* Basket icon */}
          <button
            onClick={openBasket}
            aria-label="Open basket"
            className="relative p-2 -mr-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-green-600 text-white text-[9px] font-semibold flex items-center justify-center px-0.5 leading-none">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -mr-2"
            aria-label="Open menu"
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center px-5 py-4 border-b border-border">
            <Link href="/" onClick={() => setMobileOpen(false)} className="font-serif text-xl tracking-widest font-semibold">
              HOOK
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <LanguageSwitcher />
              <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <nav className="flex flex-col py-2 overflow-y-auto flex-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="px-5 py-4 text-sm tracking-widest uppercase border-b border-border/50 hover:text-foreground text-muted-foreground transition-colors"
            >
              {t("nav.home")}
            </Link>

            {/* Fashion accordion */}
            <button
              onClick={() => setClothesOpen((v) => !v)}
              className="px-5 py-4 text-sm tracking-widest uppercase border-b border-border/50 text-muted-foreground flex items-center justify-between"
            >
              {t("nav.fashion")}
              <ChevronDown className={`h-4 w-4 transition-transform ${clothesOpen ? "rotate-180" : ""}`} strokeWidth={2} />
            </button>
            {clothesOpen && (
              <>
                {clothesItems.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="pl-9 pr-5 py-3.5 text-sm tracking-widest uppercase border-b border-border/30 text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {/* Accessories accordion */}
            <button
              onClick={() => setAccessoriesOpen((v) => !v)}
              className="px-5 py-4 text-sm tracking-widest uppercase border-b border-border/50 text-muted-foreground flex items-center justify-between"
            >
              {t("nav.accessories")}
              <ChevronDown className={`h-4 w-4 transition-transform ${accessoriesOpen ? "rotate-180" : ""}`} strokeWidth={2} />
            </button>
            {accessoriesOpen && (
              <>
                {accessoriesItems.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="pl-9 pr-5 py-3.5 text-sm tracking-widest uppercase border-b border-border/30 text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {[
              { href: "/electronics", label: t("nav.electronics") },
              { href: "/home-essentials", label: t("nav.homeEssentials") },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-5 py-4 text-sm tracking-widest uppercase border-b border-border/50 hover:text-foreground text-muted-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Favorites */}
            <Link
              href="/favorites"
              onClick={() => setMobileOpen(false)}
              className="px-5 py-4 text-sm tracking-widest uppercase border-b border-border/50 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-3"
            >
              <Heart className="h-4 w-4" strokeWidth={1.5} />
              {t("favorites.title")}
              {count > 0 && (
                <span className="ml-auto min-w-[20px] h-5 bg-[#2a2318] text-[#f0ebe3] text-[9px] font-semibold flex items-center justify-center px-1">
                  {count}
                </span>
              )}
            </Link>

            {/* Basket */}
            <button
              onClick={() => { setMobileOpen(false); openBasket(); }}
              className="px-5 py-4 text-sm tracking-widest uppercase border-b border-border/50 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-3 w-full text-left"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
              {t("basket.title")}
              {totalItems > 0 && (
                <span className="ml-auto min-w-[20px] h-5 bg-green-600 text-white text-[9px] font-semibold flex items-center justify-center px-1">
                  {totalItems}
                </span>
              )}
            </button>
          </nav>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 w-full">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-2xl">
          <div>
            <Link href="/" className="font-serif text-2xl tracking-widest font-semibold inline-block mb-4">
              HOOK
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-[10px] tracking-widest uppercase transition-colors"
                data-testid="whatsapp-button"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {whatsappText}
              </a>
            )}
          </div>
          {footerLinks.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold tracking-widest uppercase mb-5">{t("footer.follow")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {footerLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[10px] text-muted-foreground/60">© {new Date().getFullYear()} HOOK. {t("footer.copyright")}</p>
            <div className="flex items-center gap-6">
              <Link href="/team/login" className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-wide">
                Team
              </Link>
              <Link href="/admin" className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-wide" data-testid="link-admin-footer">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
