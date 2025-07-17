# 🔄 SOLUTION HYBRIDE - PRÉSERVATION CONTEXTE MAGASIN

## **Problème Identifié**
Le `queryClient.clear() + reload` résout l'incohérence cache MAIS cause perte du contexte magasin :
1. ✅ Suppression fonctionne
2. ❌ selectedStoreId se perd temporairement
3. ❌ Affichage toutes données pendant restauration

## **Timing Issue Détecté**
```
1. User supprime commande Houdemont (storeId=2)
2. queryClient.clear() + reload 
3. Layout.tsx restaure localStorage: selectedStoreId=2
4. ⚠️  MAIS queries se lancent AVANT restauration complète
5. Résultat: Affichage temporaire toutes données
```

## **Solution Hybride Appliquée**

### **Changement de Stratégie**
```javascript
// ANCIEN (radical mais perte contexte)
queryClient.clear();
window.location.reload();

// NOUVEAU (sélectif avec préservation contexte)
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

### **Avantages Solution Hybride**
- 🎯 **Invalidation ciblée** : Seules les données orders/deliveries
- 💾 **Préservation contexte** : selectedStoreId reste intact
- 🚀 **Pas de reload** : UX fluide sans clignotement
- 🔄 **Refetch immédiat** : Synchronisation garantie
- 🏪 **Magasin stable** : Plus de basculement vers "toutes données"

## **Logs Debug Ajoutés**
```
🏪 Layout - Restoring selectedStoreId from localStorage: { saved: "2", restoredId: 2 }
💾 Store saved to localStorage: 2
🧹 Using selective invalidation to preserve storeId context...
```

## **Test de Validation**
1. ✅ Sélectionner Houdemont 
2. ✅ Créer commande → Visible uniquement Houdemont
3. ✅ Supprimer commande → Disparaît sans changer contexte
4. ✅ Sélecteur reste sur Houdemont
5. ✅ Pas d'affichage temporaire autres magasins

**Contexte magasin définitivement préservé !**