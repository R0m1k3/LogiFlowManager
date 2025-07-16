import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";

// Hook d'authentification unifié qui s'adapte automatiquement
// En production utilise fetch direct, en développement utilise React Query
export function useAuthUnified() {
  // Détection d'environnement plus robuste
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname.includes('replit.dev') ||
     import.meta.env.DEV === true);

  // État pour la version production (fetch direct)
  const [productionUser, setProductionUser] = useState<any>(null);
  const [productionLoading, setProductionLoading] = useState(true);
  const [productionError, setProductionError] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Hook React Query pour le développement
  const developmentQuery = useQuery({
    queryKey: ["/api/user"],
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: isDevelopment, // Seulement en développement
  });

  // Fonction pour rafraîchir l'authentification en production
  const refreshAuth = () => {
    if (!isDevelopment) {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Authentification production (fetch direct)
  useEffect(() => {
    if (isDevelopment) return; // Ne pas exécuter en développement

    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        setProductionLoading(true);
        
        const response = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!isMounted) return;
        
        if (response.ok) {
          const userData = await response.json();
          if (isMounted) {
            setProductionUser(userData);
            setProductionError(null);
          }
        } else if (response.status === 401) {
          if (isMounted) {
            setProductionUser(null);
            setProductionError(null);
          }
        } else {
          throw new Error(`Auth failed: ${response.status}`);
        }
      } catch (err) {
        console.error('Production auth error:', err);
        if (isMounted) {
          setProductionError(err);
          setProductionUser(null);
        }
      } finally {
        if (isMounted) {
          setProductionLoading(false);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [isDevelopment, refreshTrigger]); // Ajout du refreshTrigger

  // Retourner les bonnes données selon l'environnement
  if (isDevelopment) {
    return {
      user: developmentQuery.data || null,
      isLoading: developmentQuery.isLoading,
      isAuthenticated: !!developmentQuery.data,
      error: developmentQuery.error,
      refreshAuth: () => developmentQuery.refetch(),
      environment: 'development'
    };
  } else {
    return {
      user: productionUser,
      isLoading: productionLoading,
      isAuthenticated: !!productionUser,
      error: productionError,
      refreshAuth: refreshAuth,
      environment: 'production'
    };
  }
}