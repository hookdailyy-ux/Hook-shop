import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/shop-the-look", label: "SHOP THE LOOK" },
    { href: "/women", label: "WOMEN" },
    { href: "/men", label: "MEN" },
    { href: "/electronics", label: "ELECTRONICS" },
    { href: "/home-essentials", label: "HOME ESSENTIALS" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-none">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] border-r-border bg-background p-0 rounded-none flex flex-col">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <Link href="/" onClick={() => setIsOpen(false)} className="text-2xl font-serif font-semibold tracking-widest">
                    HOOK
                  </Link>
                </div>
                <nav className="flex flex-col flex-1 py-6 px-4 gap-2">
                  {links.map((link) => (
                    <Link 
                      key={link.href}
                      href={link.href} 
                      onClick={() => setIsOpen(false)}
                      className={`px-4 py-3 text-sm font-medium tracking-wide transition-colors hover:bg-accent/50 ${
                        location === link.href ? "text-foreground bg-accent/30" : "text-muted-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  <div className="mt-auto pt-6 border-t border-border">
                    <Link 
                      href="/admin" 
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors flex"
                    >
                      ADMIN DASHBOARD
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="text-2xl font-serif font-semibold tracking-widest">
              HOOK
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
            {links.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`transition-colors ${
                  location === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/admin" className="text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              ADMIN
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[2000px] mx-auto">
        {children}
      </main>

      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-4 py-16 flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <Link href="/" className="text-3xl font-serif font-semibold tracking-widest mb-4 inline-block">
              HOOK
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Curated essentials for the modern lifestyle. Handpicked quality over endless algorithmic noise.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
            <div>
              <h4 className="text-sm font-semibold tracking-widest mb-4">CATEGORIES</h4>
              <ul className="space-y-3 text-sm text-muted-foreground flex flex-col">
                <Link href="/women" className="hover:text-foreground transition-colors">Women</Link>
                <Link href="/men" className="hover:text-foreground transition-colors">Men</Link>
                <Link href="/home-essentials" className="hover:text-foreground transition-colors">Home</Link>
                <Link href="/electronics" className="hover:text-foreground transition-colors">Tech</Link>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-widest mb-4">SOCIAL</h4>
              <ul className="space-y-3 text-sm text-muted-foreground flex flex-col">
                <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
                <a href="#" className="hover:text-foreground transition-colors">TikTok</a>
                <a href="#" className="hover:text-foreground transition-colors">Pinterest</a>
              </ul>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 border-t border-border text-xs text-muted-foreground flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} HOOK. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
