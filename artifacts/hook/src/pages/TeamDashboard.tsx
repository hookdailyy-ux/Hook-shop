import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useTeamAuth } from "@/contexts/TeamAuthContext";
import { LogOut, LayoutDashboard, FolderOpen, Layers, ShoppingBag, Gift, User, BarChart3, Inbox } from "lucide-react";
import { MyCollections } from "@/components/MyCollections";
import { CollectionDetail } from "@/components/CollectionDetail";
import { MyLooks } from "@/components/MyLooks";
import { LookDetail } from "@/components/LookDetail";
import { StoreProfileBuilder } from "@/components/StoreProfileBuilder";
import { MyOrders } from "@/components/MyOrders";
import { MyAnalytics } from "@/components/MyAnalytics";
import { MyRewards } from "@/components/MyRewards";
import { SharedBaskets } from "@/components/SharedBaskets";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type TeamPage =
  | "dashboard"
  | "collections"
  | "looks"
  | "orders"
  | "baskets"
  | "analytics"
  | "rewards"
  | "profile";

const NAV: { id: TeamPage; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { id: "collections", label: "My Collections", icon: FolderOpen },
  { id: "looks", label: "My Looks", icon: Layers },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "baskets", label: "Shared Baskets", icon: Inbox },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "rewards", label: "My Rewards", icon: Gift },
  { id: "profile", label: "My Profile", icon: User },
];

export default function TeamDashboard() {
  const { member, logout, refetch } = useTeamAuth();
  const [, navigate] = useLocation();
  const [activePage, setActivePage] = useState<TeamPage>("dashboard");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedLookId, setSelectedLookId] = useState<number | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleSetActivePage = (page: TeamPage) => {
    setActivePage(page);
    if (page !== "collections") setSelectedCollectionId(null);
    if (page !== "looks") setSelectedLookId(null);
    if (page !== "profile") setShowPasswordForm(false);
  };

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
          <div className="no-scrollbar flex items-center gap-0 overflow-x-auto">
            <div className="shrink-0 pr-6 py-4 border-r border-border mr-4 hidden md:flex items-center gap-2">
              <Link href="/" className="font-serif text-lg font-light tracking-wide hover:opacity-70 transition-opacity" title="Back to website">HOOK</Link>
              <span className="text-[9px] tracking-widest uppercase border border-border px-1.5 py-0.5 text-muted-foreground">
                Workspace
              </span>
            </div>

            {NAV.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleSetActivePage(id)}
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
                <span className="text-xs text-muted-foreground">{member.displayName ?? member.fullName}</span>
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

        {activePage === "dashboard" && <DashboardPage member={member} onNavigate={handleSetActivePage} />}

        {activePage === "collections" && (
          selectedCollectionId !== null ? (
            <CollectionDetail
              collectionId={selectedCollectionId}
              onBack={() => setSelectedCollectionId(null)}
            />
          ) : (
            <MyCollections onOpenCollection={(id) => setSelectedCollectionId(id)} />
          )
        )}

        {activePage === "looks" && (
          selectedLookId !== null ? (
            <LookDetail
              lookId={selectedLookId}
              onBack={() => setSelectedLookId(null)}
            />
          ) : (
            <MyLooks onOpenLook={(id) => setSelectedLookId(id)} />
          )
        )}

        {activePage === "orders" && <MyOrders />}

        {activePage === "baskets" && <SharedBaskets />}

        {activePage === "analytics" && <MyAnalytics />}

        {activePage === "rewards" && <MyRewards />}

        {activePage === "profile" && (
          showPasswordForm ? (
            <div className="max-w-lg">
              <button
                onClick={() => setShowPasswordForm(false)}
                className="mb-6 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Profile
              </button>
              <ChangePasswordForm memberId={member.id} onSuccess={() => { refetch(); setShowPasswordForm(false); }} />
            </div>
          ) : (
            <StoreProfileBuilder
              member={member}
              onSaved={refetch}
            />
          )
        )}
      </div>
    </div>
  );
}

function DashboardPage({
  member,
  onNavigate,
}: {
  member: ReturnType<typeof useTeamAuth>["member"];
  onNavigate: (page: TeamPage) => void;
}) {
  if (!member) return null;

  const initials = (member.displayName ?? member.fullName)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          {member.profilePhotoUrl ? (
            <div className="h-14 w-14 border border-border overflow-hidden shrink-0">
              <img src={member.profilePhotoUrl} alt={member.displayName ?? member.fullName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-14 w-14 border border-border flex items-center justify-center font-serif text-xl font-light bg-accent/30 shrink-0">
              {initials}
            </div>
          )}
          <div>
            <h1 className="font-serif text-2xl font-light">{member.displayName ?? member.fullName}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">@{member.username}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
          Welcome to your HOOK workspace. Manage your collections, looks, and track your performance.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Collections", value: "—", page: "collections" as TeamPage },
          { label: "Looks", value: "—", page: "looks" as TeamPage },
          { label: "Month Orders", value: "$0", page: "orders" as TeamPage },
          { label: "Rewards", value: "$0", page: "rewards" as TeamPage },
        ].map(({ label, value, page }) => (
          <button key={label} onClick={() => onNavigate(page)} className="border border-border p-5 text-left hover:border-foreground/30 transition-colors">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{label}</p>
            <p className="font-serif text-3xl font-light">{value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <button
          onClick={() => onNavigate("collections")}
          className="border border-dashed border-border p-6 text-left hover:border-foreground/30 transition-colors"
        >
          <FolderOpen className="h-5 w-5 text-muted-foreground/40 mb-3" strokeWidth={1} />
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Collections</p>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Curate products into themed collections.
          </p>
        </button>
        <button
          onClick={() => onNavigate("looks")}
          className="border border-dashed border-border p-6 text-left hover:border-foreground/30 transition-colors"
        >
          <Layers className="h-5 w-5 text-muted-foreground/40 mb-3" strokeWidth={1} />
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Looks</p>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Build styled looks from multiple products.
          </p>
        </button>
      </div>
    </div>
  );
}

function PlaceholderPage({ title, description, comingSoon }: { title: string; description: string; comingSoon?: boolean }) {
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

function ChangePasswordForm({ memberId: _memberId, onSuccess }: { memberId: number; onSuccess?: () => void }) {
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
    if (newPass !== confirm) { setError("Passwords do not match"); return; }
    if (newPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/team/auth/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) { setError(body.error ?? "Failed to change password"); return; }
      setSuccess(true);
      setCurrent(""); setNewPass(""); setConfirm("");
      refetch();
      onSuccess?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4">Change Password</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: "Current Password", value: current, onChange: setCurrent, auto: "current-password" },
          { label: "New Password", value: newPass, onChange: setNewPass, auto: "new-password" },
          { label: "Confirm New Password", value: confirm, onChange: setConfirm, auto: "new-password" },
        ].map(({ label, value, onChange, auto }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">{label}</label>
            <input type="password" value={value} onChange={(e) => onChange(e.target.value)} required autoComplete={auto}
              className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
          </div>
        ))}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {success && <p className="text-xs text-green-600 tracking-wide">Password changed successfully.</p>}
        <button type="submit" disabled={loading || !current || !newPass || !confirm}
          className="bg-foreground text-background text-xs tracking-widest uppercase px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-40">
          {loading ? "Saving…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
