# 🚨 CORRECTION BUG PRODUCTION - FILTRAGE MAGASIN

## **Problème Identifié**
En production, le sélecteur magasin ne filtre PAS les données :
- ✅ **Dev** : `storeId=2` → Affiche seulement Houdemont  
- ❌ **Prod** : `storeId=2` → Affiche TOUS les magasins (`groupIds: undefined`)

## **Cause Racine**
```javascript
// AVANT (bugué)
groupIds = storeId ? [parseInt(storeId as string)] : undefined;

// APRÈS (corrigé)  
if (storeId && storeId !== 'undefined' && storeId !== 'null') {
  groupIds = [parseInt(storeId as string)];
} else {
  groupIds = undefined;
}
```

## **Corrections Appliquées**

### **1. Route Orders (/api/orders)**
- ✅ Logs détaillés : `storeId`, `storeIdType`, `fullQuery`
- ✅ Validation stricte : `storeId !== 'undefined'` et `storeId !== 'null'`
- ✅ Messages explicites : "Admin filtering with groupIds: [2] from storeId: 2"

### **2. Route Deliveries (/api/deliveries)**  
- ✅ Même logique de validation que Orders
- ✅ Logs cohérents pour diagnostic
- ✅ Filtrage identique dev/production

## **Impact**
- **AVANT** : Suppression commande Houdemont → Reste visible (bug!)
- **APRÈS** : Suppression commande Houdemont → Disparaît (cohérent!)

## **Test Requis en Production**
1. Sélectionner **Houdemont** dans header
2. Vérifier logs : `Admin filtering with groupIds: [2]` 
3. Créer/supprimer commande
4. Vérifier cohérence calendrier ↔ page commandes

**Plus de mélange de données entre magasins !**