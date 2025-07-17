# 🚨 HOTFIX PRODUCTION - INVALIDATION CACHE UNIVERSELLE

## **Problème Identifié**
Suppression depuis calendrier fonctionne, mais depuis page Orders reste visible en production.

**Cause** : Invalidation cache incohérente entre composants

## **Solution Appliquée**

### **1. OrderDetailModal.tsx (Calendrier)**
```javascript
// AVANT (simple)
queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });

// APRÈS (predicate universel)
queryClient.invalidateQueries({
  predicate: (query) => {
    const key = query.queryKey[0]?.toString() || '';
    return key.includes('/api/orders') || key.includes('/api/deliveries');
  }
});

queryClient.refetchQueries({
  predicate: (query) => {
    const key = query.queryKey[0]?.toString() || '';
    return key.includes('/api/orders') || key.includes('/api/deliveries');
  }
});
```

### **2. Orders.tsx (Page Commandes)**
```javascript
// AVANT (radical avec reload)
queryClient.clear();
window.location.reload();

// APRÈS (predicate cohérent)
queryClient.invalidateQueries({ predicate: ... });
queryClient.refetchQueries({ predicate: ... });
```

## **Pourquoi cette solution**
- **Predicate** capture TOUTES les variantes de queryKey :
  - `/api/orders`
  - `/api/orders?storeId=2` 
  - `["/api/orders", 2]`
  - `/api/deliveries?startDate=...`

- **refetchQueries** force la récupération immédiate (production)
- **Plus de reload** → UX fluide
- **Cohérence** entre calendrier et pages

## **Test de Validation**
1. ✅ Supprimer depuis calendrier → Disparaît partout
2. ✅ Supprimer depuis page Orders → Disparaît partout  
3. ✅ Sélecteur magasin reste stable
4. ✅ Pas de reload intempestif

**Invalidation cache universelle appliquée !**