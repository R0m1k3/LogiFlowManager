# CORRECTION PRODUCTION URGENTE - LogiFlow

## Problèmes Identifiés

### 1. Modal Création Commande - Magasin Incorrect
**Symptôme** : Le modal de création de commande affiche toujours "Frouard" même quand "Houdemont" est sélectionné dans le header
**Cause** : Le filtrage par magasin en production ne fonctionne pas correctement dans le modal
**Impact** : Utilisateur ne peut pas créer de commandes pour le bon magasin

### 2. Suppression Commandes - Pas de Rafraîchissement
**Symptôme** : Après suppression d'une commande, la page ne se rafraîchit pas automatiquement
**Cause** : Cache invalidation utilise des queryKey incorrectes qui ne correspondent pas aux requêtes avec storeId
**Impact** : L'utilisateur doit rafraîchir manuellement pour voir les changements

## Corrections Appliquées

### ✅ Invalidation Cache Améliorée (Orders.tsx)
```javascript
// Avant
queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

// Après  
queryClient.invalidateQueries({ queryKey: [ordersUrl, selectedStoreId] });
queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
queryClient.invalidateQueries({ queryKey: ['/api/stats/monthly'] });
queryClient.refetchQueries({ queryKey: [ordersUrl, selectedStoreId] });
```

### ✅ Logs Diagnostics Ajoutés (routes.production.ts)
- Logs détaillés dans routes GET /api/orders avec startDate, endDate, storeId
- Logs dans routes DELETE /api/orders/:id pour tracer les suppressions
- Identification problème : storeId = undefined en production

### ✅ Gestion Livraisons Liées (storage.production.ts)
- deleteOrder() vérifie maintenant les livraisons liées avant suppression
- Supprime automatiquement les liaisons order_id des livraisons
- Logs détaillés du processus de suppression

### ✅ Logs Modal Création (CreateOrderModal.tsx) 
- Logs détaillés de la sélection automatique de magasin
- Identification des groupes disponibles et logique de sélection
- Logs de création de commande avec données

## Tests Nécessaires

1. **Test Sélection Magasin** : Changer magasin dans header → Ouvrir modal création → Vérifier magasin affiché
2. **Test Suppression** : Supprimer commande → Vérifier rafraîchissement automatique de la liste
3. **Test Filtrage** : Vérifier que le filtrage par magasin fonctionne correctement en production

## Prochaines Étapes

1. Tester en développement pour valider les corrections
2. Identifier pourquoi selectedStoreId n'est pas transmis correctement en production
3. Corriger le bug de sélection de magasin dans le modal
4. Valider que toutes les corrections fonctionnent en production

Date: 17 juillet 2025
État: En cours de correction