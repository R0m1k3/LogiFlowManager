import { ReactNode, useState, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LogOut, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import type { Group } from "@shared/schema";

interface StoreContextType {
  selectedStoreId: number | null;
  setSelectedStoreId: (storeId: number | null) => void;
  stores: Group[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const { data: stores = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    enabled: !!user,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <StoreContext.Provider value={{ selectedStoreId, setSelectedStoreId, stores }}>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header with store selector for admin */}
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">LogiFlow</h1>
              
              {/* Store selector for admin */}
              {user?.role === 'admin' && stores.length > 0 && (
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedStoreId?.toString() || "all"}
                    onValueChange={(value) => setSelectedStoreId(value === "all" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sélectionner un magasin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les magasins</SelectItem>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* User info and logout */}
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <div className="font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-muted-foreground capitalize">
                  {user?.role}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </StoreContext.Provider>
  );
}
