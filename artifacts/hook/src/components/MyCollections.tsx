import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SingleImageUpload } from "@/components/ImageUploadField";
import {
  Plus,
  Link2,
  Pencil,
  Trash2,
  Check,
  FolderOpen,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Collection {
  id: number;
  teamMemberId: number;
  title: string;
  description: string;
  coverImageUrl: string | null;
  status: string;
  shareToken: string;
  views: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CollectionForm {
  title: string;
  description: string;
  coverImageUrl: string;
  status: "active" | "hidden";
}

const defaultForm: CollectionForm = {
  title: "",
  description: "",
  coverImageUrl: "",
  status: "active",
};

function shareUrl(token: string): string {
  return `${window.location.origin}${BASE}/c/${token}`;
}

export function MyCollections({
  onOpenCollection,
}: {
  onOpenCollection?: (id: number) => void;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCollection, setEditCollection] = useState<Collection | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/collections`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      setCollections((await res.json()) as Collection[]);
    } catch {
      toast({ title: "Failed to load collections", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (form: CollectionForm) => {
    const res = await fetch(`${BASE}/api/collections`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const b = (await res.json()) as { error?: string };
      throw new Error(b.error ?? "Failed to create");
    }
    toast({ title: "Collection created" });
    setCreateOpen(false);
    void load();
  };

  const handleEdit = async (form: CollectionForm) => {
    if (!editCollection) return;
    const res = await fetch(`${BASE}/api/collections/${editCollection.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const b = (await res.json()) as { error?: string };
      throw new Error(b.error ?? "Failed to update");
    }
    toast({ title: "Collection updated" });
    setEditCollection(null);
    void load();
  };

  const handleDelete = async (c: Collection) => {
    if (!confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
    try {
      await fetch(`${BASE}/api/collections/${c.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast({ title: "Collection deleted" });
      void load();
    } catch {
      toast({ title: "Failed to delete collection", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (c: Collection) => {
    const newStatus = c.status === "active" ? "hidden" : "active";
    try {
      const res = await fetch(`${BASE}/api/collections/${c.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: c.title,
          description: c.description,
          coverImageUrl: c.coverImageUrl ?? "",
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      void load();
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const copyLink = async (c: Collection) => {
    try {
      await navigator.clipboard.writeText(shareUrl(c.shareToken));
      setCopiedId(c.id);
      toast({ title: "Share link copied to clipboard" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl font-light">My Collections</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="text-xs tracking-widest uppercase gap-2"
        >
          <Plus className="h-3 w-3" />
          New Collection
        </Button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
            Loading...
          </p>
        </div>
      ) : collections.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border">
          <FolderOpen className="h-8 w-8 mx-auto mb-4 text-muted-foreground/25" strokeWidth={1.5} />
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            No Collections Yet
          </p>
          <p className="text-xs text-muted-foreground mb-6 max-w-xs mx-auto leading-relaxed">
            Create your first collection to curate products and share them with your audience.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs tracking-widest uppercase gap-2"
          >
            <Plus className="h-3 w-3" />
            Create First Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              isCopied={copiedId === c.id}
              onOpen={onOpenCollection ? () => onOpenCollection(c.id) : undefined}
              onEdit={() => setEditCollection(c)}
              onDelete={() => void handleDelete(c)}
              onCopyLink={() => void copyLink(c)}
              onToggleStatus={() => void handleToggleStatus(c)}
            />
          ))}
        </div>
      )}

      <CollectionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        dialogTitle="New Collection"
        initialForm={defaultForm}
        onSubmit={handleCreate}
      />

      <CollectionFormDialog
        open={editCollection !== null}
        onOpenChange={(o) => { if (!o) setEditCollection(null); }}
        dialogTitle="Edit Collection"
        initialForm={
          editCollection
            ? {
                title: editCollection.title,
                description: editCollection.description,
                coverImageUrl: editCollection.coverImageUrl ?? "",
                status: editCollection.status as "active" | "hidden",
              }
            : defaultForm
        }
        onSubmit={handleEdit}
      />
    </div>
  );
}

function CollectionCard({
  collection: c,
  isCopied,
  onOpen,
  onEdit,
  onDelete,
  onCopyLink,
  onToggleStatus,
}: {
  collection: Collection;
  isCopied: boolean;
  onOpen?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="group border border-border hover:border-foreground/20 transition-colors flex flex-col">
      {/* Clickable top section — cover + title + description */}
      <button
        className="text-left w-full focus:outline-none"
        onClick={onOpen}
        disabled={!onOpen}
      >
        {/* Cover image */}
        <div className="aspect-[4/3] bg-accent/30 overflow-hidden relative">
          {c.coverImageUrl ? (
            <img
              src={c.coverImageUrl}
              alt={c.title}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/20" strokeWidth={1} />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`text-[9px] tracking-widest uppercase px-2 py-1 flex items-center gap-1.5 ${
                c.status === "active"
                  ? "bg-background/90 text-green-700"
                  : "bg-background/90 text-muted-foreground"
              }`}
            >
              {c.status === "active" ? (
                <Eye className="h-2.5 w-2.5" />
              ) : (
                <EyeOff className="h-2.5 w-2.5" />
              )}
              {c.status === "active" ? "Active" : "Hidden"}
            </span>
          </div>

          {/* Open chevron indicator */}
          {onOpen && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-background/90 text-foreground p-1.5 flex items-center">
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          )}
        </div>

        {/* Title + description */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-serif text-lg font-light leading-tight line-clamp-1 mb-1">
            {c.title}
          </h3>
          {c.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {c.description}
            </p>
          )}
        </div>
      </button>

      {/* Bottom section — non-clickable */}
      <div className="px-4 pb-4 flex flex-col flex-1">
        {/* Stats row */}
        <div className="flex items-center gap-3 py-3">
          {c.productCount === 0 ? (
            <p className="text-[10px] text-muted-foreground/60 italic flex-1">
              No products added yet
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground flex-1">
              {c.productCount} product{c.productCount !== 1 ? "s" : ""}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground shrink-0">
            {c.views.toLocaleString()} view{c.views !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-0 pt-3 border-t border-border/60">
          {/* Share */}
          <button
            onClick={onCopyLink}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 hover:bg-accent/40 flex-1"
            title="Copy share link"
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3 text-green-600 shrink-0" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="h-3 w-3 shrink-0" />
                Share
              </>
            )}
          </button>

          {/* Edit */}
          <button
            onClick={onEdit}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
            title="Edit collection"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          {/* Toggle Active / Hidden */}
          <button
            onClick={onToggleStatus}
            className={`p-1.5 hover:bg-accent/40 transition-colors ${
              c.status === "active"
                ? "text-green-600 hover:text-muted-foreground"
                : "text-muted-foreground hover:text-green-600"
            }`}
            title={c.status === "active" ? "Hide collection" : "Make active"}
          >
            {c.status === "active" ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-accent/40 transition-colors"
            title="Delete collection"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectionFormDialog({
  open,
  onOpenChange,
  dialogTitle,
  initialForm,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  dialogTitle: string;
  initialForm: CollectionForm;
  onSubmit: (form: CollectionForm) => Promise<void>;
}) {
  const [form, setForm] = useState<CollectionForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError(null);
    }
  }, [open]);

  const set = (k: keyof CollectionForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ ...form, title: form.title.trim() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light">
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Collection Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Summer Essentials 2025"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Cover Image
            </label>
            <SingleImageUpload
              value={form.coverImageUrl}
              onChange={(url) => set("coverImageUrl", url ?? "")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Description
              <span className="ml-1.5 text-muted-foreground/50 normal-case tracking-normal">
                optional
              </span>
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="A curated selection of..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Status
            </label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active — visible via share link</SelectItem>
                <SelectItem value="hidden">Hidden — not publicly accessible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="pt-1">
            <Button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="text-xs tracking-widest uppercase"
            >
              {loading ? "Saving..." : dialogTitle}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
