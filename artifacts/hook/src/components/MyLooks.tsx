import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Eye,
  EyeOff,
  Layers,
  Link2,
  Check,
  Trash2,
  Pencil,
  ExternalLink,
} from "lucide-react";

const BASE = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");

export interface Look {
  id: number;
  title: string;
  coverImageUrl: string | null;
  price: string | null;
  status: string;
  shareToken: string;
  views: number;
  createdAt: string;
}

function shareUrl(token: string) {
  return `${window.location.origin}${BASE}/l/${token}`;
}

export function MyLooks({
  onOpenLook,
}: {
  onOpenLook: (id: number) => void;
}) {
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/team/looks`, { credentials: "include" });
      if (res.ok) setLooks((await res.json()) as Look[]);
    } catch {
      toast({ title: "Failed to load looks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = (look: Look) => {
    setLooks((l) => [...l, look]);
    setCreateOpen(false);
    onOpenLook(look.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this look? This cannot be undone.")) return;
    const prev = looks;
    setLooks((l) => l.filter((x) => x.id !== id));
    try {
      await fetch(`${BASE}/api/team/looks/${id}`, { method: "DELETE", credentials: "include" });
      toast({ title: "Look deleted" });
    } catch {
      setLooks(prev);
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (look: Look) => {
    const newStatus = look.status === "active" ? "hidden" : "active";
    setLooks((l) => l.map((x) => (x.id === look.id ? { ...x, status: newStatus } : x)));
    try {
      await fetch(`${BASE}/api/team/looks/${look.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: look.title,
          coverImageUrl: look.coverImageUrl,
          price: look.price,
          status: newStatus,
        }),
      });
    } catch {
      setLooks((l) => l.map((x) => (x.id === look.id ? { ...x, status: look.status } : x)));
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const copyLink = async (look: Look) => {
    try {
      await navigator.clipboard.writeText(shareUrl(look.shareToken));
      setCopiedId(look.id);
      toast({ title: "Link copied" });
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-light mb-1">My Looks</h2>
          <p className="text-sm text-muted-foreground">
            Style boards linking multiple products. Share with your audience.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="text-xs tracking-widest uppercase gap-2"
        >
          <Plus className="h-3.5 w-3.5" />
          New Look
        </Button>
      </div>

      {looks.length === 0 ? (
        <div className="border border-dashed border-border py-24 flex flex-col items-center justify-center text-center">
          <Layers className="h-8 w-8 text-muted-foreground/20 mb-4" strokeWidth={1} />
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            No Looks Yet
          </p>
          <p className="text-xs text-muted-foreground mb-6 max-w-xs leading-relaxed">
            Create a styled look by selecting multiple products from the HOOK catalog.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs tracking-widest uppercase gap-2"
          >
            <Plus className="h-3 w-3" />
            Create First Look
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {looks.map((look) => (
            <LookCard
              key={look.id}
              look={look}
              copiedId={copiedId}
              onOpen={() => onOpenLook(look.id)}
              onDelete={() => void handleDelete(look.id)}
              onToggleStatus={() => void handleToggleStatus(look)}
              onCopyLink={() => void copyLink(look)}
            />
          ))}
        </div>
      )}

      <CreateLookDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

// ─── Look Card ────────────────────────────────────────────────────────────────

function LookCard({
  look,
  copiedId,
  onOpen,
  onDelete,
  onToggleStatus,
  onCopyLink,
}: {
  look: Look;
  copiedId: number | null;
  onOpen: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onCopyLink: () => void;
}) {
  return (
    <div className="border border-border overflow-hidden group hover:border-foreground/30 transition-colors">
      {/* Cover */}
      <button
        onClick={onOpen}
        className="block w-full aspect-[4/3] overflow-hidden bg-accent/30 text-left"
      >
        {look.coverImageUrl ? (
          <img
            src={look.coverImageUrl}
            alt={look.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Layers className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
          </div>
        )}
      </button>

      {/* Info */}
      <div className="p-4">
        <button onClick={onOpen} className="block text-left w-full mb-3">
          <p className="text-sm font-medium leading-snug line-clamp-1">{look.title}</p>
          <div className="flex items-center gap-3 mt-1">
            {look.price && (
              <span className="text-xs font-mono text-muted-foreground">{look.price}</span>
            )}
            <span className="text-[10px] text-muted-foreground/60">
              {look.views} views
            </span>
            <span
              className={`text-[9px] tracking-widest uppercase px-1.5 py-0.5 border ${
                look.status === "active"
                  ? "border-green-600/30 text-green-700"
                  : "border-border text-muted-foreground"
              }`}
            >
              {look.status}
            </span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={onOpen}
            className="flex items-center gap-1 text-[9px] tracking-widest uppercase px-2.5 py-1.5 border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-2.5 w-2.5" />
            Edit
          </button>
          <button
            onClick={onToggleStatus}
            className="flex items-center gap-1 text-[9px] tracking-widest uppercase px-2.5 py-1.5 border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
            title={look.status === "active" ? "Hide look" : "Make active"}
          >
            {look.status === "active" ? (
              <EyeOff className="h-2.5 w-2.5" />
            ) : (
              <Eye className="h-2.5 w-2.5" />
            )}
            {look.status === "active" ? "Hide" : "Show"}
          </button>
          <button
            onClick={onCopyLink}
            className="flex items-center gap-1 text-[9px] tracking-widest uppercase px-2.5 py-1.5 border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
          >
            {copiedId === look.id ? (
              <Check className="h-2.5 w-2.5 text-green-600" />
            ) : (
              <Link2 className="h-2.5 w-2.5" />
            )}
            {copiedId === look.id ? "Copied!" : "Share"}
          </button>
          <a
            href={`${BASE}/l/${look.shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[9px] tracking-widest uppercase px-2.5 py-1.5 border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            Preview
          </a>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-[9px] tracking-widest uppercase px-2.5 py-1.5 border border-border hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-colors ml-auto"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Look Dialog ───────────────────────────────────────────────────────

function CreateLookDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (look: Look) => void;
}) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) { setTitle(""); setError(null); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/team/looks`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const look = (await res.json()) as Look;
      toast({ title: `"${look.title}" created` });
      onCreate(look);
    } catch {
      setError("Failed to create look. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light">New Look</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Look Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekend Casual"
              autoFocus
              maxLength={120}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !title.trim()}
            className="text-xs tracking-widest uppercase w-full"
          >
            {loading ? "Creating…" : "Create Look"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
