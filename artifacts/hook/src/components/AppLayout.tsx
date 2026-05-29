import { ReactNode, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";

function ClothesDropdown({ location }: { location: string }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive =
    location.startsWith("/women") ||
    location.startsWith("/men") ||
    location.startsWith("/shop-the-look");

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`flex items-center gap-1 transition-colors uppercase text-[11px] font-medium tracking-widest ${
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Clothes
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[160px] bg-background border border-border/60 shadow-sm z-50">
          <div className="py-1">
            {[
              { href: "/women", label: "Women" },
              { href: "/men", label: "Men" },
              { href: "/shop-the-look", label: "Shop The Look" },
            ].map((item) => (
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
  const [location] = useLocation();

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
              Home
            </Link>
            <ClothesDropdown location={location} />
            <Link
              href="/electronics"
              className={`transition-colors uppercase ${location.startsWith("/electronics") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Electronics
            </Link>
            <Link
              href="/home-essentials"
              className={`transition-colors uppercase ${location.startsWith("/home-essentials") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Home Essentials
            </Link>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

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
            <button onClick={() => setMobileOpen(false)} className="ml-auto p-2 -mr-2" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col py-4 overflow-y-auto">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="px-5 py-4 text-sm tracking-widest uppercase border-b border-border/50 hover:text-foreground text-muted-foreground transition-colors"
            >
              Home
            </Link>

            <button
              onClick={() => setClothesOpen((v) => !v)}
              className="px-5 py-4 text-sm tracking-widest uppercase border-b border-border/50 text-muted-foreground flex items-center justify-between"
            >
              Clothes
              <ChevronDown className={`h-4 w-4 transition-transform ${clothesOpen ? "rotate-180" : ""}`} strokeWidth={2} />
            </button>
            {clothesOpen && (
              <>
                {[
                  { href: "/women", label: "Women" },
                  { href: "/men", label: "Men" },
                  { href: "/shop-the-look", label: "Shop The Look" },
                ].map((link) => (
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
              { href: "/electronics", label: "Electronics" },
              { href: "/home-essentials", label: "Home Essentials" },
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
              Curated essentials for the modern lifestyle. Quality over algorithmic noise.
            </p>
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

        {/* Bottom bar */}
        <div className="border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[10px] text-muted-foreground/60">© {new Date().getFullYear()} HOOK. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors tracking-widest uppercase">Privacy</a>
              <a href="#" className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors tracking-widest uppercase">Terms</a>
              {/* Discreet admin link */}
              <Link
                href="/admin"
                className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-wide"
                data-testid="link-admin-footer"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
