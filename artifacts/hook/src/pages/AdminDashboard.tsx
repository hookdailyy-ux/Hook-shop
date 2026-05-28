import { useState } from "react";
import { 
  useGetAdminStats, 
  useListAdminProducts, 
  useListLooks,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateLook,
  useUpdateLook,
  useDeleteLook,
  getListAdminProductsQueryKey,
  getListLooksQueryKey,
  getGetAdminStatsQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductUpdateCategory, ProductInputCategory, Product, Look } from "@workspace/api-client-react/src/generated/api.schemas";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: products, isLoading: productsLoading } = useListAdminProducts();
  const { data: looks, isLoading: looksLoading } = useListLooks();
  
  const [activeTab, setActiveTab] = useState<"products" | "looks">("products");

  return (
    <div className="py-12 bg-accent/10 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="font-serif text-4xl mb-12 font-light">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <StatCard title="Total Products" value={stats?.totalProducts} loading={statsLoading} />
          <StatCard title="Total Looks" value={stats?.totalLooks} loading={statsLoading} />
          <StatCard title="Subscribers" value={stats?.totalSubscribers} loading={statsLoading} />
          <StatCard title="Featured" value={stats?.featuredCount} loading={statsLoading} />
        </div>

        <div className="flex gap-4 mb-8">
          <button 
            className={`text-sm tracking-widest uppercase pb-2 border-b-2 transition-colors ${activeTab === "products" ? "border-foreground font-semibold" : "border-transparent text-muted-foreground hover:border-border"}`}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>
          <button 
            className={`text-sm tracking-widest uppercase pb-2 border-b-2 transition-colors ${activeTab === "looks" ? "border-foreground font-semibold" : "border-transparent text-muted-foreground hover:border-border"}`}
            onClick={() => setActiveTab("looks")}
          >
            Looks
          </button>
        </div>

        {activeTab === "products" ? (
          <ProductsTable products={products} isLoading={productsLoading} />
        ) : (
          <LooksTable looks={looks} isLoading={looksLoading} />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, loading }: { title: string, value?: number, loading?: boolean }) {
  return (
    <div className="bg-background border border-border p-6">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{title}</h3>
      {loading ? (
        <div className="h-10 w-16 bg-accent animate-pulse" />
      ) : (
        <p className="font-serif text-4xl font-light">{value || 0}</p>
      )}
    </div>
  );
}

function ProductsTable({ products, isLoading }: { products?: Product[], isLoading: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteProduct();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          toast({ title: "Product deleted" });
        }
      });
    }
  };

  return (
    <div className="bg-background border border-border">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
        <h2 className="font-serif text-xl">Products</h2>
        <ProductDialog />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium tracking-widest">Title</th>
              <th className="px-6 py-4 font-medium tracking-widest">Category</th>
              <th className="px-6 py-4 font-medium tracking-widest">Price</th>
              <th className="px-6 py-4 font-medium tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground tracking-widest uppercase">
                  Loading...
                </td>
              </tr>
            ) : products?.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-6 py-4 font-medium">{product.title}</td>
                <td className="px-6 py-4 uppercase text-xs tracking-wider text-muted-foreground">{product.category}</td>
                <td className="px-6 py-4">{product.price ? `$${product.price}` : '-'}</td>
                <td className="px-6 py-4 text-right">
                  <ProductDialog product={product} />
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="text-xs uppercase tracking-widest text-destructive hover:text-destructive/80 ml-4"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    category: product?.category || "women",
    price: product?.price || "",
    originalPrice: product?.originalPrice || "",
    imageUrl: product?.imageUrl || "",
    affiliateUrl: product?.affiliateUrl || "",
    brand: product?.brand || "",
    featured: product?.featured || false,
    trending: product?.trending || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      updateMutation.mutate({ id: product.id, data: formData as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
          toast({ title: "Product updated" });
          setOpen(false);
        }
      });
    } else {
      createMutation.mutate({ data: formData as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          toast({ title: "Product created" });
          setOpen(false);
          setFormData({
            title: "", description: "", category: "women", price: "", originalPrice: "", imageUrl: "", affiliateUrl: "", brand: "", featured: false, trending: false
          });
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <button className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">Edit</button>
        ) : (
          <Button className="text-xs uppercase tracking-widest font-semibold rounded-none">Add Product</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light">{product ? "Edit Product" : "New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Title</label>
              <Input 
                required 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                className="rounded-none border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger className="rounded-none border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Price</label>
              <Input 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
                className="rounded-none border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Brand</label>
              <Input 
                value={formData.brand} 
                onChange={e => setFormData({...formData, brand: e.target.value})} 
                className="rounded-none border-border"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Affiliate URL</label>
              <Input 
                required 
                value={formData.affiliateUrl} 
                onChange={e => setFormData({...formData, affiliateUrl: e.target.value})} 
                className="rounded-none border-border"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Image URL</label>
              <Input 
                value={formData.imageUrl} 
                onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                className="rounded-none border-border"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Description</label>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="rounded-none border-border"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-none uppercase tracking-widest text-xs">
              Save Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LooksTable({ looks, isLoading }: { looks?: Look[], isLoading: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteLook();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this look?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          toast({ title: "Look deleted" });
        }
      });
    }
  };

  return (
    <div className="bg-background border border-border">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
        <h2 className="font-serif text-xl">Looks</h2>
        <LookDialog />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium tracking-widest">Title</th>
              <th className="px-6 py-4 font-medium tracking-widest">Products</th>
              <th className="px-6 py-4 font-medium tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground tracking-widest uppercase">
                  Loading...
                </td>
              </tr>
            ) : looks?.map((look) => (
              <tr key={look.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-6 py-4 font-medium">{look.title}</td>
                <td className="px-6 py-4 text-muted-foreground">{look.products?.length || 0} items</td>
                <td className="px-6 py-4 text-right">
                  <LookDialog look={look} />
                  <button 
                    onClick={() => handleDelete(look.id)}
                    className="text-xs uppercase tracking-widest text-destructive hover:text-destructive/80 ml-4"
                  >
                    Delete
                  </button>
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

  const [formData, setFormData] = useState({
    title: look?.title || "",
    description: look?.description || "",
    imageUrl: look?.imageUrl || "",
    productIds: look?.products?.map(p => p.id) || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (look) {
      updateMutation.mutate({ id: look.id, data: formData as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLooksQueryKey() });
          toast({ title: "Look updated" });
          setOpen(false);
        }
      });
    } else {
      createMutation.mutate({ data: formData as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          toast({ title: "Look created" });
          setOpen(false);
          setFormData({ title: "", description: "", imageUrl: "", productIds: [] });
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {look ? (
          <button className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">Edit</button>
        ) : (
          <Button className="text-xs uppercase tracking-widest font-semibold rounded-none">Add Look</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-none border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light">{look ? "Edit Look" : "New Look"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Title</label>
            <Input 
              required 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              className="rounded-none border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Image URL</label>
            <Input 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
              className="rounded-none border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Description</label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              className="rounded-none border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Product IDs (comma separated)</label>
            <Input 
              value={formData.productIds.join(",")} 
              onChange={e => {
                const ids = e.target.value.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                setFormData({...formData, productIds: ids});
              }} 
              className="rounded-none border-border"
              placeholder="1, 2, 3"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-none uppercase tracking-widest text-xs">
              Save Look
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
