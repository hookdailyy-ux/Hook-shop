import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/AppLayout";
import Home from "@/pages/Home";
import ShopTheLook from "@/pages/ShopTheLook";
import ShopTheSetup from "@/pages/ShopTheSetup";
import CategoryPage from "@/pages/CategoryPage";
import ProductDetail from "@/pages/ProductDetail";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import Favorites from "@/pages/Favorites";
import TeamLogin from "@/pages/TeamLogin";
import TeamChangePassword from "@/pages/TeamChangePassword";
import TeamDashboard from "@/pages/TeamDashboard";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { TeamAuthProvider, useTeamAuth } from "@/contexts/TeamAuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { TeamMemberBar } from "@/components/TeamMemberBar";

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

        {/* Public routes — wrapped in AppLayout */}
        <Route>
          <AppLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/shop-the-look" component={ShopTheLook} />
              <Route path="/shop-the-setup" component={ShopTheSetup} />
              <Route path="/women" component={() => <CategoryPage category="women" />} />
              <Route path="/men" component={() => <CategoryPage category="men" />} />
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
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </Route>
      </Switch>

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
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </FavoritesProvider>
        </TeamAuthProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
