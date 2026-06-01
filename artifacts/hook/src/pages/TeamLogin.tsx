import { useState, type FormEvent } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { useTeamAuth } from "@/contexts/TeamAuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function TeamLogin() {
  const { login, authenticated, isLoading } = useTeamAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLoading) return null;
  if (authenticated) return <Redirect to="/team" />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(username.trim().toLowerCase(), password);
    setLoading(false);
    if (result.ok) {
      if (result.forcePasswordChange) {
        navigate("/team/change-password");
      } else {
        navigate("/team");
      }
    } else {
      setError(result.error ?? "Login failed");
      setPassword("");
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
              Team Member Access
            </p>
            <h1 className="font-serif text-3xl font-light">Sign In</h1>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Use your username and password provided by the admin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                autoComplete="username"
                placeholder="your_username"
                className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/40 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full border border-border bg-background px-4 pr-11 py-3 text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive tracking-wide">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-foreground text-background text-xs tracking-widest uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-40 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link
              href="/"
              className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Return to Site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
