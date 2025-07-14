import { useState, useEffect } from 'react';

// Hook d'authentification spécialement optimisé pour la production
// Évite les problèmes de React Query qui causent le flickering
export function useAuthProduction() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (!isMounted) return;
        
        if (response.ok) {
          const userData = await response.json();
          if (isMounted) {
            setUser(userData);
            setError(null);
          }
        } else if (response.status === 401) {
          if (isMounted) {
            setUser(null);
            setError(null);
          }
        } else {
          throw new Error(`Authentication check failed: ${response.status}`);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        if (isMounted) {
          setError(err);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}