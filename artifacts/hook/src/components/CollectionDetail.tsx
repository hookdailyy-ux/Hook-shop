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
  FolderOpen,
  Package,
  Pencil,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { API_BASE, resolveImageUrl } from "@/lib/apiBase";

const BASE = API_BASE;

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface CollectionProduct {
  id: number;
  productId: number;
  collectionPrice: string | null;
  sortOrder: number;
  views: number;
  title: string;
  hookPrice: string | null;
  imageUrl: string | null;
  brand: string | null;
  affiliateUrl: string;
  category: string;
  createdAt: string;
  updatedAt: string;
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
  description: string;
  coverImageUrl: string;
  status: "active" | "hidden";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CollectionDetail({
  collectionId,
  onBack,
}: {
  collectionId: number;
  onBack: () => void;
}) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [colRes, prodRes] = await Promise.all([
        fetch(`${BASE}/api/collections/${collectionId}`, { credentials: "include" }),
        fetch(`${BASE}/api/collections/${collectionId}/products`, { credentials: "include" }),
      ]);
      if (!colRes.ok) { onBack(); return; }
      const [col, prods] = await Promise.all([
        colRes.json() as Promise<Collection>,
        prodRes.ok ? (prodRes.json() as Promise<CollectionProduct[]>) : Promise.resolve([]),
      ]);
      setCollection(col);
      setProducts(prods);
    } catch {
      toast({ title: "Failed to load collection", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => { void load(); }, [load]);

  // DnD sensors
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
      await fetch(`${BASE}/api/collections/${collectionId}/products/reorder`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((p, i) => ({ id: p.id, sortOrder: i })) }),
      });
    } catch {
      toast({ title: "Reorder failed — refresh to sync", variant: "destructive" });
    }
  };

  const handleRemoveProduct = async (entryId: number) => {
    const prev = products;
    setProducts((ps) => ps.filter((p) => p.id !== entryId));
    try {
      await fetch(`${BASE}/api/collections/${collectionId}/products/${entryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (collection) {
        setCollection({ ...collection, productCount: collection.productCount - 1 });
      }
    } catch {
      setProducts(prev);
      toast({ title: "Failed to remove product", variant: "destructive" });
    }
  };

  const handlePriceChange = async (entryId: number, collectionPrice: string | null) => {
    try {
      await fetch(`${BASE}/api/collections/${collectionId}/products/${entryId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionPrice }),
      });
      setProducts((ps) =>
        ps.map((p) => (p.id === entryId ? { ...p, collectionPrice } : p)),
      );
    } catch {
      toast({ title: "Failed to save price", variant: "destructive" });
    }
  };

  const handleProductAdded = (entry: CollectionProduct) => {
    setProducts((ps) => [...ps, entry]);
    if (collection) {
      setCollection({ ...collection, productCount: collection.productCount + 1 });
    }
  };

  const handleToggleStatus = async () => {
    if (!collection) return;
    const newStatus = collection.status === "active" ? "hidden" : "active";
    try {
      await fetch(`${BASE}/api/collections/${collection.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: collection.title,
          description: collection.description,
          coverImageUrl: collection.coverImageUrl ?? "",
          status: newStatus,
        }),
      });
      setCollection({ ...collection, status: newStatus });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const copyShareLink = async () => {
    if (!collection) return;
    const url = `${window.location.origin}${BASE}/c/${collection.shareToken}`;
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
    if (!collection) return;
    const res = await fetch(`${BASE}/api/collections/${collection.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error("Failed to save");
    const updated = (await res.json()) as Collection;
    setCollection({ ...updated, productCount: collection.productCount });
    toast({ title: "Collection updated" });
    setEditOpen(false);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  if (!collection) return null;

  const existingProductIds = new Set(products.map((p) => p.productId));

  return (
    <div>
      {/* Back + actions bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          My Collections
        </button>
        <div className="flex items-center gap-2">
          <a
            href={`${BASE}/c/${collection.shareToken}`}
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

      {/* Collection header */}
      <div className="flex gap-6 mb-10 pb-10 border-b border-border">
        {/* Cover image */}
        <div className="shrink-0 w-28 h-28 sm:w-36 sm:h-36 bg-accent/30 overflow-hidden">
          {collection.coverImageUrl ? (
            <img
              src={resolveImageUrl(collection.coverImageUrl)}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-3xl font-light leading-tight mb-2">
            {collection.title}
          </h1>

          {collection.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-prose">
              {collection.description}
            </p>
          )}

          {/* Status + Share */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                collection.status === "active"
                  ? "border-green-600/30 text-green-700 hover:bg-green-50/50"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {collection.status === "active" ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
              {collection.status === "active" ? "Active" : "Hidden"}
            </button>

            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 border border-border hover:border-foreground/30 transition-colors text-muted-foreground hover:text-foreground"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3 w-3" />
                  Share Link
                </>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-0.5">
                Products
              </p>
              <p className="font-serif text-2xl font-light">{collection.productCount}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-0.5">
                Views
              </p>
              <p className="font-serif text-2xl font-light">
                {collection.views.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-xl font-light">Products</h2>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-0.5">
              {products.length} item{products.length !== 1 ? "s" : ""}
              {products.length > 0 && " · drag to reorder"}
            </p>
          </div>
          <Button
            onClick={() => setPickerOpen(true)}
            size="sm"
            className="text-xs tracking-widest uppercase gap-2"
          >
            <Plus className="h-3 w-3" />
            Add Product
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="border border-dashed border-border py-20 flex flex-col items-center justify-center text-center">
            <Package className="h-8 w-8 text-muted-foreground/20 mb-4" strokeWidth={1} />
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              No Products Added Yet
            </p>
            <p className="text-xs text-muted-foreground mb-6 max-w-xs leading-relaxed">
              Add products from the HOOK catalog to build out this collection.
            </p>
            <Button
              onClick={() => setPickerOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs tracking-widest uppercase gap-2"
            >
              <Plus className="h-3 w-3" />
              Add First Product
            </Button>
          </div>
        ) : (
          <div className="border border-border">
            {/* Column headers */}
            <div className="hidden sm:grid border-b border-border bg-accent/20 px-3 py-2"
              style={{ gridTemplateColumns: "32px 56px 1fr 90px 110px 54px 32px" }}>
              <span />
              <span />
              <span className="text-[9px] tracking-widest uppercase text-muted-foreground">
                Product
              </span>
              <span className="text-[9px] tracking-widest uppercase text-muted-foreground text-right">
                Hook Price
              </span>
              <span className="text-[9px] tracking-widest uppercase text-muted-foreground pl-2">
                My Price
              </span>
              <span className="text-[9px] tracking-widest uppercase text-muted-foreground text-center">
                Views
              </span>
              <span />
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={products.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {products.map((p) => (
                  <SortableProductRow
                    key={p.id}
                    item={p}
                    onRemove={() => void handleRemoveProduct(p.id)}
                    onPriceChange={(price) => void handlePriceChange(p.id, price)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* Product Picker Dialog */}
      <ProductPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        collectionId={collectionId}
        existingProductIds={existingProductIds}
        onAdd={handleProductAdded}
      />

      {/* Edit Collection Dialog */}
      {collection && (
        <EditCollectionDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          collection={collection}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

// ─── Sortable Product Row ─────────────────────────────────────────────────────

function SortableProductRow({
  item,
  onRemove,
  onPriceChange,
}: {
  item: CollectionProduct;
  onRemove: () => void;
  onPriceChange: (price: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const [priceInput, setPriceInput] = useState(item.collectionPrice ?? "");
  const lastSaved = useRef(item.collectionPrice ?? "");

  // Sync if parent updates this item (e.g. after add)
  useEffect(() => {
    setPriceInput(item.collectionPrice ?? "");
    lastSaved.current = item.collectionPrice ?? "";
  }, [item.collectionPrice]);

  const handleBlur = () => {
    const val = priceInput.trim();
    if (val === lastSaved.current) return;
    lastSaved.current = val;
    onPriceChange(val || null);
  };

  const priceOverridden =
    item.collectionPrice !== null && item.collectionPrice !== item.hookPrice;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-3 border-b border-border last:border-b-0 bg-background hover:bg-accent/10 transition-colors"
    >
      {/* Use flex on mobile, grid on sm+ */}
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <button
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Product image */}
        <div className="shrink-0 h-12 w-12 bg-accent/30 overflow-hidden">
          {item.imageUrl ? (
            <img src={resolveImageUrl(item.imageUrl)} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-muted-foreground/30" strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight line-clamp-2">{item.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {[item.brand, item.category].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* Prices + views + remove — horizontal on all screens */}
      <div className="flex items-center gap-2 sm:gap-3 justify-end mt-2 sm:mt-0">
        {/* Hook Price */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[9px] tracking-widest uppercase text-muted-foreground/60 mb-0.5">Hook</p>
          <p className="text-xs font-mono text-muted-foreground">{item.hookPrice ?? "—"}</p>
        </div>

        {/* Collection Price input */}
        <div className="shrink-0">
          <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-0.5">
            My Price
          </p>
          <input
            type="text"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={handleBlur}
            placeholder={item.hookPrice ?? "—"}
            className={`w-24 text-xs border px-2 py-1 bg-background outline-none transition-colors font-mono ${
              priceOverridden
                ? "border-foreground/40 text-foreground"
                : "border-border focus:border-foreground text-muted-foreground"
            }`}
          />
        </div>

        {/* Views */}
        <div className="text-center shrink-0 hidden sm:block w-10">
          <p className="text-xs font-mono">{item.views}</p>
          <p className="text-[9px] text-muted-foreground/60 tracking-widest uppercase">views</p>
        </div>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Remove from collection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Product Picker Dialog ────────────────────────────────────────────────────

function ProductPickerDialog({
  open,
  onClose,
  collectionId,
  existingProductIds,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  collectionId: number;
  existingProductIds: Set<number>;
  onAdd: (entry: CollectionProduct) => void;
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
      return (
        p.title.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });

  const handleAdd = async (p: CatalogProduct) => {
    setAdding(p.id);
    try {
      const res = await fetch(`${BASE}/api/collections/${collectionId}/products`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id }),
      });
      if (!res.ok) {
        const b = (await res.json()) as { error?: string };
        throw new Error(b.error ?? "Failed");
      }
      const entry = (await res.json()) as CollectionProduct;
      onAdd(entry);
      toast({ title: `"${p.title}" added` });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border shrink-0">
          <DialogTitle className="font-serif text-xl font-light">Add Product</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Select from the HOOK catalog. Already-added products are hidden.
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, or category..."
            autoFocus
          />
        </div>

        {/* Product grid */}
        <div className="overflow-y-auto flex-1 p-6">
          {catalogLoading ? (
            <div className="py-16 text-center">
              <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
                Loading catalog...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" strokeWidth={1} />
              <p className="text-xs text-muted-foreground">
                {search
                  ? "No products match your search."
                  : existingProductIds.size > 0
                  ? "All catalog products have been added to this collection."
                  : "No products in catalog yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="border border-border hover:border-foreground/30 transition-colors flex flex-col"
                >
                  <div className="aspect-square bg-accent/20 overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={resolveImageUrl(p.imageUrl)}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground/20" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-xs font-medium line-clamp-2 leading-snug mb-1">
                      {p.title}
                    </p>
                    {p.brand && (
                      <p className="text-[10px] text-muted-foreground mb-1">{p.brand}</p>
                    )}
                    <p className="text-xs font-mono text-muted-foreground">{p.price ?? "—"}</p>
                    <button
                      onClick={() => void handleAdd(p)}
                      disabled={adding === p.id}
                      className="mt-auto pt-3 w-full text-[10px] tracking-widest uppercase border border-border py-1.5 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {adding === p.id ? (
                        "Adding..."
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          Add
                        </>
                      )}
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

// ─── Edit Collection Dialog ───────────────────────────────────────────────────

function EditCollectionDialog({
  open,
  onClose,
  collection,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  collection: Collection;
  onSave: (form: EditForm) => Promise<void>;
}) {
  const [form, setForm] = useState<EditForm>({
    title: collection.title,
    description: collection.description,
    coverImageUrl: collection.coverImageUrl ?? "",
    status: collection.status as "active" | "hidden",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm({
        title: collection.title,
        description: collection.description,
        coverImageUrl: collection.coverImageUrl ?? "",
        status: collection.status as "active" | "hidden",
      });
      setError(null);
    }
  }, [open, collection]);

  const set = (k: keyof EditForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

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
          <DialogTitle className="font-serif text-xl font-light">Edit Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Collection Name <span className="text-destructive">*</span>
            </label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Cover Image</label>
            <SingleImageUpload
              value={form.coverImageUrl}
              onChange={(url) => set("coverImageUrl", url ?? "")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Description
              <span className="ml-1.5 text-muted-foreground/50 normal-case tracking-normal">optional</span>
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="resize-none"
            />
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
          <div className="pt-1">
            <Button type="submit" disabled={loading || !form.title.trim()} className="text-xs tracking-widest uppercase">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
