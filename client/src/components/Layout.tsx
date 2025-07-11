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
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-medium text-gray-800">LogiFlow</h1>
            </div>

            {/* Store selector for admin - moved to top right */}
            {user?.role === 'admin' && stores.length > 0 && (
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedStoreId?.toString() || "all"}
                  onValueChange={(value) => setSelectedStoreId(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="w-64 border border-gray-300 shadow-sm">
                    <SelectValue placeholder="Sélectionner un magasin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-green-500"></div>
                        <span>Tous les magasins</span>
                      </div>
                    </SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3" 
                            style={{ backgroundColor: store.color }}
                          />
                          <span>{store.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </StoreContext.Provider>
  );
}
