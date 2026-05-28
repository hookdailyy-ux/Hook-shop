import { useState, useEffect } from "react";
import {
  useGetAdminStats,
  useListAdminProducts,
  useListLooks,
  useListProducts,
  useListSubcategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateLook,
  useUpdateLook,
  useDeleteLook,
  useCreateSubcategory,
  useDeleteSubcategory,
  getListAdminProductsQueryKey,
  getListLooksQueryKey,
  getGetAdminStatsQueryKey,
  getListSubcategoriesQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import type { Product, Look, Subcategory } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Trash2, Pencil, LogOut } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useLocation } from "wouter";

type Tab = "dashboard" | "products" | "looks" | "categories" | "settings";

const CATEGORIES = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "electronics", label: "Electronics" },
  { value: "home", label: "Home Essentials" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { logout } = useAdminAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: "hsl(var(--background))" }}>
      <div className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <h1 className="font-serif text-lg font-light tracking-wide shrink-0 pr-8 py-4 border-r border-border mr-4 hidden md:block">
              Admin
            </h1>
            {(["dashboard", "products", "looks", "categories", "settings"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-4 text-xs tracking-widest uppercase border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`tab-${tab}`}
              >
                {tab}
              </button>
            ))}
            <div className="ml-auto shrink-0">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-4 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-8 md:pt-10">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "looks" && <LooksTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

function StatCard({ title, value, loading }: { title: string; value?: number; loading?: boolean }) {
  return (
    <div className="bg-card border border-border p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">{title}</p>
      {loading ? (
        <div className="h-10 w-16 bg-accent animate-pulse" />
      ) : (
        <p className="font-serif text-4xl font-light">{value ?? 0}</p>
      )}
    </div>
  );
}

function DashboardTab() {
  const { data: stats, isLoading } = useGetAdminStats();

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <StatCard title="Products" value={stats?.totalProducts} loading={isLoading} />
        <StatCard title="Looks" value={stats?.totalLooks} loading={isLoading} />
        <StatCard title="Subscribers" value={stats?.totalSubscribers} loading={isLoading} />
        <StatCard title="Featured" value={stats?.featuredCount} loading={isLoading} />
        <StatCard title="Trending" value={stats?.trendingCount} loading={isLoading} />
      </div>

      {stats && (
        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xs tracking-widest uppercase">Products by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {CATEGORIES.map((cat) => (
              <div key={cat.value} className="px-6 py-5">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{cat.label}</p>
                <p className="font-serif text-3xl font-light">
                  {stats.productsByCategory[cat.value as keyof typeof stats.productsByCategory] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const { data: products, isLoading } = useListAdminProducts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteProduct();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product deleted" });
        },
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          {products?.length ?? 0} products
        </p>
        <ProductDialog />
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[640px]">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Product</th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Category</th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Subcategory</th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Price</th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Flags</th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
                  Loading...
                </td>
              </tr>
            ) : products?.map((product) => (
              <tr key={product.id} className="hover:bg-accent/10 transition-colors" data-testid={`row-product-${product.id}`}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-accent shrink-0 overflow-hidden">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{product.title}</p>
                      {product.brand && (
                        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{product.brand}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs tracking-widest uppercase text-muted-foreground">{product.category}</td>
                <td className="px-4 py-4 text-xs text-muted-foreground">{product.subcategory || "—"}</td>
                <td className="px-4 py-4 text-sm">{product.price || "—"}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    {product.featured && (
                      <span className="text-[10px] tracking-widest uppercase bg-foreground text-background px-2 py-0.5">Featured</span>
                    )}
                    {product.trending && (
                      <span className="text-[10px] tracking-widest uppercase border border-foreground px-2 py-0.5">Trending</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <ProductDialog product={product} />
                    <button
                      onClick={() => handleDelete(product.id, product.title)}
                      className="text-destructive hover:text-destructive/70 transition-colors"
                      data-testid={`button-delete-product-${product.id}`}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    }
    if (e.key === "Backspace" && input === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="border border-border min-h-[44px] px-3 py-2 flex flex-wrap gap-2 items-center focus-within:ring-1 focus-within:ring-foreground">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 bg-accent text-foreground text-xs px-2 py-1">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder={placeholder || "Type and press Enter"}
        />
      </div>
    </div>
  );
}

type ProductFormData = {
  title: string;
  brand: string;
  description: string;
  category: string;
  subcategory: string;
  price: string;
  originalPrice: string;
  affiliateUrl: string;
  imageUrl: string;
  images: string[];
  colors: string[];
  sizes: string[];
  featured: boolean;
  trending: boolean;
};

function ProductDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const defaultForm = (): ProductFormData => ({
    title: product?.title ?? "",
    brand: product?.brand ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "women",
    subcategory: product?.subcategory ?? "",
    price: product?.price ?? "",
    originalPrice: product?.originalPrice ?? "",
    affiliateUrl: product?.affiliateUrl ?? "",
    imageUrl: product?.imageUrl ?? "",
    images: Array.isArray(product?.images) ? (product.images as string[]) : [],
    colors: Array.isArray(product?.colors) ? (product.colors as string[]) : [],
    sizes: Array.isArray(product?.sizes) ? (product.sizes as string[]) : [],
    featured: product?.featured ?? false,
    trending: product?.trending ?? false,
  });

  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [imageUrlInput, setImageUrlInput] = useState("");

  useEffect(() => {
    if (open) setForm(defaultForm());
  }, [open]);

  const { data: subcategories } = useListSubcategories(
    { category: form.category },
    { query: { queryKey: getListSubcategoriesQueryKey({ category: form.category }) } }
  );

  const set = (k: keyof ProductFormData) => (v: ProductFormData[typeof k]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (url && !form.images.includes(url)) {
      setForm((f) => ({ ...f, images: [...f.images, url] }));
    }
    setImageUrlInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      subcategory: form.subcategory || undefined,
      brand: form.brand || undefined,
      description: form.description || undefined,
      price: form.price || undefined,
      originalPrice: form.originalPrice || undefined,
      imageUrl: form.imageUrl || undefined,
    };
    if (product) {
      updateMutation.mutate(
        { id: product.id, data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product updated" });
            setOpen(false);
          },
          onError: () => toast({ title: "Failed to update product", variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product created" });
            setOpen(false);
          },
          onError: () => toast({ title: "Failed to create product", variant: "destructive" }),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid={`button-edit-product-${product.id}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <Button className="text-xs tracking-widest uppercase font-medium" data-testid="button-add-product">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light">
            {product ? "Edit Product" : "New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Title *</label>
              <Input required value={form.title} onChange={(e) => set("title")(e.target.value)} className="border-border" />
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Brand</label>
              <Input value={form.brand} onChange={(e) => set("brand")(e.target.value)} className="border-border" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Category *</label>
              <Select value={form.category} onValueChange={(v) => { set("category")(v); set("subcategory")(""); }}>
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Subcategory</label>
              <Select value={form.subcategory} onValueChange={set("subcategory")}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {subcategories?.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Price</label>
              <Input value={form.price} onChange={(e) => set("price")(e.target.value)} placeholder="$89" className="border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Original Price</label>
              <Input value={form.originalPrice} onChange={(e) => set("originalPrice")(e.target.value)} placeholder="$120" className="border-border" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Amazon Affiliate Link *</label>
            <Input required value={form.affiliateUrl} onChange={(e) => set("affiliateUrl")(e.target.value)} placeholder="https://amzn.to/..." className="border-border" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</label>
            <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={3} className="border-border resize-none" />
          </div>

          <TagInput label="Colors" values={form.colors} onChange={set("colors")} placeholder="Beige, Black, Cream..." />
          <TagInput label="Sizes" values={form.sizes} onChange={set("sizes")} placeholder="XS, S, M, L, XL..." />

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Main Image URL</label>
            <Input value={form.imageUrl} onChange={(e) => set("imageUrl")(e.target.value)} placeholder="https://..." className="border-border" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Additional Image URLs</label>
            <div className="flex gap-2">
              <Input
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); }}}
                placeholder="Paste URL and press Enter"
                className="border-border"
              />
              <Button type="button" variant="outline" onClick={addImageUrl} className="shrink-0">Add</Button>
            </div>
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.images.map((url, i) => (
                  <div key={i} className="flex items-center gap-1 bg-accent text-xs px-2 py-1 max-w-[200px]">
                    <span className="truncate">{url}</span>
                    <button type="button" onClick={() => set("images")(form.images.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3 shrink-0" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between border border-border px-4 py-3">
              <label className="text-xs tracking-widest uppercase">Featured</label>
              <Switch checked={form.featured} onCheckedChange={set("featured")} />
            </div>
            <div className="flex items-center justify-between border border-border px-4 py-3">
              <label className="text-xs tracking-widest uppercase">Trending</label>
              <Switch checked={form.trending} onCheckedChange={set("trending")} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending} className="text-xs tracking-widest uppercase" data-testid="button-save-product">
              {isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LooksTab() {
  const { data: looks, isLoading } = useListLooks();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteLook();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          toast({ title: "Look deleted" });
        },
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          {looks?.length ?? 0} looks
        </p>
        <LookDialog />
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[480px]">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Look</th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Items</th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
                  Loading...
                </td>
              </tr>
            ) : looks?.map((look) => (
              <tr key={look.id} className="hover:bg-accent/10 transition-colors" data-testid={`row-look-${look.id}`}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-accent shrink-0">
                      {look.imageUrl && <img src={look.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium">{look.title}</p>
                      {look.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{look.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground">{look.products?.length ?? 0} items</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <LookDialog look={look} />
                    <button
                      onClick={() => handleDelete(look.id, look.title)}
                      className="text-destructive hover:text-destructive/70 transition-colors"
                      data-testid={`button-delete-look-${look.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LookDialog({ look }: { look?: Look }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateLook();
  const updateMutation = useUpdateLook();

  const [form, setForm] = useState({
    title: look?.title ?? "",
    description: look?.description ?? "",
    imageUrl: look?.imageUrl ?? "",
    productIds: look?.products?.map((p) => p.id) ?? [],
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        title: look?.title ?? "",
        description: look?.description ?? "",
        imageUrl: look?.imageUrl ?? "",
        productIds: look?.products?.map((p) => p.id) ?? [],
      });
    }
  }, [open]);

  const { data: allProducts } = useListProducts(
    {},
    { query: { queryKey: getListProductsQueryKey() } }
  );

  const filtered = allProducts?.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (id: number) => {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((x) => x !== id)
        : [...f.productIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      productIds: form.productIds,
    };
    if (look) {
      updateMutation.mutate(
        { id: look.id, data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListLooksQueryKey() });
            toast({ title: "Look updated" });
            setOpen(false);
          },
          onError: () => toast({ title: "Failed to update look", variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListLooksQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
            toast({ title: "Look created" });
            setOpen(false);
          },
          onError: () => toast({ title: "Failed to create look", variant: "destructive" }),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {look ? (
          <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid={`button-edit-look-${look.id}`}>
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <Button className="text-xs tracking-widest uppercase font-medium" data-testid="button-add-look">
            <Plus className="h-4 w-4 mr-2" />
            Add Look
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light">{look ? "Edit Look" : "New Look"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Title *</label>
            <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="border-border" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Outfit Image URL</label>
            <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="border-border" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="border-border resize-none" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Products in Look</label>
              <span className="text-xs text-muted-foreground">{form.productIds.length} selected</span>
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="border-border mb-2"
            />
            <div className="border border-border max-h-52 overflow-y-auto divide-y divide-border">
              {filtered?.length === 0 ? (
                <p className="px-4 py-3 text-xs text-muted-foreground">No products found.</p>
              ) : filtered?.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors"
                  data-testid={`select-product-${p.id}`}
                >
                  <input
                    type="checkbox"
                    checked={form.productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="accent-foreground"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                    {p.brand && <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{p.brand}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending} className="text-xs tracking-widest uppercase" data-testid="button-save-look">
              {isPending ? "Saving..." : "Save Look"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: subcategories, isLoading } = useListSubcategories(
    {},
    { query: { queryKey: getListSubcategoriesQueryKey() } }
  );
  const createMutation = useCreateSubcategory();
  const deleteMutation = useDeleteSubcategory();

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("women");

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    subs: (subcategories ?? []).filter((s) => s.category === cat.value),
  }));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      { data: { category: newCategory as any, name: newName.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubcategoriesQueryKey() });
          toast({ title: "Subcategory added" });
          setNewName("");
        },
        onError: () => toast({ title: "Failed to add subcategory", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (sub: Subcategory) => {
    if (!confirm(`Delete "${sub.name}"?`)) return;
    deleteMutation.mutate(
      { id: sub.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubcategoriesQueryKey() });
          toast({ title: "Subcategory deleted" });
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="flex gap-3 items-end border border-border p-5">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Main Category</label>
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="w-44 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">New Subcategory Name</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sunglasses"
            className="border-border"
            data-testid="input-subcategory-name"
          />
        </div>
        <Button type="submit" disabled={createMutation.isPending} className="text-xs tracking-widest uppercase" data-testid="button-add-subcategory">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </form>

      {isLoading ? (
        <div className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grouped.map((group) => (
            <div key={group.value} className="border border-border">
              <div className="px-5 py-3 border-b border-border bg-card">
                <h3 className="text-xs tracking-widest uppercase font-medium">{group.label}</h3>
              </div>
              <div className="divide-y divide-border">
                {group.subs.length === 0 ? (
                  <p className="px-5 py-3 text-xs text-muted-foreground">No subcategories.</p>
                ) : (
                  group.subs.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between px-5 py-3" data-testid={`row-sub-${sub.id}`}>
                      <span className="text-sm">{sub.name}</span>
                      <button
                        onClick={() => handleDelete(sub)}
                        className="text-destructive hover:text-destructive/70 transition-colors"
                        data-testid={`button-delete-sub-${sub.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function SettingsTab() {
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (form.newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const body = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        toast({ title: "Password updated successfully" });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast({ title: body.error ?? "Failed to update password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-light mb-1">Settings</h2>
        <p className="text-xs text-muted-foreground tracking-wide">Manage your admin credentials.</p>
      </div>

      <div className="border border-border p-6">
        <h3 className="text-xs tracking-widest uppercase font-medium mb-6">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Password</label>
            <Input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
              className="border-border"
              data-testid="input-current-password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">New Password</label>
            <Input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
              minLength={6}
              className="border-border"
              data-testid="input-new-password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Confirm New Password</label>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
              className="border-border"
              data-testid="input-confirm-password"
            />
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="text-xs tracking-widest uppercase"
              data-testid="button-change-password"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
