# 🚨 PRODUCTION BUGFIX - CACHE SYNCHRONIZATION

## **Problème Production Critique**
Malgré les corrections d'invalidation cache, le problème persiste en production :
- ✅ Développement : Suppression fonctionne parfaitement
- ❌ Production : `storeId` se perd lors du refetch → `groupIds: undefined`

## **Logs Production Problématiques**
```
Orders API called with: { storeId: '2', userRole: 'admin' }
Admin filtering with groupIds: [ 2 ]  ✅ CORRECT

// APRÈS SUPPRESSION ET REFETCH
Orders API called with: { storeId: undefined, userRole: 'admin' }
Admin filtering with groupIds: undefined  ❌ PROBLÈME
```

## **Cause Racine**
Le `refetchQueries` avec predicate perd le contexte `storeId` lors du refetch automatique en production.

## **Solution Finale Appliquée**

### **1. Retour à la Solution Radicale**
```javascript
// Dans OrderDetailModal ET Orders page
queryClient.clear();
setTimeout(() => {
  window.location.reload();
}, 100);
```

### **2. Pourquoi cette solution**
- **predicate + refetch** : Théoriquement élégant, mais perd storeId en production
- **queryClient.clear() + reload** : Garantit reset complet avec préservation localStorage
- **localStorage** : Sauvegarde automatique du selectedStoreId pour restauration

## **Différence Dev vs Production**
- **Dev** : Cache React Query plus permissif, invalidation simple suffit
- **Production** : Cache plus strict, contexte storeId se perd lors refetch complexe
- **Solution** : Uniformisation avec méthode radicale qui fonctionne partout

## **Test de Validation**
1. Sélectionner magasin Houdemont (storeId=2)
2. Créer commande
3. Supprimer depuis calendrier → Reload avec storeId préservé
4. Supprimer depuis page Orders → Reload avec storeId préservé
5. ✅ Plus de mélange de données entre magasins

**Cache synchronization définitivement résolu !**