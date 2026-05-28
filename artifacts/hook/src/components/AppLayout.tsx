import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
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

          {/* Desktop nav — immediately beside the logo */}
          <nav className="hidden md:flex items-center gap-7 text-[11px] font-medium tracking-widest">
            <Link
              href="/"
              className={`transition-colors uppercase ${location === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Home
            </Link>
            <Link
              href="/shop-the-look"
              className={`transition-colors uppercase ${location.startsWith("/shop-the-look") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Shop The Look
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
          <nav className="flex flex-col py-4">
            {[
              { href: "/", label: "Home" },
              { href: "/shop-the-look", label: "Shop The Look" },
              { href: "/women", label: "Women" },
              { href: "/men", label: "Men" },
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
            <h4 className="text-[10px] font-semibold tracking-widest uppercase mb-5">Collections</h4>
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
