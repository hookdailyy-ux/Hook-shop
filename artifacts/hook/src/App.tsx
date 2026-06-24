import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/AppLayout";
import Home from "@/pages/Home";
import ShopTheLook from "@/pages/ShopTheLook";
import ShopTheLookKids from "@/pages/ShopTheLookKids";
import ShopTheLookCouples from "@/pages/ShopTheLookCouples";
import ShopTheSetup from "@/pages/ShopTheSetup";
import LookDetail from "@/pages/LookDetail";
import SetupDetail from "@/pages/SetupDetail";
import CategoryPage from "@/pages/CategoryPage";
import ProductDetail from "@/pages/ProductDetail";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import Favorites from "@/pages/Favorites";
import TeamLogin from "@/pages/TeamLogin";
import TeamChangePassword from "@/pages/TeamChangePassword";
import TeamDashboard from "@/pages/TeamDashboard";
import CollectionShare from "@/pages/CollectionShare";
import LookShare from "@/pages/LookShare";
import StorePage from "@/pages/StorePage";
import RankingsPage from "@/pages/RankingsPage";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { HeadManager } from "@/components/HeadManager";
import { TeamAuthProvider, useTeamAuth } from "@/contexts/TeamAuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { BasketProvider } from "@/contexts/BasketContext";
import { TeamMemberBar } from "@/components/TeamMemberBar";
import { BasketDrawer } from "@/components/BasketDrawer";
import BasketSharePage from "@/pages/BasketSharePage";
import { API_BASE } from "@/lib/apiBase";

// When API_BASE is an absolute URL (non-Replit host or explicit VITE_API_BASE_URL),
// configure generated API hooks to call that server directly.
if (API_BASE.startsWith("http")) setBaseUrl(API_BASE);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 0,
      refetchInterval: 2000,
    },
  },
});

function ProtectedAdminRoute() {
  const { authenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  if (!authenticated) {
    return <Redirect to="/admin/login" />;
  }

  return <AdminDashboard />;
}

function ProtectedTeamDashboard() {
  const { authenticated, isLoading, forcePasswordChange } = useTeamAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  if (!authenticated) return <Redirect to="/team/login" />;
  if (forcePasswordChange) return <Redirect to="/team/change-password" />;

  return <TeamDashboard />;
}

function ProtectedTeamChangePassword() {
  const { authenticated, isLoading } = useTeamAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  if (!authenticated) return <Redirect to="/team/login" />;

  return <TeamChangePassword />;
}

function Router() {
  const [location] = useLocation();
  const isTeamWorkspace = location.startsWith("/team");
  const isAdminWorkspace = location.startsWith("/admin");
  const showBasket = !isTeamWorkspace && !isAdminWorkspace;

  return (
    <>
      <Switch>
        {/* Admin routes — no AppLayout */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={ProtectedAdminRoute} />

        {/* Team member routes — no AppLayout */}
        <Route path="/team/login" component={TeamLogin} />
        <Route path="/team/change-password" component={ProtectedTeamChangePassword} />
        <Route path="/team" component={ProtectedTeamDashboard} />

        {/* Store pages — own header, no AppLayout */}
        <Route path="/store/:username" component={StorePage} />

        {/* Public routes — wrapped in AppLayout */}
        <Route>
          <AppLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/shop-the-look/:id" component={LookDetail} />
              <Route path="/shop-the-look" component={ShopTheLook} />
              <Route path="/shop-the-look-kids" component={ShopTheLookKids} />
              <Route path="/shop-the-look-couples" component={ShopTheLookCouples} />
              <Route path="/shop-the-setup/:id" component={SetupDetail} />
              <Route path="/shop-the-setup" component={ShopTheSetup} />
              <Route path="/women" component={() => <CategoryPage category="women" />} />
              <Route path="/men" component={() => <CategoryPage category="men" />} />
              <Route path="/couples" component={() => <CategoryPage category="couples" />} />
              <Route path="/kids" component={() => <CategoryPage category="kids" />} />
              <Route path="/sport" component={() => <Redirect to="/kids" />} />
              <Route path="/women-sport" component={() => <Redirect to="/women" />} />
              <Route path="/men-sport" component={() => <Redirect to="/men" />} />
              <Route
                path="/accessories"
                component={() => <CategoryPage category="accessories" />}
              />
              <Route
                path="/electronics"
                component={() => <CategoryPage category="electronics" />}
              />
              <Route
                path="/home-essentials"
                component={() => <CategoryPage category="home" />}
              />
              <Route path="/favorites" component={Favorites} />
              <Route path="/product/:id" component={ProductDetail} />
              <Route path="/c/:token" component={CollectionShare} />
              <Route path="/l/:token" component={LookShare} />
              <Route path="/rankings" component={RankingsPage} />
              <Route path="/basket/:token" component={BasketSharePage} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </Route>
      </Switch>

      {/* Basket drawer — visible on public pages only */}
      {showBasket && <BasketDrawer />}

      {/* Floating team member workspace bar — visible on public pages only */}
      {!isTeamWorkspace && <TeamMemberBar />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <TeamAuthProvider>
          <FavoritesProvider>
            <BasketProvider>
              <TooltipProvider>
                <HeadManager />
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/+$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </BasketProvider>
          </FavoritesProvider>
        </TeamAuthProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
