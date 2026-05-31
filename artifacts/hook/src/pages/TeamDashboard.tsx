import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useTeamAuth } from "@/contexts/TeamAuthContext";
import { LogOut, LayoutDashboard, FolderOpen, Layers, ShoppingBag, Gift, User } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type TeamPage =
  | "dashboard"
  | "collections"
  | "looks"
  | "orders"
  | "rewards"
  | "profile";

const NAV: { id: TeamPage; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { id: "collections", label: "My Collections", icon: FolderOpen },
  { id: "looks", label: "My Looks", icon: Layers },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "rewards", label: "My Rewards", icon: Gift },
  { id: "profile", label: "My Profile", icon: User },
];

export default function TeamDashboard() {
  const { member, logout } = useTeamAuth();
  const [, navigate] = useLocation();
  const [activePage, setActivePage] = useState<TeamPage>("dashboard");

  const handleLogout = async () => {
    await logout();
    navigate("/team/login");
  };

  if (!member) return null;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div
            className="flex items-center gap-0 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="shrink-0 pr-6 py-4 border-r border-border mr-4 hidden md:flex items-center gap-2">
              <Link href="/" className="font-serif text-lg font-light tracking-wide">
                HOOK
              </Link>
              <span className="text-[9px] tracking-widest uppercase border border-border px-1.5 py-0.5 text-muted-foreground">
                Workspace
              </span>
            </div>

            {NAV.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className={`shrink-0 px-4 py-4 text-[11px] tracking-widest uppercase border-b-2 transition-colors whitespace-nowrap ${
                  activePage === id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label.replace("My ", "")}
              </button>
            ))}

            <div className="ml-auto shrink-0 flex items-center gap-3 pl-4">
              <div className="hidden md:flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <span className="text-xs text-muted-foreground">{member.fullName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-4 text-[11px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 pt-8 md:pt-10 pb-24">
        {activePage === "dashboard" && <DashboardPage member={member} />}
        {activePage === "collections" && <PlaceholderPage title="My Collections" description="Create and manage your curated product collections. Share them with your audience." comingSoon />}
        {activePage === "looks" && <PlaceholderPage title="My Looks" description="Build styled looks from the HOOK catalog. Link them on your socials." comingSoon />}
        {activePage === "orders" && <PlaceholderPage title="My Orders" description="Track orders placed through your shared links." comingSoon />}
        {activePage === "rewards" && <PlaceholderPage title="My Rewards" description="Track your earnings and rewards from affiliate activity." comingSoon />}
        {activePage === "profile" && <ProfilePage member={member} />}
      </div>
    </div>
  );
}

function DashboardPage({ member }: { member: ReturnType<typeof useTeamAuth>["member"] }) {
  if (!member) return null;

  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 border border-border flex items-center justify-center font-serif text-xl font-light bg-accent/30">
            {initials}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-light">{member.fullName}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">@{member.username}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
          Welcome to your HOOK workspace. From here you'll manage your collections, looks, and track your performance.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Collections", value: "0" },
          { label: "Looks", value: "0" },
          { label: "Month Orders", value: "$0" },
          { label: "Rewards", value: "$0" },
        ].map(({ label, value }) => (
          <div key={label} className="border border-border p-5">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{label}</p>
            <p className="font-serif text-3xl font-light">{value}</p>
          </div>
        ))}
      </div>

      <div className="border border-dashed border-border p-8 text-center max-w-lg">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
          Getting Started
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Collections and Looks are coming soon. Once available, you'll be able to curate
          products and share them directly with your audience.
        </p>
      </div>
    </div>
  );
}

function PlaceholderPage({
  title,
  description,
  comingSoon,
}: {
  title: string;
  description: string;
  comingSoon?: boolean;
}) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-light mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="border border-dashed border-border py-24 flex flex-col items-center justify-center text-center max-w-lg">
        {comingSoon && (
          <span className="text-[10px] tracking-widest uppercase border border-border px-3 py-1 text-muted-foreground mb-4">
            Coming Soon
          </span>
        )}
        <p className="text-xs text-muted-foreground/60 max-w-xs leading-relaxed">
          This section is being built. It will be available in a future update.
        </p>
      </div>
    </div>
  );
}

function ProfilePage({ member }: { member: ReturnType<typeof useTeamAuth>["member"] }) {
  if (!member) return null;
  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-light mb-1">My Profile</h2>
        <p className="text-sm text-muted-foreground">Your account information.</p>
      </div>

      <div className="border border-border divide-y divide-border mb-8">
        {[
          { label: "Full Name", value: member.fullName },
          { label: "Username", value: `@${member.username}`, mono: true },
          { label: "WhatsApp", value: member.whatsapp || "Not set" },
          {
            label: "Member Since",
            value: new Date(member.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        ].map(({ label, value, mono }) => (
          <div key={label} className="flex items-center px-4 py-3 gap-6">
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground w-28 shrink-0">
              {label}
            </span>
            <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
          </div>
        ))}
      </div>

      <ChangePasswordForm memberId={member.id} />
    </div>
  );
}

function ChangePasswordForm({ memberId: _memberId }: { memberId: number }) {
  const { refetch } = useTeamAuth();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (newPass.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/team/auth/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Failed to change password");
        return;
      }
      setSuccess(true);
      setCurrent("");
      setNewPass("");
      setConfirm("");
      refetch();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4">
        Change Password
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
            Current Password
          </label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
            New Password
          </label>
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {success && (
          <p className="text-xs text-green-600 tracking-wide">Password changed successfully.</p>
        )}
        <button
          type="submit"
          disabled={loading || !current || !newPass || !confirm}
          className="bg-foreground text-background text-xs tracking-widest uppercase px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? "Saving..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
