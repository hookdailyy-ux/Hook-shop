import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useTeamAuth } from "@/contexts/TeamAuthContext";
import {
  LayoutDashboard,
  FolderOpen,
  Layers,
  ShoppingBag,
  Gift,
  User,
  LogOut,
  X,
} from "lucide-react";

const NAV = [
  { href: "/team", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/team?page=collections", label: "My Collections", icon: FolderOpen },
  { href: "/team?page=looks", label: "My Looks", icon: Layers },
  { href: "/team?page=orders", label: "My Orders", icon: ShoppingBag },
  { href: "/team?page=rewards", label: "My Rewards", icon: Gift },
  { href: "/team?page=profile", label: "My Profile", icon: User },
];

export function TeamMemberBar() {
  const { authenticated, isLoading, member, logout } = useTeamAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (isLoading || !authenticated || !member) return null;

  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={panelRef}>
      {/* Panel */}
      {open && (
        <div className="absolute bottom-full right-0 mb-3 w-56 bg-background border border-border shadow-lg">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground">
                HOOK Workspace
              </p>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-sm font-medium leading-tight">{member.fullName}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              @{member.username}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] text-green-600 uppercase tracking-widest">Online</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="py-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs tracking-wide text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                {label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-border px-4 py-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-xs tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-11 w-11 bg-foreground text-background flex items-center justify-center text-sm font-medium tracking-wide hover:opacity-90 transition-opacity shadow-md"
        title={`${member.fullName} — Workspace`}
        aria-label="Open team workspace menu"
      >
        {initials}
        {/* Online indicator */}
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-background flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-green-500" />
        </span>
      </button>
    </div>
  );
}
