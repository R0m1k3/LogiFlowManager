import { Switch, Route } from "wouter";
import { useAuthProduction } from "@/hooks/useAuthProduction";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
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
import CustomerOrders from "@/pages/CustomerOrders";
import Layout from "@/components/Layout";

function RouterProduction() {
  const isProduction = import.meta.env.MODE === 'production';
  
  // Utiliser le hook d'auth spécialement optimisé pour la production
  const productionAuth = useAuthProduction();
  const developmentAuth = useAuth();
  
  const { isAuthenticated, isLoading, user } = isProduction ? productionAuth : developmentAuth;
  
  // Logger seulement les changements d'état importants
  if (isProduction) {
    // Logs minimaux en production
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      console.log(`🔐 Auth: ${isAuthenticated ? 'OK' : 'NONE'} | Loading: ${isLoading} | Page: ${window.location.pathname}`);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
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
          <Route path="/customer-orders" component={CustomerOrders} />
          <Route path="/roles" component={RoleManagement} />
          <Route path="/nocodb-config" component={NocoDBConfig} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default RouterProduction;