import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Store, LogIn, User, Info } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showDefaultCredentials, setShowDefaultCredentials] = useState(true);
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // Check if admin user still has default password
  const { data: defaultCredentialsCheck } = useQuery({
    queryKey: ['/api/default-credentials-check'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/default-credentials-check");
        return await response.json();
      } catch (error) {
        // If the endpoint doesn't exist or fails, assume we should show credentials
        return { showDefault: true };
      }
    },
  });

  useEffect(() => {
    if (defaultCredentialsCheck) {
      setShowDefaultCredentials(defaultCredentialsCheck.showDefault);
    }
  }, [defaultCredentialsCheck]);

  // Redirect if already authenticated
  if (!isLoading && user) {
    setLocation("/");
    return null;
  }

  const loginMutation = useMutation({
    mutationFn: async (data: typeof loginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return await response.json();
    },
    onSuccess: (userData) => {
      // Update the user data in the cache
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans LogiFlow",
      });
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiant ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });



  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                <Store className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              LogiFlow
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Gestion des commandes et livraisons
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Connexion
              </CardTitle>
              <CardDescription>
                Connectez-vous à votre compte LogiFlow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-username">Identifiant</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    required
                    placeholder="Votre identifiant"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Default credentials info - only show if admin password hasn't been changed */}
          {showDefaultCredentials && (
            <Card className="mt-4 bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-sm">
                  <Info className="w-4 h-4" />
                  Première connexion
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Identifiant :</strong> admin</p>
                  <p><strong>Mot de passe :</strong> admin</p>
                  <p className="text-xs text-blue-600 mt-2">
                    Changez le mot de passe après votre première connexion
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
          <div className="text-center text-white max-w-md">
            <Store className="w-20 h-20 mx-auto mb-6 opacity-90" />
            <h1 className="text-4xl font-bold mb-4">
              Gérez vos commandes efficacement
            </h1>
            <p className="text-xl opacity-90 mb-8">
              LogiFlow centralise la gestion de vos commandes et livraisons across tous vos magasins
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Calendrier centralisé</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Gestion multi-magasins</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Suivi en temps réel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}