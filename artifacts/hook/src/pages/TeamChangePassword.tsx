import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useTeamAuth } from "@/contexts/TeamAuthContext";
import { API_BASE } from "@/lib/apiBase";

const BASE = API_BASE;

export default function TeamChangePassword() {
  const { member, refetch } = useTeamAuth();
  const [, navigate] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/team/auth/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Failed to change password");
        setLoading(false);
        return;
      }
      refetch();
      navigate("/team");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-widest font-semibold">
          HOOK
        </Link>
        <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground border border-border px-2 py-1">
          Workspace
        </span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-3">
              Action Required
            </p>
            <h1 className="font-serif text-3xl font-light">Set Your Password</h1>
            {member && (
              <p className="text-xs text-muted-foreground mt-3">
                Welcome, {member.fullName}. Please set a personal password before continuing.
              </p>
            )}
          </div>

          <div className="mb-6 p-4 border border-border bg-accent/20 text-xs text-muted-foreground leading-relaxed">
            Your temporary password has been reset by the admin. Choose a new private password
            to access your workspace.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                required
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
                className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/40"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive tracking-wide">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword || !confirm}
              className="w-full bg-foreground text-background text-xs tracking-widest uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-40 mt-2"
            >
              {loading ? "Saving..." : "Set Password & Enter Workspace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
