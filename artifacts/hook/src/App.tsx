import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/AppLayout";
import Home from "@/pages/Home";
import ShopTheLook from "@/pages/ShopTheLook";
import CategoryPage from "@/pages/CategoryPage";
import ProductDetail from "@/pages/ProductDetail";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedAdminRoute() {
  const { authenticated, isLoading } = useAdminAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!authenticated) {
    return <Redirect to="/admin/login" />;
  }

  return <AdminDashboard />;
}

function Router() {
  return (
    <Switch>
      {/* Admin routes — no AppLayout chrome */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={ProtectedAdminRoute} />

      {/* Public routes — wrapped in AppLayout */}
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/shop-the-look" component={ShopTheLook} />
            <Route path="/women" component={() => <CategoryPage category="women" />} />
            <Route path="/men" component={() => <CategoryPage category="men" />} />
            <Route path="/electronics" component={() => <CategoryPage category="electronics" />} />
            <Route path="/home-essentials" component={() => <CategoryPage category="home" />} />
            <Route path="/product/:id" component={ProductDetail} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
