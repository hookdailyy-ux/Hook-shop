import { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { SingleImageUpload } from "@/components/ImageUploadField";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  GripVertical,
  X,
  Plus,
  Link2,
  Check,
  Eye,
  EyeOff,
  Layers,
  Package,
  Pencil,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import type { Look } from "@/components/MyLooks";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

interface LookProduct {
  id: number;
  productId: number;
  sortOrder: number;
  title: string;
  hookPrice: string | null;
  imageUrl: string | null;
  brand: string | null;
  affiliateUrl: string;
  category: string;
}

interface CatalogProduct {
  id: number;
  title: string;
  price: string | null;
  imageUrl: string | null;
  brand: string | null;
  category: string;
  subcategory: string | null;
}

interface EditForm {
  title: string;
  coverImageUrl: string;
  price: string;
  status: "active" | "hidden";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LookDetail({
  lookId,
  onBack,
}: {
  lookId: number;
  onBack: () => void;
}) {
  const [look, setLook] = useState<Look | null>(null);
  const [products, setProducts] = useState<LookProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lookRes, prodRes] = await Promise.all([
        fetch(`${BASE}/api/team/looks/${lookId}`, { credentials: "include" }),
        fetch(`${BASE}/api/team/looks/${lookId}/products`, { credentials: "include" }),
      ]);
      if (!lookRes.ok) { onBack(); return; }
      const [lookData, prods] = await Promise.all([
        lookRes.json() as Promise<Look>,
        prodRes.ok ? (prodRes.json() as Promise<LookProduct[]>) : Promise.resolve([]),
      ]);
      setLook(lookData);
      setProducts(prods);
    } catch {
      toast({ title: "Failed to load look", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [lookId]);

  useEffect(() => { void load(); }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = products.findIndex((p) => p.id === active.id);
    const newIdx = products.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(products, oldIdx, newIdx);
    setProducts(reordered);
    try {
      await fetch(`${BASE}/api/team/looks/${lookId}/products/reorder`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((p, i) => ({ id: p.id, sortOrder: i })) }),
      });
    } catch {
      toast({ title: "Reorder failed — refresh to sync", variant: "destructive" });
    }
  };

  const handleRemove = async (entryId: number) => {
    const prev = products;
    setProducts((ps) => ps.filter((p) => p.id !== entryId));
    try {
      await fetch(`${BASE}/api/team/looks/${lookId}/products/${entryId}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      setProducts(prev);
      toast({ title: "Failed to remove product", variant: "destructive" });
    }
  };

  const handleProductAdded = (entry: LookProduct) => {
    setProducts((ps) => [...ps, entry]);
  };

  const handleToggleStatus = async () => {
    if (!look) return;
    const newStatus = look.status === "active" ? "hidden" : "active";
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
      setLook({ ...look, status: newStatus });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const copyShareLink = async () => {
    if (!look) return;
    const url = `${window.location.origin}${BASE}/l/${look.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast({ title: "Share link copied" });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const handleEditSave = async (form: EditForm) => {
    if (!look) return;
    const res = await fetch(`${BASE}/api/team/looks/${look.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        coverImageUrl: form.coverImageUrl || null,
        price: form.price || null,
        status: form.status,
      }),
    });
    if (!res.ok) throw new Error("Failed to save");
    const updated = (await res.json()) as Look;
    setLook(updated);
    toast({ title: "Look updated" });
    setEditOpen(false);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }
  if (!look) return null;

  const existingProductIds = new Set(products.map((p) => p.productId));

  return (
    <div>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          My Looks
        </button>
        <div className="flex items-center gap-2">
          <a
            href={`${BASE}/l/${look.shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Preview
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="text-xs tracking-widest uppercase gap-2"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        </div>
      </div>

      {/* Look header */}
      <div className="flex gap-6 mb-10 pb-10 border-b border-border">
        <div className="shrink-0 w-28 h-28 sm:w-36 sm:h-36 bg-accent/30 overflow-hidden">
          {look.coverImageUrl ? (
            <img src={look.coverImageUrl} alt={look.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layers className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-3xl font-light leading-tight mb-2">{look.title}</h1>
          {look.price && (
            <p className="text-sm font-mono text-muted-foreground mb-3">{look.price}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                look.status === "active"
                  ? "border-green-600/30 text-green-700 hover:bg-green-50/50"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {look.status === "active" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {look.status === "active" ? "Active" : "Hidden"}
            </button>
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 border border-border hover:border-foreground/30 transition-colors text-muted-foreground hover:text-foreground"
            >
              {copiedLink ? (
                <><Check className="h-3 w-3 text-green-600" /><span className="text-green-600">Copied!</span></>
              ) : (
                <><Link2 className="h-3 w-3" />Share Link</>
              )}
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-0.5">Products</p>
              <p className="font-serif text-2xl font-light">{products.length}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-0.5">Views</p>
              <p className="font-serif text-2xl font-light">{look.views.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-xl font-light">Products in this Look</h2>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-0.5">
              {products.length} item{products.length !== 1 ? "s" : ""}
              {products.length > 0 && " · drag to reorder"}
            </p>
          </div>
          <Button onClick={() => setPickerOpen(true)} size="sm" className="text-xs tracking-widest uppercase gap-2">
            <Plus className="h-3 w-3" />
            Add Product
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="border border-dashed border-border py-20 flex flex-col items-center justify-center text-center">
            <Package className="h-8 w-8 text-muted-foreground/20 mb-4" strokeWidth={1} />
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">No Products Added</p>
            <p className="text-xs text-muted-foreground mb-6 max-w-xs leading-relaxed">
              Add products from the HOOK catalog to build out this look.
            </p>
            <Button onClick={() => setPickerOpen(true)} variant="outline" size="sm" className="text-xs tracking-widest uppercase gap-2">
              <Plus className="h-3 w-3" />
              Add First Product
            </Button>
          </div>
        ) : (
          <div className="border border-border">
            <div className="hidden sm:grid border-b border-border bg-accent/20 px-3 py-2" style={{ gridTemplateColumns: "32px 56px 1fr 90px 32px" }}>
              <span /><span />
              <span className="text-[9px] tracking-widest uppercase text-muted-foreground">Product</span>
              <span className="text-[9px] tracking-widest uppercase text-muted-foreground text-right">Hook Price</span>
              <span />
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {products.map((p) => (
                  <SortableLookProductRow
                    key={p.id}
                    item={p}
                    onRemove={() => void handleRemove(p.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <LookProductPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        lookId={lookId}
        existingProductIds={existingProductIds}
        onAdd={handleProductAdded}
      />

      {look && (
        <EditLookDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          look={look}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

// ─── Sortable Product Row ─────────────────────────────────────────────────────

function SortableLookProductRow({ item, onRemove }: { item: LookProduct; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1, zIndex: isDragging ? 50 : undefined }}
      className="flex items-center gap-3 px-3 py-3 border-b border-border last:border-b-0 bg-background hover:bg-accent/10 transition-colors"
    >
      <button className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5" {...attributes} {...listeners} aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="shrink-0 h-12 w-12 bg-accent/30 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-muted-foreground/30" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-1">{item.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {[item.brand, item.category].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="shrink-0 text-right hidden sm:block">
        <p className="text-[9px] tracking-widest uppercase text-muted-foreground/60 mb-0.5">Price</p>
        <p className="text-xs font-mono text-muted-foreground">{item.hookPrice ?? "—"}</p>
      </div>
      <button onClick={onRemove} className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors" title="Remove from look">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Product Picker Dialog ────────────────────────────────────────────────────

function LookProductPickerDialog({
  open, onClose, lookId, existingProductIds, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  lookId: number;
  existingProductIds: Set<number>;
  onAdd: (entry: LookProduct) => void;
}) {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<number | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setCatalogLoading(true);
    fetch(`${BASE}/api/products/catalog`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setCatalog(data as CatalogProduct[]))
      .catch(() => toast({ title: "Failed to load catalog", variant: "destructive" }))
      .finally(() => setCatalogLoading(false));
  }, [open]);

  const filtered = catalog
    .filter((p) => !existingProductIds.has(p.id))
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });

  const handleAdd = async (p: CatalogProduct) => {
    setAdding(p.id);
    try {
      const res = await fetch(`${BASE}/api/team/looks/${lookId}/products`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id }),
      });
      if (!res.ok) {
        const b = (await res.json()) as { error?: string };
        throw new Error(b.error ?? "Failed");
      }
      const entry = (await res.json()) as LookProduct;
      onAdd(entry);
      toast({ title: `"${p.title}" added` });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to add product", variant: "destructive" });
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border shrink-0">
          <DialogTitle className="font-serif text-xl font-light">Add Product to Look</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">Select from the HOOK catalog.</p>
        </DialogHeader>
        <div className="px-6 py-4 border-b border-border shrink-0">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, brand, or category…" autoFocus />
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {catalogLoading ? (
            <div className="py-16 text-center">
              <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading catalog…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" strokeWidth={1} />
              <p className="text-xs text-muted-foreground">{search ? "No products match your search." : "No products available."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <div key={p.id} className="border border-border hover:border-foreground/30 transition-colors flex flex-col">
                  <div className="aspect-square bg-accent/20 overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground/20" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-xs font-medium line-clamp-2 leading-snug mb-1">{p.title}</p>
                    {p.brand && <p className="text-[10px] text-muted-foreground mb-1">{p.brand}</p>}
                    <p className="text-xs font-mono text-muted-foreground">{p.price ?? "—"}</p>
                    <button
                      onClick={() => void handleAdd(p)}
                      disabled={adding === p.id}
                      className="mt-auto pt-3 w-full text-[10px] tracking-widest uppercase border border-border py-1.5 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {adding === p.id ? "Adding…" : <><Plus className="h-3 w-3" />Add</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Look Dialog ─────────────────────────────────────────────────────────

function EditLookDialog({ open, onClose, look, onSave }: {
  open: boolean;
  onClose: () => void;
  look: Look;
  onSave: (form: EditForm) => Promise<void>;
}) {
  const [form, setForm] = useState<EditForm>({
    title: look.title,
    coverImageUrl: look.coverImageUrl ?? "",
    price: look.price ?? "",
    status: look.status as "active" | "hidden",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm({ title: look.title, coverImageUrl: look.coverImageUrl ?? "", price: look.price ?? "", status: look.status as "active" | "hidden" });
      setError(null);
    }
  }, [open, look]);

  const set = (k: keyof EditForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setLoading(true);
    setError(null);
    try {
      await onSave({ ...form, title: form.title.trim() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setError(msg);
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light">Edit Look</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Title <span className="text-destructive">*</span></label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Cover Image</label>
            <SingleImageUpload value={form.coverImageUrl} onChange={(url) => set("coverImageUrl", url ?? "")} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Look Price <span className="ml-1 normal-case tracking-normal text-muted-foreground/50">optional</span></label>
            <Input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. $450" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active — visible via share link</SelectItem>
                <SelectItem value="hidden">Hidden — not publicly accessible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !form.title.trim()} className="text-xs tracking-widest uppercase">
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
