# CORRECTION URGENTE - Problème Production Filtrage Magasin

## 🚨 Problème Identifié

**En production seulement** : Après suppression d'une commande dans Houdemont
- ✅ Calendrier enlève immédiatement la commande supprimée  
- ❌ **Calendrier affiche ensuite les données de Frouard** au lieu de rester sur Houdemont
- ❌ **Page commandes devient vide** au lieu d'afficher les commandes Houdemont restantes

## 🔧 Corrections Appliquées

### 1. Filtrage Modaux (✅ FAIT)
- `CreateOrderModal.tsx` : Filtre les groupes selon `selectedStoreId`
- `CreateDeliveryModal.tsx` : Même logique appliquée
- Reset automatique formulaire quand admin change de magasin

### 2. Solution Cache Hybride (✅ FAIT)
```javascript
// CHANGEMENT MAGASIN : Invalidation sélective
queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
queryClient.invalidateQueries({ queryKey: ['/api/stats/monthly'] });

// SUPPRESSION/CRÉATION : Solution radicale
queryClient.clear() + window.location.reload()
```

### 3. Logs Diagnostics (✅ FAIT)
- Calendar.tsx : Logs URL et paramètres API
- Orders.tsx : Logs invalidation cache
- Modaux : Logs sélection magasin

### 4. Solution Hybride (✅ NOUVEAU)
- **Changement magasin** : Invalidation douce (sélecteur fonctionne)
- **Suppression/création** : Nettoyage radical (cohérence garantie)

## 🧪 Tests à Effectuer

### En Production :
1. **Naviguer vers Houdemont** dans le sélecteur header
2. **Créer une commande** → Vérifier qu'elle apparaît dans Houdemont
3. **Supprimer la commande** → Vérifier que :
   - Le calendrier reste sur Houdemont (pas Frouard)
   - La page commandes reste filtrée Houdemont (pas vide)

### Logs à Surveiller :
```
📅 Calendar fetching orders: { selectedStoreId: 2, params: "storeId=2" }
🗑️ Order deleted, invalidating caches with: { selectedStoreId: 2 }
🏪 Admin store selection: { selectedStoreId: 2, defaultGroupId: "2" }
```

## 🎯 Résultat Attendu

Après suppression d'une commande Houdemont :
- ✅ Calendrier reste filtré sur Houdemont  
- ✅ Page commandes affiche autres commandes Houdemont
- ✅ Modal création pré-sélectionne Houdemont
- ✅ Cohérence développement ↔ production

## 📝 Note

Le problème venait de l'invalidation cache incomplète en production. Les queryKey n'incluaient pas le `selectedStoreId`, donc React Query ne pouvait pas différencier les données par magasin.