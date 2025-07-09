import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Store, LogIn, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

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
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return await response.json();
    },
    onSuccess: (userData) => {
      // Update the user data in the cache
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Compte créé",
        description: "Votre compte a été créé avec succès",
      });
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de création",
        description: error.message || "Erreur lors de la création du compte",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
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

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
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
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                        placeholder="votre@email.com"
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
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Inscription
                  </CardTitle>
                  <CardDescription>
                    Créez votre compte LogiFlow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="register-firstName">Prénom</Label>
                        <Input
                          id="register-firstName"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                          required
                          placeholder="Jean"
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-lastName">Nom</Label>
                        <Input
                          id="register-lastName"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                          required
                          placeholder="Dupont"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        required
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-password">Mot de passe</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                        placeholder="••••••••"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Création..." : "Créer le compte"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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