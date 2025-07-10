import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  Calendar, 
  BarChart3, 
  Package, 
  Truck, 
  Building, 
  Users, 
  UserCog, 
  LogOut,
  FileText 
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      // Force logout via fetch to ensure session is destroyed
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Force redirect to auth page regardless of API response
      window.location.href = "/auth";
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    { 
      path: "/dashboard", 
      label: "Tableau de bord", 
      icon: BarChart3, 
      roles: ["admin", "manager", "employee"] 
    },
    { 
      path: "/calendar", 
      label: "Calendrier", 
      icon: Calendar, 
      roles: ["admin", "manager", "employee"] 
    },
    { 
      path: "/orders", 
      label: "Commandes", 
      icon: Package, 
      roles: ["admin", "manager", "employee"] 
    },
    { 
      path: "/deliveries", 
      label: "Livraisons", 
      icon: Truck, 
      roles: ["admin", "manager", "employee"] 
    },
    { 
      path: "/bl-reconciliation", 
      label: "Rapprochement", 
      icon: FileText, 
      roles: ["admin", "manager"] 
    },
  ];

  const managementItems = [
    { 
      path: "/suppliers", 
      label: "Fournisseurs", 
      icon: Building, 
      roles: ["admin", "manager"] 
    },
    { 
      path: "/groups", 
      label: "Groupes/Magasins", 
      icon: Users, 
      roles: ["admin", "manager"] 
    },
    { 
      path: "/users", 
      label: "Utilisateurs", 
      icon: UserCog, 
      roles: ["admin"] 
    },
  ];

  const hasPermission = (roles: string[]) => {
    return user?.role && roles.includes(user.role);
  };

  return (
    <aside className="w-64 bg-white border-r-4 border-gray-400 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b-4 border-gray-400 bg-blue-100">
        <div className="flex items-center space-x-3">
          <Store className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-black text-gray-900 uppercase tracking-wide">LogiFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 bg-gray-50">
        <div className="space-y-3">
          {menuItems.map((item) => {
            if (!item.roles.includes(user?.role || '')) return null;
            
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center px-4 py-3 text-sm font-bold border-2 transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-blue-800 shadow-md'
                      : 'text-gray-700 hover:bg-gray-200 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Management Section */}
        {managementItems.some(item => item.roles.includes(user?.role || '')) && (
          <>
            <div className="mt-8 mb-4">
              <h3 className="px-4 text-xs font-black text-gray-800 uppercase tracking-wider border-b-2 border-gray-300 pb-2">
                Gestion
              </h3>
            </div>
            <div className="space-y-3">
              {managementItems.map((item) => {
                if (!item.roles.includes(user?.role || '')) return null;
                
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`flex items-center px-4 py-3 text-sm font-bold border-2 transition-colors ${
                        active
                          ? 'bg-blue-600 text-white border-blue-800 shadow-md'
                          : 'text-gray-700 hover:bg-gray-200 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t-4 border-gray-400 p-4 bg-gray-100">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-10 w-10 bg-blue-200 border-2 border-blue-400 flex items-center justify-center">
            <span className="text-sm font-black text-blue-800">
              {getInitials(user?.firstName, user?.lastName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs font-medium text-gray-600 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleLogout}
          className="w-full justify-start bg-red-600 hover:bg-red-800 text-white font-bold border-2 border-red-800"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
