import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Calendar from "@/pages/Calendar";
import Orders from "@/pages/Orders";
import Deliveries from "@/pages/Deliveries";
import Suppliers from "@/pages/Suppliers";
import Groups from "@/pages/Groups";
import Users from "@/pages/Users";
import BLReconciliation from "@/pages/BLReconciliation";
import Publicities from "@/pages/Publicities";
import RoleManagement from "@/pages/RoleManagement";
import NocoDBConfig from "@/pages/NocoDBConfig";
import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true' || import.meta.env.MODE === 'development';

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={AuthPage} />
        </>
      ) : (
        <Layout>
          <Route path="/" component={Calendar} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/orders" component={Orders} />
          <Route path="/deliveries" component={Deliveries} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/groups" component={Groups} />
          <Route path="/users" component={Users} />
          <Route path="/bl-reconciliation" component={BLReconciliation} />
          <Route path="/publicities" component={Publicities} />
          <Route path="/roles" component={RoleManagement} />
          <Route path="/nocodb-config" component={NocoDBConfig} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
