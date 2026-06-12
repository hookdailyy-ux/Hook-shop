import { useState, useEffect, useMemo, useRef } from "react";
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
  useCreateSetup,
  useUpdateSetup,
  useDeleteSetup,
  useListSetups,
  useCreateSubcategory,
  useDeleteSubcategory,
  getListAdminProductsQueryKey,
  getListLooksQueryKey,
  getListSetupsQueryKey,
  getGetAdminStatsQueryKey,
  getListSubcategoriesQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import type { Product, Look, Setup, Subcategory } from "@workspace/api-client-react";
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
import { X, Plus, Trash2, Pencil, Loader2, Upload, Eye } from "lucide-react";
import {
  SingleImageUpload,
  MultiImageUpload,
} from "@/components/ImageUploadField";
import { CropModal } from "@/components/CropModal";
import { useUpload } from "@workspace/object-storage-web";
import {
  useSiteImages,
  useUpsertSiteImage,
  useDeleteSiteImage,
} from "@/hooks/useSiteImages";
import type { SiteImage, SiteImageKey } from "@/hooks/useSiteImages";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useLocation } from "wouter";
import { TeamTab } from "@/components/TeamTab";
import { AdminOrders } from "@/components/AdminOrders";
import { AdminRewards } from "@/components/AdminRewards";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import { NewsletterTab } from "@/components/NewsletterTab";
import { ScrollableTabBar } from "@/components/ScrollableTabBar";

type Tab =
  | "dashboard"
  | "products"
  | "looks"
  | "setups"
  | "categories"
  | "settings"
  | "images"
  | "team"
  | "orders"
  | "rewards"
  | "analytics"
  | "newsletter";

const CATEGORIES = [
  { value: "none", label: "None" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "couples", label: "Couples" },
  { value: "kids", label: "Kids" },
  { value: "electronics", label: "Electronics" },
  { value: "home", label: "Home Essentials" },
  { value: "accessories", label: "Accessories" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { logout } = useAdminAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-0">
            {/* Admin label + Logout — pinned left */}
            <div className="shrink-0 border-r border-border pr-4 mr-0 flex flex-col justify-center py-2">
              <span className="font-serif text-lg font-light tracking-wide text-foreground leading-tight">
                Admin
              </span>
              <button
                onClick={() => {
                  void handleLogout();
                }}
                className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors text-left"
                data-testid="button-logout"
              >
                Logout
              </button>
            </div>
            {/* Scrollable tabs */}
            <ScrollableTabBar>
              {(
                [
                  "dashboard",
                  "products",
                  "looks",
                  "setups",
                  "categories",
                  "settings",
                  "images",
                  "team",
                  "orders",
                  "rewards",
                  "analytics",
                  "newsletter",
                ] as Tab[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 whitespace-nowrap px-4 py-4 text-xs tracking-widest uppercase border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`tab-${tab}`}
                >
                  {tab}
                </button>
              ))}
            </ScrollableTabBar>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-8 md:pt-10">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "looks" && <LooksTab />}
        {activeTab === "setups" && <SetupsTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "images" && <SiteImagesTab />}
        {activeTab === "team" && <TeamTab />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "rewards" && <AdminRewards />}
        {activeTab === "analytics" && <AdminAnalytics />}
        {activeTab === "newsletter" && <NewsletterTab />}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value?: number;
  loading?: boolean;
}) {
  return (
    <div className="bg-card border border-border p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </p>
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
        <StatCard
          title="Products"
          value={stats?.totalProducts}
          loading={isLoading}
        />
        <StatCard title="Looks" value={stats?.totalLooks} loading={isLoading} />
        <StatCard
          title="Subscribers"
          value={stats?.totalSubscribers}
          loading={isLoading}
        />
        <StatCard
          title="Featured"
          value={stats?.featuredCount}
          loading={isLoading}
        />
        <StatCard
          title="Trending"
          value={stats?.trendingCount}
          loading={isLoading}
        />
      </div>

      {stats && (
        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xs tracking-widest uppercase">
              Products by Category
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {CATEGORIES.map((cat) => (
              <div key={cat.value} className="px-6 py-5">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
                  {cat.label}
                </p>
                <p className="font-serif text-3xl font-light">
                  {stats.productsByCategory[
                    cat.value as keyof typeof stats.productsByCategory
                  ] ?? 0}
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.brand?.toLowerCase().includes(q) ?? false) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategory?.toLowerCase().includes(q) ?? false),
    );
  }, [products, searchQuery]);

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListAdminProductsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetAdminStatsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });
          toast({ title: "Product deleted" });
        },
      },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          {searchQuery.trim()
            ? `${filteredProducts.length} of ${products?.length ?? 0} products`
            : `${products?.length ?? 0} products`}
        </p>
        <ProductDialog />
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by title, brand, category, subcategory…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 placeholder:text-muted-foreground placeholder:text-xs placeholder:tracking-wide"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[640px]">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Product
              </th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Category
              </th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Subcategory
              </th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Price
              </th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Flags
              </th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse"
                >
                  Loading...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-xs tracking-widest uppercase text-muted-foreground"
                >
                  {searchQuery.trim()
                    ? "No products match your search"
                    : "No products yet"}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-accent/10 transition-colors"
                  data-testid={`row-product-${product.id}`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-accent shrink-0 overflow-hidden">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {product.title}
                        </p>
                        {product.brand && (
                          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                            {product.brand}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs tracking-widest uppercase text-muted-foreground">
                    {product.category}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {product.subcategory || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm">{product.price || "—"}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {product.featured && (
                        <span className="text-[10px] tracking-widest uppercase bg-foreground text-background px-2 py-0.5">
                          Featured
                        </span>
                      )}
                      {product.trending && (
                        <span className="text-[10px] tracking-widest uppercase border border-foreground px-2 py-0.5">
                          Trending
                        </span>
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
              ))
            )}
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
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="border border-border min-h-[44px] px-3 py-2 flex flex-wrap gap-2 items-center focus-within:ring-1 focus-within:ring-foreground">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 bg-accent text-foreground text-xs px-2 py-1"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
            >
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


const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"] as const;

function SizePicker({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [customInput, setCustomInput] = useState("");

  const togglePreset = (size: string) =>
    onChange(
      values.includes(size)
        ? values.filter((s) => s !== size)
        : [...values, size],
    );

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setCustomInput("");
  };

  const customValues = values.filter(
    (v) => !(PRESET_SIZES as readonly string[]).includes(v),
  );

  return (
    <div className="space-y-3">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Sizes
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => togglePreset(size)}
            className={`px-3 py-1.5 text-[11px] tracking-widest uppercase border transition-colors ${
              values.includes(size)
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-foreground border-border hover:border-foreground/50"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Custom size (e.g. 38, 40) — press Enter"
          className="flex-1 border border-border px-3 py-2 text-sm outline-none bg-transparent focus:ring-1 focus:ring-foreground"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addCustom}
          className="shrink-0 text-xs"
        >
          Add
        </Button>
      </div>
      {customValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customValues.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 bg-accent text-xs px-2 py-1"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type ProductFormData = {
  title: string;
  brand: string;
  description: string;
  source: string;
  category: string;
  subcategory: string;
  price: string;
  originalPrice: string;
  affiliateUrl: string;
  amazonUrl: string;
  amazonPrice: string;
  externalId: string;
  imageUrl: string;
  images: string[];
  sizes: string[];
  status: string;
  featured: boolean;
  trending: boolean;
  imagePosX: number;
  imagePosY: number;
  imageScale: number;
  imageObjectFit: "cover" | "contain";
  placements: string[];
};

const PLACEMENT_OPTIONS = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "kids", label: "Kids" },
  { value: "couples", label: "Couples" },
  { value: "favorites", label: "Favorites" },
  { value: "home", label: "Home Essentials" },
  { value: "electronics", label: "Tech" },
  { value: "look", label: "Shop The Look" },
  { value: "setup", label: "Shop The Setup" },
] as const;

// ─── Shared full-form dialog for creating a product from Look/Setup context ───

function NewProductDialog({
  open,
  onOpenChange,
  onSuccess,
  contextLabel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: (id: number, title: string) => void;
  contextLabel: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateProduct();

  const makeDefault = (): ProductFormData => ({
    title: "",
    brand: "",
    description: "",
    source: "SHEIN",
    category: "women",
    subcategory: "",
    price: "",
    originalPrice: "",
    affiliateUrl: "",
    amazonUrl: "",
    amazonPrice: "",
    externalId: "",
    imageUrl: "",
    images: [],
    sizes: [],
    status: "active",
    featured: false,
    trending: false,
    imagePosX: 50,
    imagePosY: 50,
    imageScale: 100,
    imageObjectFit: "cover",
    placements: [],
  });

  const [form, setForm] = useState<ProductFormData>(makeDefault);
  const set = (k: keyof ProductFormData) => (v: ProductFormData[typeof k]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm(makeDefault());
  }, [open]);

  const { data: subcategories } = useListSubcategories(
    { category: form.category },
    { query: { queryKey: getListSubcategoriesQueryKey({ category: form.category }) } },
  );

  const pBtnClass =
    "w-8 h-8 border border-border flex items-center justify-center text-sm hover:bg-accent transition-colors select-none";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isElectronics = form.category === "electronics";
    const payload = {
      ...form,
      source: form.source as "SHEIN" | "Amazon",
      status: form.status as "active" | "hidden",
      subcategory: form.subcategory || undefined,
      brand: form.brand || undefined,
      description: form.description || undefined,
      price: form.price || undefined,
      originalPrice: form.originalPrice || undefined,
      imageUrl: form.imageUrl || undefined,
      amazonUrl: form.amazonUrl || undefined,
      amazonPrice: form.amazonPrice || undefined,
      externalId: form.externalId || undefined,
      placements: form.placements,
      affiliateUrl: isElectronics
        ? form.amazonUrl || form.affiliateUrl || ""
        : form.affiliateUrl,
    };
    createMutation.mutate(
      { data: payload as any },
      {
        onSuccess: (created) => {
          queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product created" });
          onSuccess(created.id, created.title);
          onOpenChange(false);
        },
        onError: () =>
          toast({ title: "Failed to create product", variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light">
            New Product
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* AI Assistant */}
          <div className="border border-border bg-muted/20 p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                HOOK AI Assistant
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Paste your affiliate link and upload your product images. AI
                will auto-fill title, brand, description, sizes, and category.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Affiliate Link
              </label>
              <Input
                value={form.affiliateUrl}
                onChange={(e) => set("affiliateUrl")(e.target.value)}
                placeholder="Paste Amazon / AliExpress affiliate link"
                className="border-border"
              />
            </div>
            <Button
              type="button"
              className="w-full text-xs tracking-widest uppercase"
              onClick={async () => {
                const response = await fetch("/api/ai/generate-product", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ affiliateUrl: form.affiliateUrl, images: form.images }),
                });
                const data = await response.json();
                if (data.success && data.product) {
                  set("title")(data.product.title || "");
                  set("brand")(data.product.brand || "");
                  set("description")(data.product.description || "");
                  set("sizes")(data.product.sizes || []);
                  set("category")(data.product.category || "women");
                }
              }}
            >
              ✨ Generate with HOOK AI
            </Button>
          </div>

          {/* Title + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Title *
              </label>
              <Input
                required
                value={form.title}
                onChange={(e) => set("title")(e.target.value)}
                className="border-border"
              />
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Brand
              </label>
              <Input
                value={form.brand}
                onChange={(e) => set("brand")(e.target.value)}
                className="border-border"
              />
            </div>
          </div>

          {/* Source + Status */}
          <div className="grid grid-cols-2 gap-4">
            {form.category !== "electronics" && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Product Source *
                </label>
                <Select value={form.source} onValueChange={set("source")}>
                  <SelectTrigger className="border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHEIN">SHEIN</SelectItem>
                    <SelectItem value="Amazon">Amazon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div
              className={
                form.category === "electronics"
                  ? "col-span-2 space-y-2"
                  : "space-y-2"
              }
            >
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Status
              </label>
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Category *
              </label>
              <Select
                value={form.category}
                onValueChange={(v) => {
                  set("category")(v);
                  set("subcategory")("");
                }}
              >
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Subcategory
              </label>
              <Select value={form.subcategory} onValueChange={set("subcategory")}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {subcategories?.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Placement */}
          <div className="border border-border p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                Product Placement
              </p>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                By default the product appears in its primary category above.
                Check boxes to <strong>also</strong> show it in other sections,
                or to <strong>override</strong> placement entirely.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {PLACEMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <input
                    type="checkbox"
                    className="accent-foreground"
                    checked={form.placements.includes(opt.value)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.placements, opt.value]
                        : form.placements.filter((v) => v !== opt.value);
                      set("placements")(next);
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Price — hidden for electronics */}
          {form.category !== "electronics" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Price
                </label>
                <Input
                  value={form.price}
                  onChange={(e) => set("price")(e.target.value)}
                  placeholder="AED 89"
                  className="border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Original Price
                </label>
                <Input
                  value={form.originalPrice}
                  onChange={(e) => set("originalPrice")(e.target.value)}
                  placeholder="AED 129"
                  className="border-border"
                />
              </div>
            </div>
          )}

          {/* Product Link — hidden for electronics */}
          {form.category !== "electronics" && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Product Link *
              </label>
              <Input
                required={form.category !== "electronics"}
                value={form.affiliateUrl}
                onChange={(e) => set("affiliateUrl")(e.target.value)}
                placeholder="https://..."
                className="border-border"
              />
            </div>
          )}

          {/* Electronics: Amazon Store Link */}
          {form.category === "electronics" && (
            <div className="border border-border/60 p-4 space-y-4">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                Amazon Store
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Amazon Price
                  </label>
                  <Input
                    value={form.amazonPrice}
                    onChange={(e) => set("amazonPrice")(e.target.value)}
                    placeholder="AED 779"
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Amazon URL
                  </label>
                  <Input
                    value={form.amazonUrl}
                    onChange={(e) => set("amazonUrl")(e.target.value)}
                    placeholder="https://amzn.to/..."
                    className="border-border"
                  />
                </div>
              </div>
            </div>
          )}

          {/* External Product ID — hidden for electronics */}
          {form.category !== "electronics" && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {form.source === "Amazon" ? "Amazon ASIN" : "SHEIN SKU"}{" "}
                <span className="normal-case tracking-normal font-normal opacity-60">
                  (optional)
                </span>
              </label>
              <Input
                value={form.externalId}
                onChange={(e) => set("externalId")(e.target.value)}
                placeholder={
                  form.source === "Amazon"
                    ? "e.g. B08N5WRWNW"
                    : "e.g. 3456789012"
                }
                className="border-border"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              rows={3}
              className="border-border resize-none"
            />
          </div>

          {/* Sizes */}
          <SizePicker values={form.sizes} onChange={set("sizes")} />

          {/* Main Image Upload */}
          <SingleImageUpload
            value={form.imageUrl}
            onChange={set("imageUrl")}
            label="Main Product Image"
          />

          {/* Image Positioning */}
          {form.imageUrl && (
            <div className="border border-border p-3 flex flex-col gap-2">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                Image Positioning
              </p>
              <div className="aspect-[3/4] overflow-hidden relative max-h-40 bg-accent">
                <img
                  src={form.imageUrl}
                  alt=""
                  className="absolute w-full h-full"
                  style={{
                    objectFit: form.imageObjectFit,
                    objectPosition: `${form.imagePosX}% ${form.imagePosY}%`,
                    transform: `scale(${form.imageScale / 100})`,
                    transformOrigin: `${form.imagePosX}% ${form.imagePosY}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground flex-1">
                  Fit
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      imageObjectFit:
                        f.imageObjectFit === "contain" ? "cover" : "contain",
                    }))
                  }
                  className={`px-3 py-1 text-[9px] tracking-widest uppercase border transition-colors ${form.imageObjectFit === "contain" ? "border-foreground bg-foreground text-background" : "border-border"}`}
                >
                  {form.imageObjectFit === "contain" ? "Contain" : "Cover"}
                </button>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, imagePosY: Math.max(0, f.imagePosY - 5) }))
                  }
                  className={pBtnClass}
                  title="Move up"
                >
                  ↑
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, imagePosX: Math.max(0, f.imagePosX - 5) }))
                    }
                    className={pBtnClass}
                    title="Move left"
                  >
                    ←
                  </button>
                  <div className="w-8 h-8 border border-border/40 bg-accent/30 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground/50">·</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, imagePosX: Math.min(100, f.imagePosX + 5) }))
                    }
                    className={pBtnClass}
                    title="Move right"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, imagePosY: Math.min(100, f.imagePosY + 5) }))
                  }
                  className={pBtnClass}
                  title="Move down"
                >
                  ↓
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, imageScale: Math.max(50, f.imageScale - 10) }))
                  }
                  className={pBtnClass}
                  title="Zoom out"
                >
                  −
                </button>
                <span className="flex-1 text-center text-[9px] tracking-widest text-muted-foreground">
                  {form.imageScale}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, imageScale: Math.min(200, f.imageScale + 10) }))
                  }
                  className={pBtnClass}
                  title="Zoom in"
                >
                  +
                </button>
              </div>
              <p className="text-[9px] text-center text-muted-foreground/60">
                x {form.imagePosX}% · y {form.imagePosY}%
              </p>
            </div>
          )}

          {/* Gallery Images */}
          <MultiImageUpload
            values={form.images}
            onChange={set("images")}
            label="Gallery Images (back view, close-up, detail shots…)"
          />

          {/* Featured + Trending */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between border border-border px-4 py-3">
              <label className="text-xs tracking-widest uppercase">
                Featured
              </label>
              <Switch checked={form.featured} onCheckedChange={set("featured")} />
            </div>
            <div className="flex items-center justify-between border border-border px-4 py-3">
              <label className="text-xs tracking-widest uppercase">
                Trending
              </label>
              <Switch checked={form.trending} onCheckedChange={set("trending")} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="text-xs tracking-widest uppercase"
            >
              {createMutation.isPending
                ? "Creating..."
                : `Create & Add to ${contextLabel}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const defaultForm = (): ProductFormData => ({
    title: product?.title ?? "",
    brand: product?.brand ?? "",
    description: product?.description ?? "",
    source: (product as any)?.source ?? "SHEIN",
    category: product?.category ?? "women",
    subcategory: product?.subcategory ?? "",
    price: product?.price ?? "",
    originalPrice: product?.originalPrice ?? "",
    affiliateUrl: product?.affiliateUrl ?? "",
    amazonUrl: (product as any)?.amazonUrl ?? "",
    amazonPrice: (product as any)?.amazonPrice ?? "",
    externalId: (product as any)?.externalId ?? "",
    imageUrl: product?.imageUrl ?? "",
    images: Array.isArray(product?.images) ? (product.images as string[]) : [],
    sizes: Array.isArray(product?.sizes) ? (product.sizes as string[]) : [],
    status: (product as any)?.status ?? "active",
    featured: product?.featured ?? false,
    trending: product?.trending ?? false,
    imagePosX: product?.imagePosX ?? 50,
    imagePosY: product?.imagePosY ?? 50,
    imageScale: product?.imageScale ?? 100,
    imageObjectFit: (product?.imageObjectFit as "cover" | "contain") ?? "cover",
    placements: Array.isArray((product as any)?.placements) ? ((product as any).placements as string[]) : [],
  });

  const [form, setForm] = useState<ProductFormData>(defaultForm);

  useEffect(() => {
    if (open) setForm(defaultForm());
  }, [open]);

  const { data: subcategories } = useListSubcategories(
    { category: form.category },
    {
      query: {
        queryKey: getListSubcategoriesQueryKey({ category: form.category }),
      },
    },
  );

  const set = (k: keyof ProductFormData) => (v: ProductFormData[typeof k]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isElectronics = form.category === "electronics";
    const payload = {
      ...form,
      source: form.source as "SHEIN" | "Amazon",
      status: form.status as "active" | "hidden",
      subcategory: form.subcategory || undefined,
      brand: form.brand || undefined,
      description: form.description || undefined,
      price: form.price || undefined,
      originalPrice: form.originalPrice || undefined,
      imageUrl: form.imageUrl || undefined,
      amazonUrl: form.amazonUrl || undefined,
      amazonPrice: form.amazonPrice || undefined,
      externalId: form.externalId || undefined,
      placements: form.placements,
      affiliateUrl: isElectronics
        ? form.amazonUrl || form.affiliateUrl || ""
        : form.affiliateUrl,
    };
    if (product) {
      updateMutation.mutate(
        { id: product.id, data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListAdminProductsQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getListProductsQueryKey(),
            });
            toast({ title: "Product updated" });
            setOpen(false);
          },
          onError: () =>
            toast({
              title: "Failed to update product",
              variant: "destructive",
            }),
        },
      );
    } else {
      createMutation.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListAdminProductsQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetAdminStatsQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getListProductsQueryKey(),
            });
            toast({ title: "Product created" });
            setOpen(false);
          },
          onError: () =>
            toast({
              title: "Failed to create product",
              variant: "destructive",
            }),
        },
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
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
            <Button
              className="text-xs tracking-widest uppercase font-medium"
              data-testid="button-add-product"
            >
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
            <div className="border border-border bg-muted/20 p-4 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  HOOK AI Assistant
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste your affiliate link and upload your product images. AI
                  will help generate the product name, Arabic name, description,
                  colors, sizes, and category.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Affiliate Link
                </label>
                <Input
                  value={form.affiliateUrl}
                  onChange={(e) => set("affiliateUrl")(e.target.value)}
                  placeholder="Paste Amazon / AliExpress affiliate link"
                  className="border-border"
                />
              </div>

              <Button
                type="button"
                className="w-full text-xs tracking-widest uppercase"
                onClick={async () => {
                  const response = await fetch("/api/ai/generate-product", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      affiliateUrl: form.affiliateUrl,
                      images: form.images,
                    }),
                  });

                  const data = await response.json();
if (data.success && data.product) {
  set("title")(data.product.title || "");
  set("brand")(data.product.brand || "");
  set("description")(data.product.description || "");
  set("sizes")(data.product.sizes || []);
  set("category")(data.product.category || "women");
} else {
  console.log("HOOK AI response:", data);
}
                }}
              >
                ✨ Generate with HOOK AI
              </Button>
            </div>
            {/* Title + Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Title *
                </label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => set("title")(e.target.value)}
                  className="border-border"
                  data-testid="input-product-title"
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Brand
                </label>
                <Input
                  value={form.brand}
                  onChange={(e) => set("brand")(e.target.value)}
                  className="border-border"
                />
              </div>
            </div>

            {/* Source + Status */}
            <div className="grid grid-cols-2 gap-4">
              {form.category !== "electronics" && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Product Source *
                  </label>
                  <Select value={form.source} onValueChange={set("source")}>
                    <SelectTrigger
                      className="border-border"
                      data-testid="select-product-source"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHEIN">SHEIN</SelectItem>
                      <SelectItem value="Amazon">Amazon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div
                className={
                  form.category === "electronics"
                    ? "col-span-2 space-y-2"
                    : "space-y-2"
                }
              >
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Status
                </label>
                <Select value={form.status} onValueChange={set("status")}>
                  <SelectTrigger
                    className="border-border"
                    data-testid="select-product-status"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category + Subcategory */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Category *
                </label>
                <Select
                  value={form.category}
                  onValueChange={(v) => {
                    set("category")(v);
                    set("subcategory")("");
                  }}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Subcategory
                </label>
                <Select
                  value={form.subcategory}
                  onValueChange={set("subcategory")}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {subcategories?.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Placement */}
            <div className="border border-border p-4 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                  Product Placement
                </p>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                  By default the product appears in its primary category above. Check boxes to <strong>also</strong> show it in other sections, or to <strong>override</strong> placement entirely.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {PLACEMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="accent-foreground"
                      checked={form.placements.includes(opt.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.placements, opt.value]
                          : form.placements.filter((v) => v !== opt.value);
                        set("placements")(next);
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {form.placements.length > 0 && (
                <button
                  type="button"
                  onClick={() => set("placements")([])}
                  className="text-[9px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear placements
                </button>
              )}
            </div>

            {/* Price — hidden for electronics (uses amazon price instead) */}
            {form.category !== "electronics" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Price
                  </label>
                  <Input
                    value={form.price}
                    onChange={(e) => set("price")(e.target.value)}
                    placeholder="$89"
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Original Price
                  </label>
                  <Input
                    value={form.originalPrice}
                    onChange={(e) => set("originalPrice")(e.target.value)}
                    placeholder="$120"
                    className="border-border"
                  />
                </div>
              </div>
            )}

            {/* Product Link — hidden for electronics (uses amazon URL instead) */}
            {form.category !== "electronics" && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Product Link *
                </label>
                <Input
                  required
                  value={form.affiliateUrl}
                  onChange={(e) => set("affiliateUrl")(e.target.value)}
                  placeholder={
                    form.source === "Amazon"
                      ? "https://amzn.to/..."
                      : "https://shein.com/..."
                  }
                  className="border-border"
                  data-testid="input-affiliate-url"
                />
              </div>
            )}

            {/* Electronics: Amazon Store Link */}
            {form.category === "electronics" && (
              <div className="border border-border/60 p-4 space-y-4">
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                  Amazon Store
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Amazon Price
                    </label>
                    <Input
                      value={form.amazonPrice}
                      onChange={(e) => set("amazonPrice")(e.target.value)}
                      placeholder="AED 779"
                      className="border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Amazon URL
                    </label>
                    <Input
                      value={form.amazonUrl}
                      onChange={(e) => set("amazonUrl")(e.target.value)}
                      placeholder="https://amzn.to/..."
                      className="border-border"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* External Product ID — hidden for electronics */}
            {form.category !== "electronics" && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {form.source === "Amazon" ? "Amazon ASIN" : "SHEIN SKU"}{" "}
                  <span className="normal-case tracking-normal font-normal opacity-60">
                    (optional)
                  </span>
                </label>
                <Input
                  value={form.externalId}
                  onChange={(e) => set("externalId")(e.target.value)}
                  placeholder={
                    form.source === "Amazon"
                      ? "e.g. B08N5WRWNW"
                      : "e.g. sw2205185848"
                  }
                  className="border-border"
                  data-testid="input-external-id"
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                rows={3}
                className="border-border resize-none"
              />
            </div>

            {/* Sizes — preset chips + custom */}
            <SizePicker values={form.sizes} onChange={set("sizes")} />

            {/* Main Image Upload */}
            <SingleImageUpload
              value={form.imageUrl}
              onChange={set("imageUrl")}
              label="Main Product Image"
            />

            {/* Product Image Positioning */}
            {form.imageUrl &&
              (() => {
                const pBtnClass =
                  "w-8 h-8 border border-border flex items-center justify-center text-sm hover:bg-accent transition-colors select-none";
                return (
                  <div className="border border-border p-3 flex flex-col gap-2">
                    <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                      Image Positioning
                    </p>
                    <div className="aspect-[3/4] overflow-hidden relative max-h-40 bg-accent">
                      <img
                        src={form.imageUrl}
                        alt=""
                        className="absolute w-full h-full"
                        style={{
                          objectFit: form.imageObjectFit,
                          objectPosition: `${form.imagePosX}% ${form.imagePosY}%`,
                          transform: `scale(${form.imageScale / 100})`,
                          transformOrigin: `${form.imagePosX}% ${form.imagePosY}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground flex-1">
                        Fit
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            imageObjectFit:
                              f.imageObjectFit === "contain"
                                ? "cover"
                                : "contain",
                          }))
                        }
                        className={`px-3 py-1 text-[9px] tracking-widest uppercase border transition-colors ${form.imageObjectFit === "contain" ? "border-foreground bg-foreground text-background" : "border-border"}`}
                      >
                        {form.imageObjectFit === "contain"
                          ? "Contain"
                          : "Cover"}
                      </button>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            imagePosY: Math.max(0, f.imagePosY - 5),
                          }))
                        }
                        className={pBtnClass}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              imagePosX: Math.max(0, f.imagePosX - 5),
                            }))
                          }
                          className={pBtnClass}
                          title="Move left"
                        >
                          ←
                        </button>
                        <div className="w-8 h-8 border border-border/40 bg-accent/30 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground/50">
                            ·
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              imagePosX: Math.min(100, f.imagePosX + 5),
                            }))
                          }
                          className={pBtnClass}
                          title="Move right"
                        >
                          →
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            imagePosY: Math.min(100, f.imagePosY + 5),
                          }))
                        }
                        className={pBtnClass}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            imageScale: Math.max(50, f.imageScale - 10),
                          }))
                        }
                        className={pBtnClass}
                        title="Zoom out"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-[9px] tracking-widest text-muted-foreground">
                        {form.imageScale}%
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            imageScale: Math.min(200, f.imageScale + 10),
                          }))
                        }
                        className={pBtnClass}
                        title="Zoom in"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[9px] text-center text-muted-foreground/60">
                      x {form.imagePosX}% · y {form.imagePosY}%
                    </p>
                  </div>
                );
              })()}

            {/* Gallery Images Upload */}
            <MultiImageUpload
              values={form.images}
              onChange={set("images")}
              label="Gallery Images (back view, close-up, detail shots…)"
            />

            {/* Featured + Trending */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between border border-border px-4 py-3">
                <label className="text-xs tracking-widest uppercase">
                  Featured
                </label>
                <Switch
                  checked={form.featured}
                  onCheckedChange={set("featured")}
                />
              </div>
              <div className="flex items-center justify-between border border-border px-4 py-3">
                <label className="text-xs tracking-widest uppercase">
                  Trending
                </label>
                <Switch
                  checked={form.trending}
                  onCheckedChange={set("trending")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="text-xs tracking-widest uppercase border-border gap-2"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="text-xs tracking-widest uppercase"
                data-testid="button-save-product"
              >
                {isPending ? "Saving..." : "Save Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Full-screen product preview overlay */}
      {previewOpen && (
        <div className="fixed inset-0 z-[300] bg-background overflow-auto">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
              Product Preview
            </p>
            <button
              onClick={() => setPreviewOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
              {/* Image */}
              <div className="aspect-[3/4] bg-accent overflow-hidden relative">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt={form.title}
                    className="absolute w-full h-full"
                    style={{
                      objectFit: form.imageObjectFit,
                      objectPosition: `${form.imagePosX}% ${form.imagePosY}%`,
                      transform: `scale(${form.imageScale / 100})`,
                      transformOrigin: `${form.imagePosX}% ${form.imagePosY}%`,
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                      No image
                    </p>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex flex-col">
                {form.brand && (
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                    {form.brand}
                  </p>
                )}
                <h1 className="font-serif text-3xl md:text-4xl font-light leading-tight mb-4">
                  {form.title || "Product Title"}
                </h1>
                {(form.price || form.originalPrice) && (
                  <div className="flex items-baseline gap-3 mb-6">
                    {form.price && (
                      <p className="text-xl font-medium">{form.price}</p>
                    )}
                    {form.originalPrice && (
                      <p className="text-sm text-muted-foreground line-through">
                        {form.originalPrice}
                      </p>
                    )}
                  </div>
                )}
                {form.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-7">
                    {form.description}
                  </p>
                )}
                {/* CTA preview */}
                <div className="mt-auto pt-4">
                  {form.category === "electronics" &&
                  form.amazonUrl ? (
                    <div className="flex gap-4">
                      {form.amazonUrl && (
                        <div className="flex-1 border border-border p-4 flex flex-col gap-3">
                          <p className="text-[10px] tracking-widest uppercase font-semibold">
                            Amazon
                          </p>
                          {form.amazonPrice && (
                            <p className="text-2xl font-medium tracking-tight">
                              {form.amazonPrice}
                            </p>
                          )}
                          <span className="w-full text-center border border-foreground text-foreground text-[10px] tracking-widest uppercase py-3 block">
                            Amazon
                          </span>
                          <p className="text-[9px] tracking-wide text-muted-foreground text-center">
                            Delivered by Amazon
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="w-full text-center bg-foreground text-background text-xs tracking-widest uppercase py-5 block">
                      Order Now
                    </span>
                  )}
                </div>
              </div>
            </div>
            {form.images.length > 0 && (
              <div className="mt-10">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4">
                  Gallery
                </p>
                <div className="flex gap-3 overflow-x-auto">
                  {[form.imageUrl, ...form.images]
                    .filter(Boolean)
                    .map((img, i) => (
                      <div
                        key={i}
                        className="shrink-0 w-24 aspect-[3/4] bg-accent overflow-hidden"
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
          queryClient.invalidateQueries({
            queryKey: getGetAdminStatsQueryKey(),
          });
          toast({ title: "Look deleted" });
        },
      },
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
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Look
              </th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Items
              </th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              looks?.map((look) => (
                <tr
                  key={look.id}
                  className="hover:bg-accent/10 transition-colors"
                  data-testid={`row-look-${look.id}`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-accent shrink-0">
                        {look.imageUrl && (
                          <img
                            src={look.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{look.title}</p>
                        {look.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {look.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {look.products?.length ?? 0} items
                  </td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LookDialog({ look }: { look?: Look }) {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateLook();
  const updateMutation = useUpdateLook();

  const [form, setForm] = useState({
    title: look?.title ?? "",
    description: look?.description ?? "",
    imageUrl: look?.imageUrl ?? "",
    images: Array.isArray((look as any)?.images) ? (look as any).images as string[] : [],
    imagePosX: look?.imagePosX ?? 50,
    imagePosY: look?.imagePosY ?? 50,
    imageScale: look?.imageScale ?? 100,
    imageObjectFit: (look as any)?.imageObjectFit ?? "cover",
    productIds: look?.products?.map((p) => p.id) ?? [],
  });
  const [search, setSearch] = useState("");
  const [newProductOpen, setNewProductOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        title: look?.title ?? "",
        description: look?.description ?? "",
        imageUrl: look?.imageUrl ?? "",
        images: Array.isArray((look as any)?.images) ? (look as any).images as string[] : [],
        imagePosX: look?.imagePosX ?? 50,
        imagePosY: look?.imagePosY ?? 50,
        imageScale: look?.imageScale ?? 100,
        imageObjectFit: (look as any)?.imageObjectFit ?? "cover",
        productIds: look?.products?.map((p) => p.id) ?? [],
      });
    }
  }, [open]);

  const { data: allProducts } = useListProducts(
    {},
    { query: { queryKey: getListProductsQueryKey() } },
  );

  const lookImageInputRef = useRef<HTMLInputElement>(null);
  const lookCardBase = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");
  const { uploadFile: uploadLookImage, isUploading: isLookImageUploading } =
    useUpload({
      basePath: `${lookCardBase}/api/storage`,
      onSuccess: (res) =>
        setForm((f) => ({
          ...f,
          imageUrl: `${lookCardBase}/api/storage${res.objectPath}`,
        })),
    });
  const [lookCropSrc, setLookCropSrc] = useState<string | null>(null);
  const [lookPendingFile, setLookPendingFile] = useState<File | null>(null);
  const openLookCrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { setLookPendingFile(file); setLookCropSrc(e.target?.result as string); };
    reader.readAsDataURL(file);
  };
  const lookBtnClass =
    "w-8 h-8 border border-border flex items-center justify-center text-sm hover:bg-accent transition-colors select-none";

  const filtered = allProducts?.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand ?? "").toLowerCase().includes(search.toLowerCase()),
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
      images: form.images,
      imagePosX: form.imagePosX,
      imagePosY: form.imagePosY,
      imageScale: form.imageScale,
      imageObjectFit: form.imageObjectFit,
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
          onError: () =>
            toast({ title: "Failed to update look", variant: "destructive" }),
        },
      );
    } else {
      createMutation.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListLooksQueryKey() });
            queryClient.invalidateQueries({
              queryKey: getGetAdminStatsQueryKey(),
            });
            toast({ title: "Look created" });
            setOpen(false);
          },
          onError: () =>
            toast({ title: "Failed to create look", variant: "destructive" }),
        },
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {look ? (
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-edit-look-${look.id}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : (
            <Button
              className="text-xs tracking-widest uppercase font-medium"
              data-testid="button-add-look"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Look
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light">
              {look ? "Edit Look" : "New Look"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Title *
              </label>
              <Input
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Outfit Image
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => lookImageInputRef.current?.click()}
                  disabled={isLookImageUploading}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-border py-2 text-[10px] tracking-widest uppercase text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors disabled:opacity-40"
                >
                  <Upload className="h-3 w-3" />
                  {form.imageUrl ? "Replace" : "Upload"}
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    className="w-9 flex items-center justify-center border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {lookCropSrc && (
                <CropModal
                  imageSrc={lookCropSrc}
                  onConfirm={async (blob) => {
                    setLookCropSrc(null);
                    const file = new File([blob], lookPendingFile?.name ?? "cover.jpg", { type: "image/jpeg" });
                    setLookPendingFile(null);
                    await uploadLookImage(file);
                  }}
                  onSkip={async () => {
                    const file = lookPendingFile;
                    setLookCropSrc(null);
                    setLookPendingFile(null);
                    if (file) await uploadLookImage(file);
                  }}
                />
              )}
              <input
                ref={lookImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) openLookCrop(f);
                  e.target.value = "";
                }}
              />
              {form.imageUrl && (
                <div className="border border-border p-3 flex flex-col gap-2">
                  <div className="aspect-[3/4] overflow-hidden relative max-h-40 bg-accent">
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="absolute w-full h-full"
                      style={{
                        objectFit: form.imageObjectFit as "cover" | "contain",
                        objectPosition: `${form.imagePosX}% ${form.imagePosY}%`,
                        transform: `scale(${form.imageScale / 100})`,
                        transformOrigin: `${form.imagePosX}% ${form.imagePosY}%`,
                      }}
                    />
                    {isLookImageUploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] tracking-widest uppercase text-muted-foreground flex-1">
                      Fit
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          imageObjectFit:
                            f.imageObjectFit === "contain"
                              ? "cover"
                              : "contain",
                        }))
                      }
                      className={`px-3 py-1 text-[9px] tracking-widest uppercase border transition-colors ${form.imageObjectFit === "contain" ? "border-foreground bg-foreground text-background" : "border-border"}`}
                    >
                      {form.imageObjectFit === "contain" ? "Contain" : "Cover"}
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          imagePosY: Math.max(0, f.imagePosY - 5),
                        }))
                      }
                      className={lookBtnClass}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            imagePosX: Math.max(0, f.imagePosX - 5),
                          }))
                        }
                        className={lookBtnClass}
                        title="Move left"
                      >
                        ←
                      </button>
                      <div className="w-8 h-8 border border-border/40 bg-accent/30 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/50">
                          ·
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            imagePosX: Math.min(100, f.imagePosX + 5),
                          }))
                        }
                        className={lookBtnClass}
                        title="Move right"
                      >
                        →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          imagePosY: Math.min(100, f.imagePosY + 5),
                        }))
                      }
                      className={lookBtnClass}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          imageScale: Math.max(50, f.imageScale - 10),
                        }))
                      }
                      className={lookBtnClass}
                      title="Zoom out"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-[9px] tracking-widest text-muted-foreground">
                      {form.imageScale}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          imageScale: Math.min(200, f.imageScale + 10),
                        }))
                      }
                      className={lookBtnClass}
                      title="Zoom in"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[9px] text-center text-muted-foreground/60">
                    x {form.imagePosX}% · y {form.imagePosY}%
                  </p>
                </div>
              )}
            </div>
            <MultiImageUpload
              label="Gallery Images"
              values={form.images}
              onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
            />
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="border-border resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Products in Look
                </label>
                <span className="text-xs text-muted-foreground">
                  {form.productIds.length} selected
                </span>
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="border-border mb-2"
              />
              <div className="border border-border max-h-52 overflow-y-auto divide-y divide-border">
                {filtered?.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">
                    No products found.
                  </p>
                ) : (
                  filtered?.map((p) => (
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
                        <p className="text-sm font-medium line-clamp-1">
                          {p.title}
                        </p>
                        {p.brand && (
                          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                            {p.brand}
                          </p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Create New Product — opens full product form */}
            <div className="border border-dashed border-border">
              <button
                type="button"
                onClick={() => setNewProductOpen(true)}
                className="w-full px-4 py-3 flex items-center gap-2 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-toggle-new-product-look"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Product
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="text-xs tracking-widest uppercase border-border gap-2"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="text-xs tracking-widest uppercase"
                data-testid="button-save-look"
              >
                {isPending ? "Saving..." : "Save Look"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <NewProductDialog
        open={newProductOpen}
        onOpenChange={setNewProductOpen}
        contextLabel="Look"
        onSuccess={(id, title) => {
          setForm((f) => ({ ...f, productIds: [...f.productIds, id] }));
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: `"${title}" added to look` });
        }}
      />

      {/* Full-screen look preview overlay */}
      {previewOpen && (
        <div className="fixed inset-0 z-[300] bg-background overflow-auto">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
              Look Preview
            </p>
            <button
              onClick={() => setPreviewOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Look Image */}
              <div className="aspect-[3/4] bg-accent overflow-hidden relative">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt={form.title}
                    className="absolute w-full h-full"
                    style={{
                      objectFit: form.imageObjectFit as "cover" | "contain",
                      objectPosition: `${form.imagePosX}% ${form.imagePosY}%`,
                      transform: `scale(${form.imageScale / 100})`,
                      transformOrigin: `${form.imagePosX}% ${form.imagePosY}%`,
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                      No image
                    </p>
                  </div>
                )}
              </div>
              {/* Look Info */}
              <div className="flex flex-col justify-center">
                <h1 className="font-serif text-3xl font-light leading-tight mb-4">
                  {form.title || "Look Title"}
                </h1>
                {form.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {form.description}
                  </p>
                )}
                {form.productIds.length > 0 && (
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                    {form.productIds.length} product
                    {form.productIds.length !== 1 ? "s" : ""} in this look
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUPS TAB
// ─────────────────────────────────────────────────────────────────────────────

function SetupsTab() {
  const { data: setups, isLoading } = useListSetups();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteSetup();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSetupsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          toast({ title: "Setup deleted" });
        },
      },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          {setups?.length ?? 0} setups
        </p>
        <SetupDialog />
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[480px]">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Setup
              </th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Items
              </th>
              <th className="px-4 py-3 text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-xs tracking-widest uppercase text-muted-foreground animate-pulse"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              setups?.map((setup) => (
                <tr
                  key={setup.id}
                  className="hover:bg-accent/10 transition-colors"
                  data-testid={`row-setup-${setup.id}`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-accent shrink-0">
                        {setup.imageUrl && (
                          <img
                            src={setup.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{setup.title}</p>
                        {setup.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {setup.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {setup.products?.length ?? 0} items
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <SetupDialog setup={setup} />
                      <button
                        onClick={() => handleDelete(setup.id, setup.title)}
                        className="text-destructive hover:text-destructive/70 transition-colors"
                        data-testid={`button-delete-setup-${setup.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SetupDialog({ setup }: { setup?: Setup }) {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateSetup();
  const updateMutation = useUpdateSetup();

  const [form, setForm] = useState({
    title: setup?.title ?? "",
    description: setup?.description ?? "",
    imageUrl: setup?.imageUrl ?? "",
    images: Array.isArray((setup as any)?.images) ? (setup as any).images as string[] : [],
    imagePosX: setup?.imagePosX ?? 50,
    imagePosY: setup?.imagePosY ?? 50,
    imageScale: setup?.imageScale ?? 100,
    imageObjectFit: (setup as any)?.imageObjectFit ?? "cover",
    productIds: setup?.products?.map((p) => p.id) ?? [],
  });
  const [search, setSearch] = useState("");
  const [newProductOpen, setNewProductOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        title: setup?.title ?? "",
        description: setup?.description ?? "",
        imageUrl: setup?.imageUrl ?? "",
        images: Array.isArray((setup as any)?.images) ? (setup as any).images as string[] : [],
        imagePosX: setup?.imagePosX ?? 50,
        imagePosY: setup?.imagePosY ?? 50,
        imageScale: setup?.imageScale ?? 100,
        imageObjectFit: (setup as any)?.imageObjectFit ?? "cover",
        productIds: setup?.products?.map((p) => p.id) ?? [],
      });
    }
  }, [open]);

  const { data: allProducts } = useListProducts(
    {},
    { query: { queryKey: getListProductsQueryKey() } },
  );

  const setupImageInputRef = useRef<HTMLInputElement>(null);
  const setupCardBase = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");
  const { uploadFile: uploadSetupImage, isUploading: isSetupImageUploading } =
    useUpload({
      basePath: `${setupCardBase}/api/storage`,
      onSuccess: (res) =>
        setForm((f) => ({
          ...f,
          imageUrl: `${setupCardBase}/api/storage${res.objectPath}`,
        })),
    });
  const [setupCropSrc, setSetupCropSrc] = useState<string | null>(null);
  const [setupPendingFile, setSetupPendingFile] = useState<File | null>(null);
  const openSetupCrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { setSetupPendingFile(file); setSetupCropSrc(e.target?.result as string); };
    reader.readAsDataURL(file);
  };
  const setupBtnClass =
    "w-8 h-8 border border-border flex items-center justify-center text-sm hover:bg-accent transition-colors select-none";

  const filtered = allProducts?.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand ?? "").toLowerCase().includes(search.toLowerCase()),
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
      images: form.images,
      imagePosX: form.imagePosX,
      imagePosY: form.imagePosY,
      imageScale: form.imageScale,
      imageObjectFit: form.imageObjectFit,
      productIds: form.productIds,
    };
    if (setup) {
      updateMutation.mutate(
        { id: setup.id, data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSetupsQueryKey() });
            toast({ title: "Setup updated" });
            setOpen(false);
          },
          onError: () =>
            toast({ title: "Failed to update setup", variant: "destructive" }),
        },
      );
    } else {
      createMutation.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSetupsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
            toast({ title: "Setup created" });
            setOpen(false);
          },
          onError: () =>
            toast({ title: "Failed to create setup", variant: "destructive" }),
        },
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {setup ? (
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-edit-setup-${setup.id}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : (
            <Button
              className="text-xs tracking-widest uppercase font-medium"
              data-testid="button-add-setup"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Setup
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light">
              {setup ? "Edit Setup" : "New Setup"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Title *
              </label>
              <Input
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Setup Image
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setupImageInputRef.current?.click()}
                  disabled={isSetupImageUploading}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-border py-2 text-[10px] tracking-widest uppercase text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors disabled:opacity-40"
                >
                  <Upload className="h-3 w-3" />
                  {form.imageUrl ? "Replace" : "Upload"}
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    className="w-9 flex items-center justify-center border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {setupCropSrc && (
                <CropModal
                  imageSrc={setupCropSrc}
                  onConfirm={async (blob) => {
                    setSetupCropSrc(null);
                    const file = new File([blob], setupPendingFile?.name ?? "cover.jpg", { type: "image/jpeg" });
                    setSetupPendingFile(null);
                    await uploadSetupImage(file);
                  }}
                  onSkip={async () => {
                    const file = setupPendingFile;
                    setSetupCropSrc(null);
                    setSetupPendingFile(null);
                    if (file) await uploadSetupImage(file);
                  }}
                />
              )}
              <input
                ref={setupImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) openSetupCrop(f);
                  e.target.value = "";
                }}
              />
              {form.imageUrl && (
                <div className="border border-border p-3 flex flex-col gap-2">
                  <div className="aspect-[3/4] overflow-hidden relative max-h-40 bg-accent">
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="absolute w-full h-full"
                      style={{
                        objectFit: form.imageObjectFit as "cover" | "contain",
                        objectPosition: `${form.imagePosX}% ${form.imagePosY}%`,
                        transform: `scale(${form.imageScale / 100})`,
                        transformOrigin: `${form.imagePosX}% ${form.imagePosY}%`,
                      }}
                    />
                    {isSetupImageUploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] tracking-widest uppercase text-muted-foreground flex-1">
                      Fit
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          imageObjectFit:
                            f.imageObjectFit === "contain" ? "cover" : "contain",
                        }))
                      }
                      className={`px-3 py-1 text-[9px] tracking-widest uppercase border transition-colors ${form.imageObjectFit === "contain" ? "border-foreground bg-foreground text-background" : "border-border"}`}
                    >
                      {form.imageObjectFit === "contain" ? "Contain" : "Cover"}
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imagePosY: Math.max(0, f.imagePosY - 5) }))}
                      className={setupBtnClass}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, imagePosX: Math.max(0, f.imagePosX - 5) }))}
                        className={setupBtnClass}
                        title="Move left"
                      >
                        ←
                      </button>
                      <div className="w-8 h-8 border border-border/40 bg-accent/30 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/50">·</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, imagePosX: Math.min(100, f.imagePosX + 5) }))}
                        className={setupBtnClass}
                        title="Move right"
                      >
                        →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imagePosY: Math.min(100, f.imagePosY + 5) }))}
                      className={setupBtnClass}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageScale: Math.max(50, f.imageScale - 10) }))}
                      className={setupBtnClass}
                      title="Zoom out"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-[9px] tracking-widest text-muted-foreground">
                      {form.imageScale}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageScale: Math.min(200, f.imageScale + 10) }))}
                      className={setupBtnClass}
                      title="Zoom in"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[9px] text-center text-muted-foreground/60">
                    x {form.imagePosX}% · y {form.imagePosY}%
                  </p>
                </div>
              )}
            </div>
            <MultiImageUpload
              label="Gallery Images"
              values={form.images}
              onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
            />
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="border-border resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Products in Setup
                </label>
                <span className="text-xs text-muted-foreground">
                  {form.productIds.length} selected
                </span>
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="border-border mb-2"
              />
              <div className="border border-border max-h-52 overflow-y-auto divide-y divide-border">
                {filtered?.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">
                    No products found.
                  </p>
                ) : (
                  filtered?.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors"
                      data-testid={`select-product-setup-${p.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={form.productIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="accent-foreground"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                        {p.brand && (
                          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                            {p.brand}
                          </p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Create New Product — opens full product form */}
            <div className="border border-dashed border-border">
              <button
                type="button"
                onClick={() => setNewProductOpen(true)}
                className="w-full px-4 py-3 flex items-center gap-2 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-toggle-new-product-setup"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Product
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="text-xs tracking-widest uppercase border-border gap-2"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="text-xs tracking-widest uppercase"
                data-testid="button-save-setup"
              >
                {isPending ? "Saving..." : "Save Setup"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <NewProductDialog
        open={newProductOpen}
        onOpenChange={setNewProductOpen}
        contextLabel="Setup"
        onSuccess={(id, title) => {
          setForm((f) => ({ ...f, productIds: [...f.productIds, id] }));
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: `"${title}" added to setup` });
        }}
      />

      {/* Full-screen setup preview overlay */}
      {previewOpen && (
        <div className="fixed inset-0 z-[300] bg-background overflow-auto">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
              Setup Preview
            </p>
            <button
              onClick={() => setPreviewOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="aspect-[3/4] bg-accent overflow-hidden relative">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt={form.title}
                    className="absolute w-full h-full"
                    style={{
                      objectFit: form.imageObjectFit as "cover" | "contain",
                      objectPosition: `${form.imagePosX}% ${form.imagePosY}%`,
                      transform: `scale(${form.imageScale / 100})`,
                      transformOrigin: `${form.imagePosX}% ${form.imagePosY}%`,
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                      No image
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="font-serif text-3xl font-light leading-tight mb-4">
                  {form.title || "Setup Title"}
                </h1>
                {form.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {form.description}
                  </p>
                )}
                {form.productIds.length > 0 && (
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                    {form.productIds.length} product
                    {form.productIds.length !== 1 ? "s" : ""} in this setup
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoriesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: subcategories, isLoading } = useListSubcategories(
    {},
    { query: { queryKey: getListSubcategoriesQueryKey() } },
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
          queryClient.invalidateQueries({
            queryKey: getListSubcategoriesQueryKey(),
          });
          toast({ title: "Subcategory added" });
          setNewName("");
        },
        onError: () =>
          toast({ title: "Failed to add subcategory", variant: "destructive" }),
      },
    );
  };

  const handleDelete = (sub: Subcategory) => {
    if (!confirm(`Delete "${sub.name}"?`)) return;
    deleteMutation.mutate(
      { id: sub.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListSubcategoriesQueryKey(),
          });
          toast({ title: "Subcategory deleted" });
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleAdd}
        className="flex gap-3 items-end border border-border p-5"
      >
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Main Category
          </label>
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="w-44 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            New Subcategory Name
          </label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sunglasses"
            className="border-border"
            data-testid="input-subcategory-name"
          />
        </div>
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="text-xs tracking-widest uppercase"
          data-testid="button-add-subcategory"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </form>

      {isLoading ? (
        <div className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grouped.map((group) => (
            <div key={group.value} className="border border-border">
              <div className="px-5 py-3 border-b border-border bg-card">
                <h3 className="text-xs tracking-widest uppercase font-medium">
                  {group.label}
                </h3>
              </div>
              <div className="divide-y divide-border">
                {group.subs.length === 0 ? (
                  <p className="px-5 py-3 text-xs text-muted-foreground">
                    No subcategories.
                  </p>
                ) : (
                  group.subs.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between px-5 py-3"
                      data-testid={`row-sub-${sub.id}`}
                    >
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

const BASE = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");

function SettingsTab() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [discoverUrl, setDiscoverUrl] = useState("");
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverFetched, setDiscoverFetched] = useState(false);

  const [sheinGeneralUrl, setSheinGeneralUrl] = useState("");
  const [amazonGeneralUrl, setAmazonGeneralUrl] = useState("");
  const [supplierLinksLoading, setSupplierLinksLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/site-settings`)
      .then((r) => r.json())
      .then((d: { discoverMoreUrl?: string; sheinGeneralUrl?: string; amazonGeneralUrl?: string }) => {
        setDiscoverUrl(d.discoverMoreUrl ?? "");
        setSheinGeneralUrl(d.sheinGeneralUrl ?? "");
        setAmazonGeneralUrl(d.amazonGeneralUrl ?? "");
        setDiscoverFetched(true);
      })
      .catch(() => setDiscoverFetched(true));
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (form.newPassword.length < 6) {
      toast({
        title: "Password must be at least 6 characters",
        variant: "destructive",
      });
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
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        toast({ title: "Password updated successfully" });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast({
          title: body.error ?? "Failed to update password",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierLinksSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierLinksLoading(true);
    try {
      const res = await fetch(`${BASE}/api/site-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheinGeneralUrl, amazonGeneralUrl }),
      });
      if (res.ok) {
        toast({ title: "Supplier links saved" });
      } else {
        toast({ title: "Failed to save links", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setSupplierLinksLoading(false);
    }
  };

  const handleDiscoverSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscoverLoading(true);
    try {
      const res = await fetch(`${BASE}/api/site-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoverMoreUrl: discoverUrl }),
      });
      if (res.ok) {
        toast({ title: "Discover More link saved" });
      } else {
        toast({ title: "Failed to save link", variant: "destructive" });
      }
    } catch {
      toast({
        title: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDiscoverLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-8">
      <div className="mb-2">
        <h2 className="font-serif text-2xl font-light mb-1">Settings</h2>
        <p className="text-xs text-muted-foreground tracking-wide">
          Manage links and admin credentials.
        </p>
      </div>

      {/* Supplier General Links */}
      <div className="border border-border p-6">
        <h3 className="text-xs tracking-widest uppercase font-medium mb-2">
          Supplier General Links
        </h3>
        <p className="text-[10px] text-muted-foreground tracking-wide mb-5 leading-relaxed">
          These links appear as <strong>"Explore More via SHEIN / Amazon"</strong> buttons in the basket under each supplier group.
        </p>
        <form onSubmit={handleSupplierLinksSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              SHEIN General Link
            </label>
            <Input
              type="url"
              value={sheinGeneralUrl}
              onChange={(e) => setSheinGeneralUrl(e.target.value)}
              placeholder="https://shein.com/..."
              disabled={!discoverFetched}
              className="border-border"
              data-testid="input-shein-general-url"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Amazon General Link
            </label>
            <Input
              type="url"
              value={amazonGeneralUrl}
              onChange={(e) => setAmazonGeneralUrl(e.target.value)}
              placeholder="https://amazon.com/..."
              disabled={!discoverFetched}
              className="border-border"
              data-testid="input-amazon-general-url"
            />
          </div>
          <div className="pt-1">
            <Button
              type="submit"
              disabled={supplierLinksLoading || !discoverFetched}
              className="text-xs tracking-widest uppercase"
              data-testid="button-save-supplier-links"
            >
              {supplierLinksLoading ? "Saving..." : "Save Links"}
            </Button>
          </div>
        </form>
      </div>

      {/* SHEIN Referral Link */}
      <div className="border border-border p-6">
        <h3 className="text-xs tracking-widest uppercase font-medium mb-2">
          ✨ Explore More via SHEIN
        </h3>
        <p className="text-[10px] text-muted-foreground tracking-wide mb-2 leading-relaxed">
          Paste your SHEIN referral link here. An{" "}
          <strong>"✨ Explore More via SHEIN"</strong> button will appear on all
          SHEIN-powered sections:
        </p>
        <ul className="text-[10px] text-muted-foreground mb-5 space-y-1 pl-3 leading-relaxed list-disc">
          <li>Women</li>
          <li>Men</li>
          <li>Shop The Look</li>
          <li>Women Accessories &amp; Men Accessories</li>
          <li>Home Essentials</li>
        </ul>
        <form onSubmit={handleDiscoverSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              SHEIN Referral URL
            </label>
            <Input
              type="url"
              value={discoverUrl}
              onChange={(e) => setDiscoverUrl(e.target.value)}
              placeholder="https://shein.com/..."
              disabled={!discoverFetched}
              className="border-border"
              data-testid="input-discover-url"
            />
          </div>
          <div className="pt-1 flex items-center gap-3">
            <Button
              type="submit"
              disabled={discoverLoading || !discoverFetched}
              className="text-xs tracking-widest uppercase"
              data-testid="button-save-discover-url"
            >
              {discoverLoading ? "Saving..." : "Save Link"}
            </Button>
            {discoverUrl && (
              <a
                href={discoverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-widest uppercase text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Preview
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="border border-border p-6">
        <h3 className="text-xs tracking-widest uppercase font-medium mb-6">
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Current Password
            </label>
            <Input
              type="password"
              value={form.currentPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
              required
              className="border-border"
              data-testid="input-current-password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              New Password
            </label>
            <Input
              type="password"
              value={form.newPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, newPassword: e.target.value }))
              }
              required
              minLength={6}
              className="border-border"
              data-testid="input-new-password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
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

      {/* Footer Links */}
      <FooterLinksSection />

      {/* WhatsApp Contact */}
      <WhatsAppSection />

      {/* App Icons & Favicon */}
      <IconsSection />
    </div>
  );
}

type FooterLink = { id: string; label: string; url: string };

function FooterLinksSection() {
  const { toast } = useToast();
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/site-settings`)
      .then((r) => r.json())
      .then((d: { footerLinks?: FooterLink[] }) => {
        setLinks(d.footerLinks ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const saveLinks = async (updated: FooterLink[]) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/site-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ footerLinks: updated }),
      });
      if (res.ok) {
        setLinks(updated);
        toast({ title: "Footer links saved" });
      } else {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    const next: FooterLink = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      label: newLabel.trim(),
      url: newUrl.trim(),
    };
    void saveLinks([...links, next]);
    setNewLabel("");
    setNewUrl("");
  };

  const handleDelete = (id: string) =>
    void saveLinks(links.filter((l) => l.id !== id));

  const handleEditSave = (id: string) => {
    void saveLinks(
      links.map((l) =>
        l.id === id ? { ...l, label: editLabel, url: editUrl } : l,
      ),
    );
    setEditId(null);
  };

  return (
    <div className="border border-border p-6">
      <h3 className="text-xs tracking-widest uppercase font-medium mb-1">
        Footer Links
      </h3>
      <p className="text-[10px] text-muted-foreground tracking-wide mb-5 leading-relaxed">
        Links shown in the footer. Each opens in a new tab.
      </p>
      {!loaded ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2 mb-5">
          {links.length === 0 && (
            <p className="text-[10px] text-muted-foreground/60">
              No links yet.
            </p>
          )}
          {links.map((link) => (
            <div key={link.id} className="border border-border p-3">
              {editId === link.id ? (
                <div className="space-y-2">
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="Label"
                    className="border-border text-xs h-8"
                  />
                  <Input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="URL"
                    className="border-border text-xs h-8"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditSave(link.id)}
                      disabled={saving}
                      className="text-[10px] tracking-widest uppercase h-7"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditId(null)}
                      className="text-[10px] tracking-widest uppercase h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{link.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditId(link.id);
                        setEditLabel(link.label);
                        setEditUrl(link.url);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="border border-dashed border-border p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Add New Link
        </p>
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label (e.g. Instagram)"
          className="border-border text-xs h-8"
          data-testid="input-footer-link-label"
        />
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="URL (e.g. https://instagram.com/...)"
          className="border-border text-xs h-8"
          data-testid="input-footer-link-url"
        />
        <Button
          onClick={handleAdd}
          disabled={saving || !newLabel.trim() || !newUrl.trim()}
          className="text-[10px] tracking-widest uppercase h-8"
          data-testid="button-add-footer-link"
        >
          <Plus className="h-3 w-3 mr-1.5" />
          Add Link
        </Button>
      </div>
    </div>
  );
}

function WhatsAppSection() {
  const { toast } = useToast();
  const [text, setText] = useState("Contact Us");
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState(
    "Hi, I have a question about your products!",
  );
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/site-settings`)
      .then((r) => r.json())
      .then(
        (d: {
          whatsappText?: string;
          whatsappNumber?: string;
          whatsappMessage?: string;
        }) => {
          if (d.whatsappText !== undefined)
            setText(d.whatsappText || "Contact Us");
          if (d.whatsappNumber !== undefined) setNumber(d.whatsappNumber);
          if (d.whatsappMessage !== undefined)
            setMessage(
              d.whatsappMessage || "Hi, I have a question about your products!",
            );
          setLoaded(true);
        },
      )
      .catch(() => setLoaded(true));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/site-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappText: text,
          whatsappNumber: number,
          whatsappMessage: message,
        }),
      });
      if (res.ok) toast({ title: "WhatsApp settings saved" });
      else toast({ title: "Failed to save", variant: "destructive" });
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border p-6">
      <h3 className="text-xs tracking-widest uppercase font-medium mb-1">
        Contact Us Button
      </h3>
      <p className="text-[10px] text-muted-foreground tracking-wide mb-5 leading-relaxed">
        A WhatsApp button shown in the footer. Leave number blank to hide it.
      </p>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Button Text
          </label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contact Us"
            disabled={!loaded}
            className="border-border"
            data-testid="input-whatsapp-text"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            WhatsApp Number
          </label>
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. 447911123456 (no + or spaces)"
            disabled={!loaded}
            className="border-border"
            data-testid="input-whatsapp-number"
          />
          <p className="text-[10px] text-muted-foreground">
            Country code first, no + or spaces
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Default Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, I have a question..."
            disabled={!loaded}
            className="border-border text-xs"
            rows={3}
            data-testid="input-whatsapp-message"
          />
        </div>
        {number && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <p className="text-[10px] text-green-800 dark:text-green-400 tracking-wide">
              Preview:{" "}
              <a
                href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Test WhatsApp link
              </a>
            </p>
          </div>
        )}
        <Button
          type="submit"
          disabled={saving || !loaded}
          className="text-xs tracking-widest uppercase"
          data-testid="button-save-whatsapp"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
}

function IconsSection() {
  const { toast } = useToast();
  const BASE_PATH = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");
  const { uploadFile } = useUpload({ basePath: `${BASE_PATH}/api/storage` });
  const [icons, setIcons] = useState({
    faviconUrl: "",
    appleTouchIconUrl: "",
    pwaIcon192Url: "",
    pwaIcon512Url: "",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/site-settings`)
      .then((r) => r.json())
      .then(
        (d: {
          faviconUrl?: string;
          appleTouchIconUrl?: string;
          pwaIcon192Url?: string;
          pwaIcon512Url?: string;
        }) => {
          setIcons({
            faviconUrl: d.faviconUrl ?? "",
            appleTouchIconUrl: d.appleTouchIconUrl ?? "",
            pwaIcon192Url: d.pwaIcon192Url ?? "",
            pwaIcon512Url: d.pwaIcon512Url ?? "",
          });
          setLoaded(true);
        },
      )
      .catch(() => setLoaded(true));
  }, []);

  const handleUpload = async (file: File, field: keyof typeof icons) => {
    const result = await uploadFile(file);
    if (!result) {
      toast({ title: "Upload failed", variant: "destructive" });
      return;
    }
    const url = `${BASE_PATH}/api/storage${result.objectPath}`;
    try {
      const res = await fetch(`${BASE}/api/site-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: url }),
      });
      if (res.ok) {
        setIcons((prev) => ({ ...prev, [field]: url }));
        toast({ title: "Icon saved" });
      } else {
        toast({ title: "Failed to save icon", variant: "destructive" });
      }
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const iconFields: {
    field: keyof typeof icons;
    key: string;
    label: string;
    desc: string;
  }[] = [
    {
      field: "faviconUrl",
      key: "favicon",
      label: "Favicon (browser tab)",
      desc: "Recommended: 32×32 ICO or PNG",
    },
    {
      field: "appleTouchIconUrl",
      key: "apple",
      label: "Apple Touch Icon (iOS home screen)",
      desc: "Recommended: 180×180 PNG",
    },
    {
      field: "pwaIcon192Url",
      key: "icon192",
      label: "App Icon 192×192 (Android)",
      desc: "Recommended: 192×192 PNG",
    },
    {
      field: "pwaIcon512Url",
      key: "icon512",
      label: "App Icon 512×512 (PWA)",
      desc: "Recommended: 512×512 PNG",
    },
  ];

  return (
    <div className="border border-border p-6">
      <h3 className="text-xs tracking-widest uppercase font-medium mb-1">
        App Icon &amp; Favicon
      </h3>
      <p className="text-[10px] text-muted-foreground tracking-wide mb-6 leading-relaxed">
        Icons shown in browser tabs, iOS/Android home screens, and when users
        install HOOK as an app.
      </p>
      {!loaded ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-6">
          {iconFields.map(({ field, key, label, desc }) => (
            <div key={field}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                {label}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mb-3">
                {desc}
              </p>
              <div className="flex items-center gap-3">
                {icons[field] ? (
                  <img
                    src={icons[field]}
                    alt={label}
                    className="w-10 h-10 object-contain border border-border"
                  />
                ) : (
                  <div className="w-10 h-10 border border-dashed border-border flex items-center justify-center">
                    <Upload className="h-3.5 w-3.5 text-muted-foreground/30" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(file, field);
                    }}
                  />
                  <span className="text-[10px] tracking-widest uppercase border border-border px-3 py-2 hover:bg-accent transition-colors cursor-pointer">
                    {icons[field] ? "Replace" : "Upload"}
                  </span>
                </label>
                {icons[field] && (
                  <a
                    href={icons[field]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SITE_IMAGE_SECTIONS: Array<{ key: SiteImageKey; label: string }> = [
  { key: "hero", label: "Home Hero" },
  { key: "women", label: "Women" },
  { key: "men", label: "Men" },
  { key: "couples", label: "Couples" },
  { key: "kids", label: "Kids" },
  { key: "accessories", label: "Accessories" },
  { key: "home", label: "Home Essentials" },
  { key: "electronics", label: "Electronics" },
  { key: "look", label: "Shop The Look" },
  { key: "setup", label: "Shop The Setup" },
  { key: "favorites", label: "Favorites" },
];

function SiteImagesTab() {
  const { data: images } = useSiteImages();
  const upsertMutation = useUpsertSiteImage();
  const deleteMutation = useDeleteSiteImage();
  const { toast } = useToast();

  const handlePositionChange = (
    key: SiteImageKey,
    field: keyof SiteImage,
    delta: number,
  ) => {
    const current = images?.[key];
    if (!current) return;
    const min = field === "scale" ? 50 : 0;
    const max = field === "scale" ? 200 : 100;
    const updated: SiteImage = {
      ...current,
      [field]: Math.max(min, Math.min(max, (current[field] as number) + delta)),
    };
    upsertMutation.mutate({ key, data: updated });
  };

  const handleFitToggle = (key: SiteImageKey) => {
    const current = images?.[key];
    if (!current) return;
    const newFit = current.objectFit === "contain" ? "cover" : "contain";
    upsertMutation.mutate({ key, data: { ...current, objectFit: newFit } });
  };

  const handleDelete = (key: SiteImageKey, label: string) => {
    if (!confirm(`Delete the ${label} image?`)) return;
    deleteMutation.mutate(key, {
      onSuccess: () => toast({ title: "Image deleted" }),
    });
  };

  const handleUploaded = (key: SiteImageKey, imageUrl: string) => {
    const current = images?.[key];
    upsertMutation.mutate(
      {
        key,
        data: {
          imageUrl,
          posX: current?.posX ?? 50,
          posY: current?.posY ?? 50,
          scale: current?.scale ?? 100,
          objectFit: current?.objectFit ?? "cover",
        },
      },
      { onSuccess: () => toast({ title: "Image saved" }) },
    );
  };

  return (
    <div>
      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6">
        {SITE_IMAGE_SECTIONS.length} sections
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {SITE_IMAGE_SECTIONS.map(({ key, label }) => (
          <SectionImageCard
            key={key}
            label={label}
            image={images?.[key]}
            onUploaded={(url) => handleUploaded(key, url)}
            onDelete={() => handleDelete(key, label)}
            onPositionChange={(field, delta) =>
              handlePositionChange(key, field, delta)
            }
            onFitToggle={() => handleFitToggle(key)}
          />
        ))}
      </div>
    </div>
  );
}

function SectionImageCard({
  label,
  image,
  onUploaded,
  onDelete,
  onPositionChange,
  onFitToggle,
}: {
  label: string;
  image?: SiteImage;
  onUploaded: (url: string) => void;
  onDelete: () => void;
  onPositionChange: (field: keyof SiteImage, delta: number) => void;
  onFitToggle?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardBase = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");
  const { uploadFile, isUploading, progress } = useUpload({
    basePath: `${cardBase}/api/storage`,
    onSuccess: (res) => {
      onUploaded(`${cardBase}/api/storage${res.objectPath}`);
    },
  });

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target?.result as string);
      setPendingFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (blob: Blob) => {
    const file = new File([blob], pendingFile?.name ?? "image.jpg", { type: "image/jpeg" });
    void uploadFile(file);
    setCropSrc(null);
    setPendingFile(null);
  };

  const handleCropSkip = () => {
    if (pendingFile) void uploadFile(pendingFile);
    setCropSrc(null);
    setPendingFile(null);
  };

  const btnClass =
    "w-8 h-8 border border-border flex items-center justify-center text-sm hover:bg-accent transition-colors select-none";
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      {/* ── Full-screen preview modal ── */}
      {showPreview && image && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/40 mb-0.5">
                Hero Preview
              </p>
              <p className="text-sm tracking-widest uppercase text-white font-light">
                {label}
              </p>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 text-white/60 hover:text-white transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6 overflow-auto">
            {/* Mobile preview */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[9px] tracking-widest uppercase text-white/30">
                Mobile
              </p>
              <div className="w-72 h-44 relative overflow-hidden bg-[#e8e0d4] shadow-2xl">
                <img
                  src={image.imageUrl}
                  alt=""
                  className="absolute w-full h-full"
                  style={{
                    objectFit: image.objectFit ?? "cover",
                    objectPosition: `${image.posX}% ${image.posY}%`,
                    transform: `scale(${image.scale / 100})`,
                    transformOrigin: `${image.posX}% ${image.posY}%`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
                <div className="absolute inset-0 flex flex-col justify-end px-5 pb-5">
                  <p className="font-serif text-xl text-white leading-tight">
                    {label}
                  </p>
                  <p className="text-[9px] tracking-widest uppercase text-white/60 mt-1">
                    Preview
                  </p>
                </div>
              </div>
            </div>
            {/* Desktop preview */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[9px] tracking-widest uppercase text-white/30">
                Desktop
              </p>
              <div className="w-full max-w-2xl h-52 relative overflow-hidden bg-[#e8e0d4] shadow-2xl">
                <img
                  src={image.imageUrl}
                  alt=""
                  className="absolute w-full h-full"
                  style={{
                    objectFit: image.objectFit ?? "cover",
                    objectPosition: `${image.posX}% ${image.posY}%`,
                    transform: `scale(${image.scale / 100})`,
                    transformOrigin: `${image.posX}% ${image.posY}%`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-8">
                  <p className="font-serif text-4xl text-white leading-tight">
                    {label}
                  </p>
                  <p className="text-[10px] tracking-widest uppercase text-white/60 mt-1">
                    Preview
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[9px] tracking-widest uppercase text-white/30">
              zoom {image.scale}% · x {image.posX}% · y {image.posY}% ·{" "}
              {image.objectFit ?? "cover"}
            </p>
          </div>
        </div>
      )}

      <div className="border border-border p-4 flex flex-col gap-3">
        <p className="text-[10px] tracking-widest uppercase font-medium">
          {label}
        </p>

        <div className="aspect-video bg-accent overflow-hidden relative">
          {image?.imageUrl ? (
            <img
              src={image.imageUrl}
              alt=""
              className="absolute w-full h-full"
              style={{
                objectFit: image.objectFit ?? "cover",
                objectPosition: `${image.posX}% ${image.posY}%`,
                transform: `scale(${image.scale / 100})`,
                transformOrigin: `${image.posX}% ${image.posY}%`,
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground/40">
                No Image
              </p>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                {progress}%
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-border py-2 text-[10px] tracking-widest uppercase text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors disabled:opacity-40"
          >
            <Upload className="h-3 w-3" />
            {image ? "Replace" : "Upload"}
          </button>
          {image && (
            <>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="w-9 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                title="Preview"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="w-9 flex items-center justify-center border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {image && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground flex-1">
                Fit
              </p>
              <button
                onClick={onFitToggle}
                className={`px-3 py-1 text-[9px] tracking-widest uppercase border transition-colors ${image.objectFit === "contain" ? "border-foreground bg-foreground text-background" : "border-border"}`}
              >
                {image.objectFit === "contain" ? "Contain" : "Cover"}
              </button>
            </div>
            <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
              Position
            </p>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => onPositionChange("posY", -5)}
                className={btnClass}
                title="Move up"
              >
                ↑
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => onPositionChange("posX", -5)}
                  className={btnClass}
                  title="Move left"
                >
                  ←
                </button>
                <div className="w-8 h-8 border border-border/40 bg-accent/30 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/50">
                    ·
                  </span>
                </div>
                <button
                  onClick={() => onPositionChange("posX", 5)}
                  className={btnClass}
                  title="Move right"
                >
                  →
                </button>
              </div>
              <button
                onClick={() => onPositionChange("posY", 5)}
                className={btnClass}
                title="Move down"
              >
                ↓
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPositionChange("scale", -10)}
                className={btnClass}
                title="Zoom out"
              >
                −
              </button>
              <span className="flex-1 text-center text-[9px] tracking-widest text-muted-foreground">
                {image.scale}%
              </span>
              <button
                onClick={() => onPositionChange("scale", 10)}
                className={btnClass}
                title="Zoom in"
              >
                +
              </button>
            </div>
            <p className="text-[9px] text-center text-muted-foreground/60">
              x {image.posX}% · y {image.posY}%
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onSkip={handleCropSkip}
        />
      )}
    </>
  );
}
