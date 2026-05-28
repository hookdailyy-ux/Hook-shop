import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";

const SUBCATEGORIES: Record<string, string[]> = {
  women: ["Clothing", "Shoes", "Bags", "Watches", "Accessories"],
  men: ["Clothing", "Shoes", "Bags", "Watches", "Accessories"],
  electronics: ["Headphones", "Smart Watches", "Desk Setup", "Phone Accessories", "Gadgets"],
  home: ["Decor", "Lighting", "Mugs", "Bedroom", "Workspace"],
};

const MAIN_LINKS = [
  { href: "/shop-the-look", label: "SHOP THE LOOK", key: null },
  { href: "/women", label: "WOMEN", key: "women" },
  { href: "/men", label: "MEN", key: "men" },
  { href: "/electronics", label: "ELECTRONICS", key: "electronics" },
  { href: "/home-essentials", label: "HOME ESSENTIALS", key: "home" },
];

function DesktopNav() {
  const [location] = useLocation();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-widest">
      {MAIN_LINKS.map((link) => (
        <div
          key={link.href}
          className="relative"
          onMouseEnter={() => setHoveredKey(link.key)}
          onMouseLeave={() => setHoveredKey(null)}
        >
          <Link
            href={link.href}
            className={`transition-colors flex items-center gap-1 py-1 ${
              location.startsWith(link.href) && link.href !== "/"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
            {link.key && <ChevronDown className="h-3 w-3 opacity-60" />}
          </Link>

          {link.key && hoveredKey === link.key && (
            <div className="absolute top-full left-0 pt-2 z-50 min-w-[160px]">
              <div className="bg-background border border-border shadow-sm py-2">
                {SUBCATEGORIES[link.key].map((sub) => (
                  <Link
                    key={sub}
                    href={`${link.href}?sub=${encodeURIComponent(sub)}`}
                    className="block px-4 py-2.5 text-xs tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                  >
                    {sub.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <Link href="/" onClick={onClose} className="font-serif text-2xl tracking-widest">
          HOOK
        </Link>
        <button onClick={onClose} className="p-2 -mr-2" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {MAIN_LINKS.map((link) => (
          <div key={link.href} className="border-b border-border/50">
            <div className="flex items-center">
              <Link
                href={link.href}
                onClick={link.key ? undefined : onClose}
                className="flex-1 px-5 py-4 text-sm tracking-widest uppercase text-left"
              >
                {link.label}
              </Link>
              {link.key && (
                <button
                  onClick={() => setExpanded(expanded === link.key ? null : link.key)}
                  className="px-5 py-4"
                  aria-label={`Expand ${link.label}`}
                >
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === link.key ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
            {link.key && expanded === link.key && (
              <div className="bg-accent/20 pb-2">
                {SUBCATEGORIES[link.key!].map((sub) => (
                  <Link
                    key={sub}
                    href={`${link.href}?sub=${encodeURIComponent(sub)}`}
                    onClick={onClose}
                    className="block px-8 py-3 text-xs tracking-widest text-muted-foreground hover:text-foreground uppercase"
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="px-5 py-4 mt-4">
          <Link
            href="/admin"
            onClick={onClose}
            className="text-xs tracking-widest text-muted-foreground hover:text-foreground uppercase"
          >
            Admin Dashboard
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl md:text-2xl tracking-widest font-semibold">
            HOOK
          </Link>

          <DesktopNav />

          <div className="flex items-center gap-4">
            <Link href="/admin" className="hidden md:block text-[10px] tracking-widest text-muted-foreground hover:text-foreground transition-colors uppercase">
              Admin
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -mr-2"
              aria-label="Open menu"
              data-testid="button-menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}

      <main className="flex-1 w-full">
        {children}
      </main>

      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          <div>
            <Link href="/" className="font-serif text-2xl tracking-widest font-semibold inline-block mb-4">
              HOOK
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Curated essentials for the modern lifestyle. Quality over algorithmic noise.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold tracking-widest uppercase mb-5">Categories</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/women" className="hover:text-foreground transition-colors">Women</Link></li>
              <li><Link href="/men" className="hover:text-foreground transition-colors">Men</Link></li>
              <li><Link href="/electronics" className="hover:text-foreground transition-colors">Electronics</Link></li>
              <li><Link href="/home-essentials" className="hover:text-foreground transition-colors">Home Essentials</Link></li>
              <li><Link href="/shop-the-look" className="hover:text-foreground transition-colors">Shop The Look</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold tracking-widest uppercase mb-5">Follow</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">TikTok</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pinterest</a></li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-5 border-t border-border text-[10px] text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© {new Date().getFullYear()} HOOK. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground transition-colors tracking-widest uppercase">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors tracking-widest uppercase">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
